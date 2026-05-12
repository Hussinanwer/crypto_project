import os
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import crypto_utils

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "output")
KEYS_DIR = os.path.join(SCRIPT_DIR, "keys")


class CryptoApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Cryptography Lib Lab - Encryption & Decryption Tool")
        self.geometry("900x700")
        self.resizable(True, True)

        style = ttk.Style(self)
        style.theme_use("clam")

        self.notebook = ttk.Notebook(self)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        self._build_encrypt_tab()
        self._build_decrypt_tab()
        self._build_compare_tab()
        self._build_hybrid_tab()

        self.status_var = tk.StringVar(value="Ready")
        status_bar = ttk.Label(self, textvariable=self.status_var, relief=tk.SUNKEN,
                               anchor=tk.W, padding=5)
        status_bar.pack(fill=tk.X, side=tk.BOTTOM)

    # ── Encrypt Tab ──────────────────────────────

    def _build_encrypt_tab(self):
        frame = ttk.Frame(self.notebook, padding=15)
        self.notebook.add(frame, text="  Encrypt  ")

        ttk.Label(frame, text="Symmetric Encryption (AES / DES)",
                  font=("Segoe UI", 14, "bold")).pack(anchor=tk.W)
        ttk.Separator(frame, orient=tk.HORIZONTAL).pack(fill=tk.X, pady=5)

        file_frame = ttk.Frame(frame)
        file_frame.pack(fill=tk.X, pady=5)
        ttk.Label(file_frame, text="Input File:").pack(side=tk.LEFT)
        self.enc_file_var = tk.StringVar()
        ttk.Entry(file_frame, textvariable=self.enc_file_var, width=60).pack(side=tk.LEFT, padx=5)
        ttk.Button(file_frame, text="Browse", command=self._browse_enc_file).pack(side=tk.LEFT)

        algo_frame = ttk.Frame(frame)
        algo_frame.pack(fill=tk.X, pady=5)
        ttk.Label(algo_frame, text="Algorithm:").pack(side=tk.LEFT)
        self.enc_algo_var = tk.StringVar(value="AES")
        ttk.Radiobutton(algo_frame, text="AES-256", variable=self.enc_algo_var,
                        value="AES").pack(side=tk.LEFT, padx=10)
        ttk.Radiobutton(algo_frame, text="DES", variable=self.enc_algo_var,
                        value="DES").pack(side=tk.LEFT, padx=10)

        ttk.Button(frame, text="Encrypt File", command=self._do_encrypt,
                   style="Accent.TButton").pack(pady=10)

        self.enc_log = scrolledtext.ScrolledText(frame, height=18, state=tk.DISABLED,
                                                  wrap=tk.WORD, font=("Consolas", 10))
        self.enc_log.pack(fill=tk.BOTH, expand=True)

    def _browse_enc_file(self):
        path = filedialog.askopenfilename(title="Select file to encrypt",
                                          initialdir=os.path.join(SCRIPT_DIR, "data"))
        if path:
            self.enc_file_var.set(path)

    def _do_encrypt(self):
        input_path = self.enc_file_var.get()
        if not input_path or not os.path.isfile(input_path):
            messagebox.showerror("Error", "Please select a valid input file.")
            return

        algo = self.enc_algo_var.get()
        self.status_var.set(f"Encrypting with {algo}...")
        self.update_idletasks()

        try:
            result = crypto_utils.encrypt_file(input_path, OUTPUT_DIR, algo)
            lines = [
                f"=== {algo} Encryption Complete ===",
                f"Original file:    {input_path}",
                f"Encrypted file:   {result['encrypted_file']}",
                f"Metadata file:    {result['metadata_file']}",
                f"Original SHA-256: {result['original_hash']}",
                f"Ciphertext size:  {result['ciphertext_size']} bytes",
                f"Encryption time:  {result['encryption_time']*1000:.4f} ms",
                "",
                "── Base64 Ciphertext Preview ──",
                result["ciphertext_b64_preview"],
            ]
            self._log(self.enc_log, "\n".join(lines))
            self.status_var.set(f"{algo} encryption successful.")
        except Exception as e:
            messagebox.showerror("Encryption Error", str(e))
            self.status_var.set("Encryption failed.")

    # ── Decrypt Tab ──────────────────────────────

    def _build_decrypt_tab(self):
        frame = ttk.Frame(self.notebook, padding=15)
        self.notebook.add(frame, text="  Decrypt  ")

        ttk.Label(frame, text="Symmetric Decryption (AES / DES)",
                  font=("Segoe UI", 14, "bold")).pack(anchor=tk.W)
        ttk.Separator(frame, orient=tk.HORIZONTAL).pack(fill=tk.X, pady=5)

        enc_frame = ttk.Frame(frame)
        enc_frame.pack(fill=tk.X, pady=5)
        ttk.Label(enc_frame, text="Encrypted File:").pack(side=tk.LEFT)
        self.dec_enc_var = tk.StringVar()
        ttk.Entry(enc_frame, textvariable=self.dec_enc_var, width=55).pack(side=tk.LEFT, padx=5)
        ttk.Button(enc_frame, text="Browse", command=self._browse_dec_enc).pack(side=tk.LEFT)

        meta_frame = ttk.Frame(frame)
        meta_frame.pack(fill=tk.X, pady=5)
        ttk.Label(meta_frame, text="Metadata File:").pack(side=tk.LEFT)
        self.dec_meta_var = tk.StringVar()
        ttk.Entry(meta_frame, textvariable=self.dec_meta_var, width=55).pack(side=tk.LEFT, padx=5)
        ttk.Button(meta_frame, text="Browse", command=self._browse_dec_meta).pack(side=tk.LEFT)

        key_frame = ttk.Frame(frame)
        key_frame.pack(fill=tk.X, pady=5)
        ttk.Label(key_frame, text="Key File:").pack(side=tk.LEFT)
        self.dec_key_var = tk.StringVar()
        ttk.Entry(key_frame, textvariable=self.dec_key_var, width=55).pack(side=tk.LEFT, padx=5)
        ttk.Button(key_frame, text="Browse", command=self._browse_dec_key).pack(side=tk.LEFT)

        ttk.Button(frame, text="Decrypt & Verify", command=self._do_decrypt).pack(pady=10)

        self.dec_log = scrolledtext.ScrolledText(frame, height=18, state=tk.DISABLED,
                                                  wrap=tk.WORD, font=("Consolas", 10))
        self.dec_log.pack(fill=tk.BOTH, expand=True)

    def _browse_dec_enc(self):
        path = filedialog.askopenfilename(title="Select encrypted file",
                                          initialdir=OUTPUT_DIR,
                                          filetypes=[("Encrypted", "*.bin"), ("All", "*.*")])
        if path:
            self.dec_enc_var.set(path)

    def _browse_dec_meta(self):
        path = filedialog.askopenfilename(title="Select metadata file",
                                          initialdir=OUTPUT_DIR,
                                          filetypes=[("JSON", "*.json"), ("All", "*.*")])
        if path:
            self.dec_meta_var.set(path)

    def _browse_dec_key(self):
        path = filedialog.askopenfilename(title="Select key file",
                                          initialdir=OUTPUT_DIR,
                                          filetypes=[("Key", "*.bin"), ("All", "*.*")])
        if path:
            self.dec_key_var.set(path)

    def _do_decrypt(self):
        enc_path = self.dec_enc_var.get()
        meta_path = self.dec_meta_var.get()
        key_path = self.dec_key_var.get()

        if not all(os.path.isfile(p) for p in [enc_path, meta_path, key_path]):
            messagebox.showerror("Error", "Please select valid encrypted, metadata, and key files.")
            return

        self.status_var.set("Decrypting...")
        self.update_idletasks()

        try:
            with open(key_path, "rb") as f:
                key = f.read()

            result = crypto_utils.decrypt_file(enc_path, meta_path, OUTPUT_DIR, key=key)

            lines = [
                f"=== {result['algorithm']} Decryption Complete ===",
                f"Decrypted file:     {result['decrypted_file']}",
                f"Decryption time:    {result['decryption_time']*1000:.4f} ms",
                f"Original SHA-256:   {result['original_hash']}",
                f"Decrypted SHA-256:  {result['decrypted_hash']}",
                "",
                f"Verification: {result['verification']} - "
                + ("decrypted file matches the original!" if result['verification'] == 'SUCCESS'
                   else "FILES DO NOT MATCH!"),
            ]

            if result['verification'] == 'SUCCESS':
                dec_file = result['decrypted_file']
                try:
                    with open(dec_file, "r", encoding="utf-8") as f:
                        preview = f.read(500)
                    lines += ["", "── Decrypted Content Preview ──", preview]
                except UnicodeDecodeError:
                    lines += ["", "(Binary file - content preview not available)"]

            self._log(self.dec_log, "\n".join(lines))
            self.status_var.set(f"Decryption {result['verification']}.")
        except Exception as e:
            messagebox.showerror("Decryption Error", str(e))
            self.status_var.set("Decryption failed.")

    # ── Compare Tab ──────────────────────────────

    def _build_compare_tab(self):
        frame = ttk.Frame(self.notebook, padding=15)
        self.notebook.add(frame, text="  AES vs DES  ")

        ttk.Label(frame, text="Algorithm Comparison: AES vs DES",
                  font=("Segoe UI", 14, "bold")).pack(anchor=tk.W)
        ttk.Separator(frame, orient=tk.HORIZONTAL).pack(fill=tk.X, pady=5)

        file_frame = ttk.Frame(frame)
        file_frame.pack(fill=tk.X, pady=5)
        ttk.Label(file_frame, text="Input File:").pack(side=tk.LEFT)
        self.cmp_file_var = tk.StringVar()
        ttk.Entry(file_frame, textvariable=self.cmp_file_var, width=60).pack(side=tk.LEFT, padx=5)
        ttk.Button(file_frame, text="Browse", command=self._browse_cmp_file).pack(side=tk.LEFT)

        ttk.Button(frame, text="Run Comparison", command=self._do_compare).pack(pady=10)

        self.cmp_log = scrolledtext.ScrolledText(frame, height=18, state=tk.DISABLED,
                                                  wrap=tk.WORD, font=("Consolas", 10))
        self.cmp_log.pack(fill=tk.BOTH, expand=True)

    def _browse_cmp_file(self):
        path = filedialog.askopenfilename(title="Select file to compare",
                                          initialdir=os.path.join(SCRIPT_DIR, "data"))
        if path:
            self.cmp_file_var.set(path)

    def _do_compare(self):
        input_path = self.cmp_file_var.get()
        if not input_path or not os.path.isfile(input_path):
            messagebox.showerror("Error", "Please select a valid input file.")
            return

        self.status_var.set("Running AES vs DES comparison...")
        self.update_idletasks()

        try:
            result = crypto_utils.compare_algorithms(input_path)
            aes = result["AES"]
            des = result["DES"]

            lines = [
                "=" * 60,
                "        AES vs DES Algorithm Comparison",
                "=" * 60,
                f"Original data size: {result['original_size']} bytes",
                "",
                f"{'Metric':<25} {'AES-256':<18} {'DES':<18}",
                "-" * 60,
                f"{'Key Size (bits)':<25} {aes['key_size_bits']:<18} {des['key_size_bits']:<18}",
                f"{'Block Size (bits)':<25} {aes['block_size_bits']:<18} {des['block_size_bits']:<18}",
                f"{'Ciphertext Size (bytes)':<25} {aes['ciphertext_size']:<18} {des['ciphertext_size']:<18}",
                f"{'Encryption Time (ms)':<25} {aes['encryption_time_ms']:<18} {des['encryption_time_ms']:<18}",
                f"{'Decryption Time (ms)':<25} {aes['decryption_time_ms']:<18} {des['decryption_time_ms']:<18}",
                f"{'Decryption Valid':<25} {str(aes['decryption_valid']):<18} {str(des['decryption_valid']):<18}",
                "",
                "── Security Notes ──",
                f"AES: {aes['security_note']}",
                f"DES: {des['security_note']}",
                "",
                "Conclusion: AES-256 is significantly more secure than DES.",
                "DES is included here for educational comparison only.",
            ]
            self._log(self.cmp_log, "\n".join(lines))
            self.status_var.set("Comparison complete.")
        except Exception as e:
            messagebox.showerror("Comparison Error", str(e))
            self.status_var.set("Comparison failed.")

    # ── Hybrid Encryption Tab ────────────────────

    def _build_hybrid_tab(self):
        frame = ttk.Frame(self.notebook, padding=15)
        self.notebook.add(frame, text="  Hybrid (AES+RSA)  ")

        ttk.Label(frame, text="Hybrid Encryption: AES for Data + RSA for Key",
                  font=("Segoe UI", 14, "bold")).pack(anchor=tk.W)
        ttk.Separator(frame, orient=tk.HORIZONTAL).pack(fill=tk.X, pady=5)

        file_frame = ttk.Frame(frame)
        file_frame.pack(fill=tk.X, pady=5)
        ttk.Label(file_frame, text="Input File:").pack(side=tk.LEFT)
        self.hyb_file_var = tk.StringVar()
        ttk.Entry(file_frame, textvariable=self.hyb_file_var, width=60).pack(side=tk.LEFT, padx=5)
        ttk.Button(file_frame, text="Browse", command=self._browse_hyb_file).pack(side=tk.LEFT)

        btn_frame = ttk.Frame(frame)
        btn_frame.pack(fill=tk.X, pady=10)
        ttk.Button(btn_frame, text="Generate RSA Keys",
                   command=self._gen_rsa_keys).pack(side=tk.LEFT, padx=5)
        ttk.Button(btn_frame, text="Hybrid Encrypt",
                   command=self._do_hybrid_encrypt).pack(side=tk.LEFT, padx=5)
        ttk.Button(btn_frame, text="Hybrid Decrypt & Verify",
                   command=self._do_hybrid_decrypt).pack(side=tk.LEFT, padx=5)

        self.hyb_log = scrolledtext.ScrolledText(frame, height=18, state=tk.DISABLED,
                                                  wrap=tk.WORD, font=("Consolas", 10))
        self.hyb_log.pack(fill=tk.BOTH, expand=True)

    def _browse_hyb_file(self):
        path = filedialog.askopenfilename(title="Select file for hybrid encryption",
                                          initialdir=os.path.join(SCRIPT_DIR, "data"))
        if path:
            self.hyb_file_var.set(path)

    def _gen_rsa_keys(self):
        self.status_var.set("Generating RSA-2048 key pair...")
        self.update_idletasks()
        try:
            priv_pem, pub_pem = crypto_utils.generate_rsa_keypair()
            priv_path, pub_path = crypto_utils.save_rsa_keys(priv_pem, pub_pem, KEYS_DIR)
            lines = [
                "=== RSA Key Pair Generated ===",
                f"Private key saved: {priv_path}",
                f"Public key saved:  {pub_path}",
                "Key size: 2048 bits",
            ]
            self._log(self.hyb_log, "\n".join(lines))
            self.status_var.set("RSA keys generated successfully.")
        except Exception as e:
            messagebox.showerror("Key Generation Error", str(e))

    def _do_hybrid_encrypt(self):
        input_path = self.hyb_file_var.get()
        if not input_path or not os.path.isfile(input_path):
            messagebox.showerror("Error", "Please select a valid input file.")
            return

        pub_path = os.path.join(KEYS_DIR, "rsa_public.pem")
        if not os.path.isfile(pub_path):
            messagebox.showerror("Error", "RSA public key not found. Generate keys first.")
            return

        self.status_var.set("Running hybrid encryption (AES+RSA)...")
        self.update_idletasks()

        try:
            with open(pub_path, "rb") as f:
                public_key = f.read()

            result = crypto_utils.encrypt_file(input_path, OUTPUT_DIR, "Hybrid",
                                               public_key_pem=public_key)
            lines = [
                "=== Hybrid Encryption Complete ===",
                "AES-256 encrypted the data, RSA-2048 encrypted the AES key.",
                f"Original file:    {input_path}",
                f"Encrypted file:   {result['encrypted_file']}",
                f"Metadata file:    {result['metadata_file']}",
                f"Original SHA-256: {result['original_hash']}",
                f"Ciphertext size:  {result['ciphertext_size']} bytes",
                f"Encryption time:  {result['encryption_time']*1000:.4f} ms",
                "",
                "── Base64 Ciphertext Preview ──",
                result["ciphertext_b64_preview"],
            ]
            self._log(self.hyb_log, "\n".join(lines))
            self.status_var.set("Hybrid encryption successful.")
        except Exception as e:
            messagebox.showerror("Hybrid Encryption Error", str(e))
            self.status_var.set("Hybrid encryption failed.")

    def _do_hybrid_decrypt(self):
        priv_path = os.path.join(KEYS_DIR, "rsa_private.pem")
        if not os.path.isfile(priv_path):
            messagebox.showerror("Error", "RSA private key not found. Generate keys first.")
            return

        enc_path = filedialog.askopenfilename(title="Select encrypted file",
                                              initialdir=OUTPUT_DIR,
                                              filetypes=[("Encrypted", "*.bin"), ("All", "*.*")])
        if not enc_path:
            return

        meta_path = filedialog.askopenfilename(title="Select metadata file",
                                               initialdir=OUTPUT_DIR,
                                               filetypes=[("JSON", "*.json"), ("All", "*.*")])
        if not meta_path:
            return

        self.status_var.set("Running hybrid decryption...")
        self.update_idletasks()

        try:
            with open(priv_path, "rb") as f:
                private_key = f.read()

            result = crypto_utils.decrypt_file(enc_path, meta_path, OUTPUT_DIR,
                                               private_key_pem=private_key)
            lines = [
                "=== Hybrid Decryption Complete ===",
                "RSA decrypted the AES key, then AES decrypted the data.",
                f"Decrypted file:     {result['decrypted_file']}",
                f"Decryption time:    {result['decryption_time']*1000:.4f} ms",
                f"Original SHA-256:   {result['original_hash']}",
                f"Decrypted SHA-256:  {result['decrypted_hash']}",
                "",
                f"Verification: {result['verification']} - "
                + ("decrypted file matches the original!" if result['verification'] == 'SUCCESS'
                   else "FILES DO NOT MATCH!"),
            ]

            if result['verification'] == 'SUCCESS':
                try:
                    with open(result['decrypted_file'], "r", encoding="utf-8") as f:
                        preview = f.read(500)
                    lines += ["", "── Decrypted Content Preview ──", preview]
                except UnicodeDecodeError:
                    lines += ["", "(Binary file - content preview not available)"]

            self._log(self.hyb_log, "\n".join(lines))
            self.status_var.set(f"Hybrid decryption {result['verification']}.")
        except Exception as e:
            messagebox.showerror("Hybrid Decryption Error", str(e))
            self.status_var.set("Hybrid decryption failed.")

    # ── Utility ──────────────────────────────────

    def _log(self, widget, text):
        widget.config(state=tk.NORMAL)
        widget.delete("1.0", tk.END)
        widget.insert(tk.END, text)
        widget.config(state=tk.DISABLED)


def run_gui():
    app = CryptoApp()
    app.mainloop()
