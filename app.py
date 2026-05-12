import os
import base64
from flask import Flask, render_template, request, jsonify
import crypto_utils

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "output")
KEYS_DIR = os.path.join(SCRIPT_DIR, "keys")
DATA_DIR = os.path.join(SCRIPT_DIR, "data")

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16 MB upload limit


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/encrypt", methods=["POST"])
def api_encrypt():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    algo = request.form.get("algorithm", "AES")

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    input_path = os.path.join(OUTPUT_DIR, "upload_" + file.filename)
    file.save(input_path)

    try:
        if algo == "Hybrid":
            pub_path = os.path.join(KEYS_DIR, "rsa_public.pem")
            if not os.path.isfile(pub_path):
                return jsonify({"error": "RSA keys not found. Generate them first."}), 400
            with open(pub_path, "rb") as f:
                pub_key = f.read()
            result = crypto_utils.encrypt_file(input_path, OUTPUT_DIR, "Hybrid",
                                               public_key_pem=pub_key)
        else:
            result = crypto_utils.encrypt_file(input_path, OUTPUT_DIR, algo)

        with open(result["encrypted_file"], "rb") as f:
            full_b64 = base64.b64encode(f.read()).decode("utf-8")

        return jsonify({
            "success": True,
            "algorithm": algo,
            "original_file": file.filename,
            "encrypted_file": os.path.basename(result["encrypted_file"]),
            "original_hash": result["original_hash"],
            "ciphertext_size": result["ciphertext_size"],
            "encryption_time_ms": round(result["encryption_time"] * 1000, 4),
            "ciphertext_b64": full_b64[:300],
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/decrypt", methods=["POST"])
def api_decrypt():
    algo = request.form.get("algorithm", "AES")

    enc_file = request.files.get("encrypted_file")
    meta_file = request.files.get("metadata_file")
    key_file = request.files.get("key_file")

    if not enc_file or not meta_file:
        return jsonify({"error": "Encrypted file and metadata file are required"}), 400

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    enc_path = os.path.join(OUTPUT_DIR, "dec_" + enc_file.filename)
    meta_path = os.path.join(OUTPUT_DIR, "dec_" + meta_file.filename)
    enc_file.save(enc_path)
    meta_file.save(meta_path)

    try:
        key = None
        private_key_pem = None

        if algo == "Hybrid":
            priv_path = os.path.join(KEYS_DIR, "rsa_private.pem")
            if not os.path.isfile(priv_path):
                return jsonify({"error": "RSA private key not found."}), 400
            with open(priv_path, "rb") as f:
                private_key_pem = f.read()
        else:
            if not key_file:
                return jsonify({"error": "Key file is required for symmetric decryption"}), 400
            k_path = os.path.join(OUTPUT_DIR, "dec_" + key_file.filename)
            key_file.save(k_path)
            with open(k_path, "rb") as f:
                key = f.read()

        result = crypto_utils.decrypt_file(enc_path, meta_path, OUTPUT_DIR,
                                           key=key, private_key_pem=private_key_pem)

        preview = ""
        if result["verification"] == "SUCCESS":
            try:
                with open(result["decrypted_file"], "r", encoding="utf-8") as f:
                    preview = f.read(600)
            except UnicodeDecodeError:
                preview = "(Binary file - preview not available)"

        return jsonify({
            "success": True,
            "algorithm": result["algorithm"],
            "decrypted_file": os.path.basename(result["decrypted_file"]),
            "decryption_time_ms": round(result["decryption_time"] * 1000, 4),
            "original_hash": result["original_hash"],
            "decrypted_hash": result["decrypted_hash"],
            "verification": result["verification"],
            "preview": preview,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/compare", methods=["POST"])
def api_compare():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    input_path = os.path.join(OUTPUT_DIR, "cmp_" + file.filename)
    file.save(input_path)

    try:
        result = crypto_utils.compare_algorithms(input_path)
        return jsonify({"success": True, **result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/generate-rsa", methods=["POST"])
def api_generate_rsa():
    try:
        priv_pem, pub_pem = crypto_utils.generate_rsa_keypair()
        crypto_utils.save_rsa_keys(priv_pem, pub_pem, KEYS_DIR)
        return jsonify({
            "success": True,
            "message": "RSA-2048 key pair generated successfully.",
            "private_key_file": "rsa_private.pem",
            "public_key_file": "rsa_public.pem",
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/sample-data")
def api_sample_data():
    csv_path = os.path.join(DATA_DIR, "students.csv")
    if os.path.isfile(csv_path):
        with open(csv_path, "r") as f:
            return jsonify({"filename": "students.csv", "content": f.read()})
    return jsonify({"error": "Sample data not found"}), 404


def run_web():
    import webbrowser
    webbrowser.open("http://127.0.0.1:5000")
    app.run(debug=False, host="127.0.0.1", port=5000)


if __name__ == "__main__":
    run_web()
