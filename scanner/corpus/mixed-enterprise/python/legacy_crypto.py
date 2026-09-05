"""Legacy Python crypto in the mixed-enterprise fixture."""
import hashlib
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes


def hash_password(data: bytes) -> str:
    return hashlib.md5(data).hexdigest()


def encrypt_cbc(key: bytes, iv: bytes, plaintext: bytes):
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    encryptor = cipher.encryptor()
    return encryptor.update(plaintext) + encryptor.finalize()
