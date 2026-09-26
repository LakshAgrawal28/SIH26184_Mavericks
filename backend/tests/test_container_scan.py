"""Container image (`docker save`) ingestion tests."""
from __future__ import annotations

import io
import json
import tarfile
from pathlib import Path

import pytest

from scanner.detectors.pipeline import ingest_container_image_tar, prepare_scan_tree, run_all_detectors

ROOT = Path(__file__).resolve().parents[2]
FIXTURES = Path(__file__).resolve().parent / "fixtures"


def _write_layer_tar(path: Path, files: dict[str, bytes]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tarfile.open(path, "w") as tf:
        for name, data in files.items():
            info = tarfile.TarInfo(name=name)
            info.size = len(data)
            tf.addfile(info, io.BytesIO(data))


def build_minimal_docker_save_tar(dest: Path) -> Path:
    """Two-layer docker save fixture: base app + overlay cert (later layer wins)."""
    FIXTURES.mkdir(parents=True, exist_ok=True)
    staging = FIXTURES / "_build_container_image"
    if staging.exists():
        import shutil

        shutil.rmtree(staging)
    staging.mkdir(parents=True)

    layer0 = staging / "layer0" / "layer.tar"
    _write_layer_tar(
        layer0,
        {
            "app/legacy_crypto.c": b'EVP_EncryptInit_ex(ctx, EVP_aes_256_cbc(), NULL, key, iv);\n',
            "app/readme.txt": b"base layer\n",
        },
    )

    pem = (ROOT / "scanner" / "corpus" / "openssl-certs" / "rsa-2048.pem").read_bytes()
    layer1 = staging / "layer1" / "layer.tar"
    _write_layer_tar(
        layer1,
        {
            "etc/ssl/certs/server.pem": pem,
            "app/readme.txt": b"overlay layer\n",
        },
    )

    manifest = [
        {
            "Config": "config.json",
            "RepoTags": ["ecdat/fixture:latest"],
            "Layers": ["layer0/layer.tar", "layer1/layer.tar"],
        }
    ]
    (staging / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
    (staging / "config.json").write_text("{}", encoding="utf-8")

    with tarfile.open(dest, "w") as outer:
        for path in sorted(staging.rglob("*")):
            if path.is_file():
                outer.add(path, arcname=str(path.relative_to(staging)))
    return dest


@pytest.fixture(scope="module")
def docker_save_tar(tmp_path_factory) -> Path:
    path = FIXTURES / "minimal-docker-save.tar"
    if not path.is_file():
        build_minimal_docker_save_tar(path)
    return path


def test_merge_container_layers_finds_overlay_cert_and_source(docker_save_tar, tmp_path):
    merged = tmp_path / "merged"
    ingest_container_image_tar(docker_save_tar, merged)

    assert (merged / "app" / "legacy_crypto.c").is_file()
    assert (merged / "etc" / "ssl" / "certs" / "server.pem").is_file()
    assert (merged / "app" / "readme.txt").read_text(encoding="utf-8") == "overlay layer\n"

    findings = run_all_detectors(merged)
    blob = " ".join(f"{f.algorithm} {f.name} {f.asset_type}" for f in findings).upper()
    assert "AES" in blob
    assert "CERTIFICATE" in blob or "X.509" in blob


def test_prepare_scan_tree_container_target_type(docker_save_tar, tmp_path):
    extract = tmp_path / "src"
    count = prepare_scan_tree(docker_save_tar, extract, target_type="container_image")
    assert count >= 3
    findings = run_all_detectors(extract)
    assert len(findings) >= 2


def test_nested_tar_inside_zip_extracts(tmp_path):
    import zipfile

    inner = tmp_path / "payload.tar"
    _write_layer_tar(inner, {"nested/hello.txt": b"EVP_md5()\n"})

    outer = tmp_path / "bundle.zip"
    with zipfile.ZipFile(outer, "w") as zf:
        zf.write(inner, "payload.tar")

    extract = tmp_path / "out"
    count = prepare_scan_tree(outer, extract, target_type="zip_archive")
    assert count >= 1
    assert (extract / "payload_unpacked" / "nested" / "hello.txt").is_file() or any(
        extract.rglob("hello.txt")
    )
