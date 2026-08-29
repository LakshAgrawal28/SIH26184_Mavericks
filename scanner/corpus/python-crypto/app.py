import hashlib
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

def hash_password(data: bytes) -> str:
    return hashlib.md5(data).hexdigest()

def encrypt(key: bytes, iv: bytes, plaintext: bytes):
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    return cipher

# JWT reference
TOKEN_ALG = "RS256"
