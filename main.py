import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, "data")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "output")
KEYS_DIR = os.path.join(SCRIPT_DIR, "keys")
DEFAULT_INPUT = os.path.join(DATA_DIR, "students.csv")


def cli_mode():
    import crypto_utils

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(KEYS_DIR, exist_ok=True)

    while True:
        print("\n" + "=" * 55)
        print("   Cryptography Lib Lab - CLI Menu")
        print("=" * 55)
        print("  1. Encrypt file (AES)")
        print("  2. Encrypt file (DES)")
        print("  3. Decrypt file (AES or DES)")
        print("  4. Hybrid Encrypt (AES + RSA)")
        print("  5. Hybrid Decrypt (AES + RSA)")
        print("  6. Compare AES vs DES")
        print("  7. Generate RSA Key Pair")
        print("  0. Exit")
        print("-" * 55)

        choice = input("Select option: ").strip()

        if choice == "1":
            _cli_encrypt("AES")
        elif choice == "2":
            _cli_encrypt("DES")
        elif choice == "3":
            _cli_decrypt()
        elif choice == "4":
            _cli_hybrid_encrypt()
        elif choice == "5":
            _cli_hybrid_decrypt()
        elif choice == "6":
            _cli_compare()
        elif choice == "7":
            _cli_gen_rsa()
        elif choice == "0":
            print("Goodbye!")
            break
        else:
            print("Invalid option.")


def _get_input_path():
    path = input(f"Input file path [{DEFAULT_INPUT}]: ").strip()
    if not path:
        path = DEFAULT_INPUT
    if not os.path.isfile(path):
        print(f"File not found: {path}")
        return None
    return path


def _cli_encrypt(algo):
    import crypto_utils
    path = _get_input_path()
    if not path:
        return

    print(f"\nOriginal file loaded: {path}")
    result = crypto_utils.encrypt_file(path, OUTPUT_DIR, algo)
    print(f"{algo} key generated successfully.")
    print(f"File encrypted successfully: {result['encrypted_file']}")
    print(f"Original SHA-256: {result['original_hash']}")
    print(f"Ciphertext size:  {result['ciphertext_size']} bytes")
    print(f"Encryption time:  {result['encryption_time']*1000:.4f} ms")
    print(f"\nBase64 preview:\n{result['ciphertext_b64_preview']}")


def _cli_decrypt():
    import crypto_utils
    enc_path = input(f"Encrypted file path: ").strip()
    meta_path = input(f"Metadata JSON path: ").strip()
    key_path = input(f"Key file path: ").strip()

    if not all(os.path.isfile(p) for p in [enc_path, meta_path, key_path]):
        print("One or more files not found.")
        return

    with open(key_path, "rb") as f:
        key = f.read()

    result = crypto_utils.decrypt_file(enc_path, meta_path, OUTPUT_DIR, key=key)
    print(f"\nFile decrypted successfully: {result['decrypted_file']}")
    print(f"Decryption time:    {result['decryption_time']*1000:.4f} ms")
    print(f"Original SHA-256:   {result['original_hash']}")
    print(f"Decrypted SHA-256:  {result['decrypted_hash']}")
    print(f"\nVerification result: {result['verification']} - "
          + ("decrypted file matches the original file."
             if result['verification'] == 'SUCCESS'
             else "FILES DO NOT MATCH!"))


def _cli_hybrid_encrypt():
    import crypto_utils
    path = _get_input_path()
    if not path:
        return

    pub_path = os.path.join(KEYS_DIR, "rsa_public.pem")
    if not os.path.isfile(pub_path):
        print("RSA public key not found. Generate keys first (option 7).")
        return

    with open(pub_path, "rb") as f:
        public_key = f.read()

    print(f"\nOriginal file loaded: {path}")
    result = crypto_utils.encrypt_file(path, OUTPUT_DIR, "Hybrid",
                                       public_key_pem=public_key)
    print("Hybrid encryption complete (AES-256 data + RSA-2048 key).")
    print(f"Encrypted file:   {result['encrypted_file']}")
    print(f"Original SHA-256: {result['original_hash']}")
    print(f"Encryption time:  {result['encryption_time']*1000:.4f} ms")


def _cli_hybrid_decrypt():
    import crypto_utils
    enc_path = input("Encrypted file path: ").strip()
    meta_path = input("Metadata JSON path: ").strip()

    priv_path = os.path.join(KEYS_DIR, "rsa_private.pem")
    if not os.path.isfile(priv_path):
        print("RSA private key not found. Generate keys first (option 7).")
        return

    if not all(os.path.isfile(p) for p in [enc_path, meta_path]):
        print("One or more files not found.")
        return

    with open(priv_path, "rb") as f:
        private_key = f.read()

    result = crypto_utils.decrypt_file(enc_path, meta_path, OUTPUT_DIR,
                                       private_key_pem=private_key)
    print(f"\nFile decrypted successfully: {result['decrypted_file']}")
    print(f"Original SHA-256:   {result['original_hash']}")
    print(f"Decrypted SHA-256:  {result['decrypted_hash']}")
    print(f"\nVerification result: {result['verification']} - "
          + ("decrypted file matches the original file."
             if result['verification'] == 'SUCCESS'
             else "FILES DO NOT MATCH!"))


def _cli_compare():
    import crypto_utils
    path = _get_input_path()
    if not path:
        return

    print("\nRunning AES vs DES comparison...")
    result = crypto_utils.compare_algorithms(path)
    aes = result["AES"]
    des = result["DES"]

    print(f"\n{'='*55}")
    print(f"  AES vs DES Comparison (file: {os.path.basename(path)})")
    print(f"{'='*55}")
    print(f"Original data size: {result['original_size']} bytes\n")
    print(f"{'Metric':<25} {'AES-256':<18} {'DES':<18}")
    print("-" * 55)
    print(f"{'Key Size (bits)':<25} {aes['key_size_bits']:<18} {des['key_size_bits']:<18}")
    print(f"{'Block Size (bits)':<25} {aes['block_size_bits']:<18} {des['block_size_bits']:<18}")
    print(f"{'Ciphertext Size':<25} {aes['ciphertext_size']:<18} {des['ciphertext_size']:<18}")
    print(f"{'Encrypt Time (ms)':<25} {aes['encryption_time_ms']:<18} {des['encryption_time_ms']:<18}")
    print(f"{'Decrypt Time (ms)':<25} {aes['decryption_time_ms']:<18} {des['decryption_time_ms']:<18}")
    print(f"{'Decrypt Valid':<25} {str(aes['decryption_valid']):<18} {str(des['decryption_valid']):<18}")
    print(f"\nAES: {aes['security_note']}")
    print(f"DES: {des['security_note']}")


def _cli_gen_rsa():
    import crypto_utils
    print("Generating RSA-2048 key pair...")
    priv_pem, pub_pem = crypto_utils.generate_rsa_keypair()
    priv_path, pub_path = crypto_utils.save_rsa_keys(priv_pem, pub_pem, KEYS_DIR)
    print(f"Private key saved: {priv_path}")
    print(f"Public key saved:  {pub_path}")


if __name__ == "__main__":
    if "--cli" in sys.argv:
        cli_mode()
    elif "--tkinter" in sys.argv:
        from gui_app import run_gui
        run_gui()
    else:
        from app import run_web
        run_web()
