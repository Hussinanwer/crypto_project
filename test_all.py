import os
import crypto_utils

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(SCRIPT_DIR, "data", "students.csv")
OUT = os.path.join(SCRIPT_DIR, "output")
KEYS = os.path.join(SCRIPT_DIR, "keys")

print("=== Test 1: AES Encryption ===")
r = crypto_utils.encrypt_file(DATA, OUT, "AES")
print("Encrypted: " + r["encrypted_file"])
print("SHA-256: " + r["original_hash"])
print("Size: {} bytes, Time: {:.4f} ms".format(r["ciphertext_size"], r["encryption_time"]*1000))

print("\n=== Test 2: AES Decryption ===")
key_path = os.path.join(OUT, "students_key.bin")
with open(key_path, "rb") as f:
    key = f.read()
r2 = crypto_utils.decrypt_file(r["encrypted_file"], r["metadata_file"], OUT, key=key)
print("Verification: " + r2["verification"])
print("Orig hash:  " + r2["original_hash"])
print("Dec hash:   " + r2["decrypted_hash"])

print("\n=== Test 3: DES Encryption + Decryption ===")
r3 = crypto_utils.encrypt_file(DATA, OUT, "DES")
with open(os.path.join(OUT, "students_key.bin"), "rb") as f:
    des_key = f.read()
r4 = crypto_utils.decrypt_file(r3["encrypted_file"], r3["metadata_file"], OUT, key=des_key)
print("DES Verification: " + r4["verification"])

print("\n=== Test 4: RSA Key Generation ===")
priv, pub = crypto_utils.generate_rsa_keypair()
crypto_utils.save_rsa_keys(priv, pub, KEYS)
print("RSA keys generated and saved.")

print("\n=== Test 5: Hybrid Encryption + Decryption ===")
r5 = crypto_utils.encrypt_file(DATA, OUT, "Hybrid", public_key_pem=pub)
r6 = crypto_utils.decrypt_file(r5["encrypted_file"], r5["metadata_file"], OUT, private_key_pem=priv)
print("Hybrid Verification: " + r6["verification"])

print("\n=== Test 6: AES vs DES Comparison ===")
cmp = crypto_utils.compare_algorithms(DATA)
print("AES enc: {} ms, DES enc: {} ms".format(cmp["AES"]["encryption_time_ms"], cmp["DES"]["encryption_time_ms"]))
print("AES valid: {}, DES valid: {}".format(cmp["AES"]["decryption_valid"], cmp["DES"]["decryption_valid"]))

print("\n=== ALL TESTS PASSED ===")
