import os
import json
import time
import base64
import hashlib
from Crypto.Cipher import AES, DES, PKCS1_OAEP
from Crypto.PublicKey import RSA
from Crypto.Util.Padding import pad, unpad
from Crypto.Random import get_random_bytes


# ──────────────────────────────────────────────
# Key Generation
# ──────────────────────────────────────────────

def generate_aes_key(key_size=256):
    return get_random_bytes(key_size // 8)


def generate_des_key():
    return get_random_bytes(8)


def generate_rsa_keypair(bits=2048):
    key = RSA.generate(bits)
    private_key = key.export_key()
    public_key = key.publickey().export_key()
    return private_key, public_key


# ──────────────────────────────────────────────
# AES Encryption / Decryption (CBC mode)
# ──────────────────────────────────────────────

def encrypt_aes(data: bytes, key: bytes) -> tuple:
    iv = get_random_bytes(AES.block_size)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    ciphertext = cipher.encrypt(pad(data, AES.block_size))
    return ciphertext, iv


def decrypt_aes(ciphertext: bytes, key: bytes, iv: bytes) -> bytes:
    cipher = AES.new(key, AES.MODE_CBC, iv)
    plaintext = unpad(cipher.decrypt(ciphertext), AES.block_size)
    return plaintext


# ──────────────────────────────────────────────
# DES Encryption / Decryption (CBC mode)
# ──────────────────────────────────────────────

def encrypt_des(data: bytes, key: bytes) -> tuple:
    iv = get_random_bytes(DES.block_size)
    cipher = DES.new(key, DES.MODE_CBC, iv)
    ciphertext = cipher.encrypt(pad(data, DES.block_size))
    return ciphertext, iv


def decrypt_des(ciphertext: bytes, key: bytes, iv: bytes) -> bytes:
    cipher = DES.new(key, DES.MODE_CBC, iv)
    plaintext = unpad(cipher.decrypt(ciphertext), DES.block_size)
    return plaintext


# ──────────────────────────────────────────────
# RSA Encryption / Decryption
# ──────────────────────────────────────────────

def encrypt_rsa(data: bytes, public_key_pem: bytes) -> bytes:
    rsa_key = RSA.import_key(public_key_pem)
    cipher = PKCS1_OAEP.new(rsa_key)
    return cipher.encrypt(data)


def decrypt_rsa(ciphertext: bytes, private_key_pem: bytes) -> bytes:
    rsa_key = RSA.import_key(private_key_pem)
    cipher = PKCS1_OAEP.new(rsa_key)
    return cipher.decrypt(ciphertext)


# ──────────────────────────────────────────────
# Hybrid Encryption (AES for data + RSA for key)
# ──────────────────────────────────────────────

def hybrid_encrypt(data: bytes, public_key_pem: bytes) -> tuple:
    aes_key = generate_aes_key(256)
    ciphertext, iv = encrypt_aes(data, aes_key)
    encrypted_aes_key = encrypt_rsa(aes_key, public_key_pem)
    return ciphertext, encrypted_aes_key, iv


def hybrid_decrypt(ciphertext: bytes, encrypted_aes_key: bytes,
                   iv: bytes, private_key_pem: bytes) -> bytes:
    aes_key = decrypt_rsa(encrypted_aes_key, private_key_pem)
    return decrypt_aes(ciphertext, aes_key, iv)


# ──────────────────────────────────────────────
# SHA-256 Hashing & Verification
# ──────────────────────────────────────────────

def compute_sha256(filepath: str) -> str:
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def compute_sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def verify_files(original_path: str, decrypted_path: str) -> tuple:
    hash_orig = compute_sha256(original_path)
    hash_dec = compute_sha256(decrypted_path)
    match = hash_orig == hash_dec
    return match, hash_orig, hash_dec


# ──────────────────────────────────────────────
# Metadata Save / Load
# ──────────────────────────────────────────────

def save_metadata(filepath: str, iv: bytes, algorithm: str,
                  original_hash: str, extra: dict = None):
    meta = {
        "algorithm": algorithm,
        "iv": base64.b64encode(iv).decode("utf-8"),
        "original_sha256": original_hash,
    }
    if extra:
        meta.update(extra)
    with open(filepath, "w") as f:
        json.dump(meta, f, indent=2)


def load_metadata(filepath: str) -> dict:
    with open(filepath, "r") as f:
        meta = json.load(f)
    meta["iv"] = base64.b64decode(meta["iv"])
    return meta


# ──────────────────────────────────────────────
# File-Level Encrypt / Decrypt
# ──────────────────────────────────────────────

def encrypt_file(input_path: str, output_dir: str, algorithm: str,
                 key: bytes = None, public_key_pem: bytes = None):
    with open(input_path, "rb") as f:
        data = f.read()

    original_hash = compute_sha256(input_path)
    basename = os.path.splitext(os.path.basename(input_path))[0]
    os.makedirs(output_dir, exist_ok=True)

    enc_path = os.path.join(output_dir, f"{basename}_encrypted.bin")
    meta_path = os.path.join(output_dir, f"{basename}_metadata.json")
    key_path = os.path.join(output_dir, f"{basename}_key.bin")

    start_time = time.perf_counter()

    if algorithm == "AES":
        if key is None:
            key = generate_aes_key()
        ciphertext, iv = encrypt_aes(data, key)
        with open(key_path, "wb") as f:
            f.write(key)
        save_metadata(meta_path, iv, "AES", original_hash,
                      {"key_size": len(key) * 8})

    elif algorithm == "DES":
        if key is None:
            key = generate_des_key()
        ciphertext, iv = encrypt_des(data, key)
        with open(key_path, "wb") as f:
            f.write(key)
        save_metadata(meta_path, iv, "DES", original_hash,
                      {"key_size": len(key) * 8})

    elif algorithm == "Hybrid":
        if public_key_pem is None:
            raise ValueError("Public key required for hybrid encryption")
        ciphertext, encrypted_aes_key, iv = hybrid_encrypt(data, public_key_pem)
        enc_key_path = os.path.join(output_dir, f"{basename}_encrypted_aes_key.bin")
        with open(enc_key_path, "wb") as f:
            f.write(encrypted_aes_key)
        save_metadata(meta_path, iv, "Hybrid", original_hash,
                      {"encrypted_aes_key_file": enc_key_path})
    else:
        raise ValueError(f"Unknown algorithm: {algorithm}")

    elapsed = time.perf_counter() - start_time

    with open(enc_path, "wb") as f:
        f.write(ciphertext)

    ciphertext_b64 = base64.b64encode(ciphertext).decode("utf-8")

    return {
        "encrypted_file": enc_path,
        "metadata_file": meta_path,
        "algorithm": algorithm,
        "original_hash": original_hash,
        "ciphertext_size": len(ciphertext),
        "encryption_time": elapsed,
        "ciphertext_b64_preview": ciphertext_b64[:200] + "..." if len(ciphertext_b64) > 200 else ciphertext_b64,
    }


def decrypt_file(encrypted_path: str, meta_path: str, output_dir: str,
                 key: bytes = None, private_key_pem: bytes = None):
    meta = load_metadata(meta_path)
    algorithm = meta["algorithm"]
    iv = meta["iv"]
    original_hash = meta["original_sha256"]

    with open(encrypted_path, "rb") as f:
        ciphertext = f.read()

    os.makedirs(output_dir, exist_ok=True)
    basename = os.path.basename(encrypted_path).replace("_encrypted.bin", "")
    dec_path = os.path.join(output_dir, f"{basename}_decrypted.csv")

    start_time = time.perf_counter()

    if algorithm == "AES":
        if key is None:
            raise ValueError("AES key required for decryption")
        plaintext = decrypt_aes(ciphertext, key, iv)

    elif algorithm == "DES":
        if key is None:
            raise ValueError("DES key required for decryption")
        plaintext = decrypt_des(ciphertext, key, iv)

    elif algorithm == "Hybrid":
        if private_key_pem is None:
            raise ValueError("RSA private key required for hybrid decryption")
        enc_key_file = meta.get("encrypted_aes_key_file")
        with open(enc_key_file, "rb") as f:
            encrypted_aes_key = f.read()
        plaintext = hybrid_decrypt(ciphertext, encrypted_aes_key, iv, private_key_pem)

    else:
        raise ValueError(f"Unknown algorithm: {algorithm}")

    elapsed = time.perf_counter() - start_time

    with open(dec_path, "wb") as f:
        f.write(plaintext)

    decrypted_hash = compute_sha256(dec_path)
    match = original_hash == decrypted_hash

    return {
        "decrypted_file": dec_path,
        "algorithm": algorithm,
        "decryption_time": elapsed,
        "original_hash": original_hash,
        "decrypted_hash": decrypted_hash,
        "verification": "SUCCESS" if match else "FAILED",
    }


# ──────────────────────────────────────────────
# AES vs DES Comparison
# ──────────────────────────────────────────────

def compare_algorithms(input_path: str) -> dict:
    with open(input_path, "rb") as f:
        data = f.read()

    original_size = len(data)

    aes_key = generate_aes_key()
    des_key = generate_des_key()

    # AES encryption
    aes_enc_start = time.perf_counter()
    aes_ct, aes_iv = encrypt_aes(data, aes_key)
    aes_enc_time = time.perf_counter() - aes_enc_start

    # AES decryption
    aes_dec_start = time.perf_counter()
    aes_pt = decrypt_aes(aes_ct, aes_key, aes_iv)
    aes_dec_time = time.perf_counter() - aes_dec_start

    # DES encryption
    des_enc_start = time.perf_counter()
    des_ct, des_iv = encrypt_des(data, des_key)
    des_enc_time = time.perf_counter() - des_enc_start

    # DES decryption
    des_dec_start = time.perf_counter()
    des_pt = decrypt_des(des_ct, des_key, des_iv)
    des_dec_time = time.perf_counter() - des_dec_start

    return {
        "original_size": original_size,
        "AES": {
            "key_size_bits": len(aes_key) * 8,
            "block_size_bits": AES.block_size * 8,
            "ciphertext_size": len(aes_ct),
            "encryption_time_ms": round(aes_enc_time * 1000, 4),
            "decryption_time_ms": round(aes_dec_time * 1000, 4),
            "decryption_valid": aes_pt == data,
            "security_note": "AES-256 is the current industry standard. Approved by NIST, no known practical attacks.",
        },
        "DES": {
            "key_size_bits": len(des_key) * 8,
            "block_size_bits": DES.block_size * 8,
            "ciphertext_size": len(des_ct),
            "encryption_time_ms": round(des_enc_time * 1000, 4),
            "decryption_time_ms": round(des_dec_time * 1000, 4),
            "decryption_valid": des_pt == data,
            "security_note": "DES uses a 56-bit effective key. It is deprecated and vulnerable to brute-force attacks.",
        },
    }


# ──────────────────────────────────────────────
# RSA Key Save / Load helpers
# ──────────────────────────────────────────────

def save_rsa_keys(private_pem: bytes, public_pem: bytes, keys_dir: str):
    os.makedirs(keys_dir, exist_ok=True)
    priv_path = os.path.join(keys_dir, "rsa_private.pem")
    pub_path = os.path.join(keys_dir, "rsa_public.pem")
    with open(priv_path, "wb") as f:
        f.write(private_pem)
    with open(pub_path, "wb") as f:
        f.write(public_pem)
    return priv_path, pub_path


def load_rsa_keys(keys_dir: str) -> tuple:
    priv_path = os.path.join(keys_dir, "rsa_private.pem")
    pub_path = os.path.join(keys_dir, "rsa_public.pem")
    with open(priv_path, "rb") as f:
        private_pem = f.read()
    with open(pub_path, "rb") as f:
        public_pem = f.read()
    return private_pem, public_pem
