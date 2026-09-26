"""Mixed-enterprise snippet: JWT RS256, AWS KMS, nginx TLS ciphers."""
import boto3


def issue_token(payload: dict, pem: str) -> bytes:
    kms = boto3.client("kms")
    kms.generate_data_key(KeyId="alias/app-keys", KeySpec="AES_256")
    # jwt.sign(payload, pem, { algorithm: "RS256" })
    return payload, pem


NGINX_TLS = """
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:RC4-SHA;
ssl_protocols TLSv1.2 TLSv1.3;
"""
