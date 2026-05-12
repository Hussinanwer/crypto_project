# CryptoLab - Cryptography Lib Lab Project

A real-data encryption/decryption application implementing **AES-256**, **DES**, **RSA-2048**, and **Hybrid** encryption with a modern dark-themed web UI.

---

## Requirements

- Python 3.10+
- Install dependencies:

```bash
pip install pycryptodome flask
```

---

## How to Run

### Web UI (recommended)
```bash
python main.py
```
Opens automatically at **http://127.0.0.1:5000**

### CLI Menu (terminal)
```bash
python main.py --cli
```

### Tkinter GUI (desktop)
```bash
python main.py --tkinter
```

### Run Tests
```bash
python test_all.py
```

---

## Project Structure

```
crypto_project/
├── main.py              # Entry point
├── crypto_utils.py      # Core crypto functions (AES, DES, RSA, SHA-256)
├── app.py               # Flask web backend
├── gui_app.py           # Tkinter desktop GUI
├── test_all.py          # Automated tests
├── data/
│   └── students.csv     # Sample input data (fake student records)
├── output/              # Generated on first run — encrypted & decrypted files
├── keys/                # Generated on first run — RSA key pair
├── templates/
│   └── index.html       # Web UI HTML
└── static/
    ├── style.css         # Dark theme styles
    └── script.js         # Frontend logic
```

---

## How to Use the Web UI

### Tab 1 — Encrypt

1. Select **AES-256** or **DES** algorithm
2. Drag & drop or browse to select a file (e.g. `data/students.csv`)
3. Click **Encrypt File**
4. Results show:
   - Encrypted output file name
   - Original SHA-256 hash
   - Ciphertext size and encryption time
   - Base64 ciphertext preview

> Output files are saved to the `output/` folder automatically.

---

### Tab 2 — Decrypt

1. Select the same algorithm used to encrypt
2. Upload the **3 required files** from the `output/` folder:
   - `students_encrypted.bin` → Encrypted File
   - `students_metadata.json` → Metadata File
   - `students_key.bin` → Key File
3. Click **Decrypt & Verify**
4. Results show:
   - Verification badge: **SUCCESS** or FAILED
   - Original vs decrypted SHA-256 hash comparison
   - Decrypted content preview

---

### Tab 3 — AES vs DES Comparison

1. Upload any file (e.g. `data/students.csv`)
2. Click **Run Comparison**
3. Results show a side-by-side table:
   - Key size, block size, ciphertext size
   - Encryption and decryption times (ms)
   - Security notes for each algorithm

---

### Tab 4 — Hybrid (AES + RSA)

**Step 1 — Generate RSA Keys**
- Click **Generate RSA-2048 Key Pair**
- Keys are saved to `keys/` folder

**Step 2 — Encrypt**
- Upload a file, click **Hybrid Encrypt**
- AES-256 encrypts the data, RSA-2048 encrypts the AES key

**Step 3 — Decrypt**
- Upload the encrypted `.bin` file and `_metadata.json` from `output/`
- Click **Hybrid Decrypt & Verify**
- Results show SHA-256 verification and content preview

---

## CLI Menu Options

```
1. Encrypt file (AES)
2. Encrypt file (DES)
3. Decrypt file (AES or DES)
4. Hybrid Encrypt (AES + RSA)
5. Hybrid Decrypt (AES + RSA)
6. Compare AES vs DES
7. Generate RSA Key Pair
0. Exit
```

When prompted for input file, press **Enter** to use the default `data/students.csv`.

---

## Algorithms Used

| Algorithm | Type      | Key Size | Mode | Notes                          |
|-----------|-----------|----------|------|--------------------------------|
| AES-256   | Symmetric | 256-bit  | CBC  | Industry standard, recommended |
| DES       | Symmetric | 64-bit   | CBC  | Deprecated, educational only   |
| RSA-2048  | Asymmetric| 2048-bit | OAEP | Used to encrypt the AES key    |
| Hybrid    | Both      | —        | —    | AES for data + RSA for key     |

---

## Output Files Explained

After running any encryption, the `output/` folder will contain:

| File | Description |
|------|-------------|
| `students_encrypted.bin` | Raw ciphertext (binary) |
| `students_metadata.json` | IV, algorithm, original SHA-256 hash |
| `students_key.bin` | Symmetric key (AES or DES) |
| `students_decrypted.csv` | Recovered original file after decryption |

For **Hybrid** mode, an extra file is created:

| File | Description |
|------|-------------|
| `students_encrypted_aes_key.bin` | AES key encrypted with RSA public key |

---

---

## Video Demo Guide (2–5 Minutes)

> The project requires a short screen-recorded video. Here is the recommended structure.

---

### Section 1 — Introduction (0:00 – 0:30)

Say out loud:
- "This is the Cryptography Lib Lab project for the Information Security course."
- "I implemented AES-256, DES, RSA-2048, and Hybrid encryption using Python and PyCryptodome."
- "The application encrypts real student record data, saves the ciphertext, then decrypts and verifies it."
- "It also includes a web UI, algorithm comparison, and SHA-256 hash verification."

---

### Section 2 — Code Walkthrough (0:30 – 2:00)

Open `crypto_utils.py` and briefly explain:

- `generate_aes_key()` — generates a random 256-bit key
- `encrypt_aes(data, key)` — AES-CBC encryption with random IV and PKCS7 padding
- `decrypt_aes(ciphertext, key, iv)` — decrypts and removes padding
- `encrypt_rsa / decrypt_rsa` — RSA with OAEP padding
- `hybrid_encrypt / hybrid_decrypt` — AES encrypts data, RSA encrypts the AES key
- `compute_sha256 / verify_files` — SHA-256 hash comparison for verification
- `compare_algorithms` — runs both AES and DES and benchmarks them

---

### Section 3 — Live Demo (2:00 – 4:00)

Run `python main.py` to open the web UI, then demo in this order:

**1. Encrypt tab**
- Select AES-256
- Upload `data/students.csv`
- Click Encrypt — show the Base64 ciphertext and SHA-256 hash

**2. Decrypt tab**
- Upload the 3 output files
- Click Decrypt & Verify — show the **SUCCESS** badge and decrypted content preview

**3. AES vs DES tab**
- Upload `data/students.csv`
- Click Run Comparison — show the table (key sizes, timings, security notes)

**4. Hybrid tab**
- Click Generate RSA Keys
- Upload `students.csv` and click Hybrid Encrypt
- Upload the encrypted files and click Hybrid Decrypt & Verify

---

### Section 4 — Conclusion (4:00 – 4:30)

Say out loud:
- "The SHA-256 hashes of the original and decrypted files match exactly, which proves the decryption was successful."
- "AES-256 is far more secure than DES — DES uses only a 56-bit key and is vulnerable to brute-force attacks."
- "The hybrid approach mirrors real-world systems like TLS, where a symmetric key is exchanged using asymmetric encryption."
- "One security limitation is that the symmetric key is stored as a plain file — in a real system it would be password-protected."

---

## Libraries Used

| Library | Purpose |
|---------|---------|
| `pycryptodome` | AES, DES, RSA, padding, random bytes |
| `flask` | Local web server and API routes |
| `hashlib` | SHA-256 hashing |
| `base64` | Encoding ciphertext for display |
| `json` | Saving/loading metadata |
| `tkinter` | Desktop GUI (Python built-in) |
