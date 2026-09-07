"""Typical GitHub service — Node + Python + Spring YAML + Go + lockfile + keystore name."""
import hashlib
import ssl
import jwt
from cryptography.hazmat.primitives.asymmetric import rsa

def weak():
    hashlib.md5(b"x").hexdigest()
    ssl._create_unverified_context()
    jwt.encode({"sub": "1"}, "secret", algorithm="HS256")
    rsa.generate_private_key(public_exponent=65537, key_size=2048)
