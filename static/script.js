// ── Tab Switching ──────────────────────────

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// ── Radio Card Selection ──────────────────

function selectRadio(el, groupName) {
    el.closest('.radio-group').querySelectorAll('.radio-card').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    el.querySelector('input').checked = true;
}

// ── File Helpers ──────────────────────────

function showFileName(inputId, displayId) {
    const input = document.getElementById(inputId);
    const display = document.getElementById(displayId);
    if (input.files.length > 0) {
        display.textContent = input.files[0].name;
    }
}

function showLabel(inputId, labelId) {
    const input = document.getElementById(inputId);
    const label = document.getElementById(labelId);
    if (input.files.length > 0) {
        label.textContent = input.files[0].name;
        label.style.color = '#60a5fa';
    }
}

function handleDrop(event, inputId) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    const input = document.getElementById(inputId);
    input.files = event.dataTransfer.files;
    const nameId = inputId + '-name';
    const nameEl = document.getElementById(nameId);
    if (nameEl && input.files.length > 0) {
        nameEl.textContent = input.files[0].name;
    }
}

// ── Loading ───────────────────────────────

function showLoading() { document.getElementById('loading').classList.remove('hidden'); }
function hideLoading() { document.getElementById('loading').classList.add('hidden'); }

// ── Encrypt ───────────────────────────────

async function doEncrypt() {
    const fileInput = document.getElementById('enc-file');
    const algo = document.querySelector('input[name="enc-algo"]:checked').value;

    if (!fileInput.files.length) {
        alert('Please select a file to encrypt.');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('algorithm', algo);

    showLoading();
    try {
        const res = await fetch('/api/encrypt', { method: 'POST', body: formData });
        const data = await res.json();
        hideLoading();

        const container = document.getElementById('enc-result');
        container.classList.remove('hidden');

        if (data.error) {
            container.innerHTML = renderError(data.error);
            return;
        }

        container.innerHTML = `
            <div class="result-header">
                <div class="result-icon success">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </div>
                <div>
                    <div class="result-title">${data.algorithm} Encryption Successful</div>
                    <div class="result-subtitle">${data.original_file}</div>
                </div>
            </div>
            <div class="result-grid">
                <div class="stat-card">
                    <div class="stat-label">Algorithm</div>
                    <div class="stat-value">${data.algorithm}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Ciphertext Size</div>
                    <div class="stat-value">${data.ciphertext_size} B</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Encryption Time</div>
                    <div class="stat-value green">${data.encryption_time_ms} ms</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Output File</div>
                    <div class="stat-value" style="font-size:13px;">${data.encrypted_file}</div>
                </div>
            </div>
            <div class="hash-row">
                <span class="hash-label">SHA-256:</span>
                <span class="hash-value">${data.original_hash}</span>
            </div>
            <div style="margin-top:16px;">
                <div class="b64-label">Base64 Ciphertext Preview</div>
                <div class="b64-preview">${data.ciphertext_b64}</div>
            </div>
        `;
    } catch (e) {
        hideLoading();
        alert('Error: ' + e.message);
    }
}

// ── Decrypt ───────────────────────────────

async function doDecrypt() {
    const encFile = document.getElementById('dec-enc-file');
    const metaFile = document.getElementById('dec-meta-file');
    const keyFile = document.getElementById('dec-key-file');
    const algo = document.querySelector('input[name="dec-algo"]:checked').value;

    if (!encFile.files.length || !metaFile.files.length || !keyFile.files.length) {
        alert('Please select all three files (encrypted, metadata, key).');
        return;
    }

    const formData = new FormData();
    formData.append('encrypted_file', encFile.files[0]);
    formData.append('metadata_file', metaFile.files[0]);
    formData.append('key_file', keyFile.files[0]);
    formData.append('algorithm', algo);

    showLoading();
    try {
        const res = await fetch('/api/decrypt', { method: 'POST', body: formData });
        const data = await res.json();
        hideLoading();

        const container = document.getElementById('dec-result');
        container.classList.remove('hidden');

        if (data.error) {
            container.innerHTML = renderError(data.error);
            return;
        }

        const isSuccess = data.verification === 'SUCCESS';
        container.innerHTML = `
            <div class="result-header">
                <div class="result-icon ${isSuccess ? 'success' : 'error'}">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${isSuccess
                            ? '<polyline points="20 6 9 17 4 12"/>'
                            : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'}
                    </svg>
                </div>
                <div>
                    <div class="result-title">${data.algorithm} Decryption Complete</div>
                    <div class="result-subtitle">${data.decrypted_file}</div>
                </div>
            </div>
            <div class="verification-badge ${isSuccess ? 'success' : 'fail'}">
                ${isSuccess ? '&#10003;' : '&#10007;'} Verification: ${data.verification}
                ${isSuccess ? ' — Decrypted file matches the original!' : ' — Files do NOT match!'}
            </div>
            <div class="result-grid">
                <div class="stat-card">
                    <div class="stat-label">Algorithm</div>
                    <div class="stat-value">${data.algorithm}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Decryption Time</div>
                    <div class="stat-value green">${data.decryption_time_ms} ms</div>
                </div>
            </div>
            <div class="hash-row">
                <span class="hash-label">Original SHA-256:</span>
                <span class="hash-value">${data.original_hash}</span>
            </div>
            <div class="hash-row">
                <span class="hash-label">Decrypted SHA-256:</span>
                <span class="hash-value">${data.decrypted_hash}</span>
            </div>
            ${data.preview ? `
                <div style="margin-top:16px;">
                    <div class="b64-label">Decrypted Content Preview</div>
                    <div class="content-preview">${escapeHtml(data.preview)}</div>
                </div>
            ` : ''}
        `;
    } catch (e) {
        hideLoading();
        alert('Error: ' + e.message);
    }
}

// ── Compare ───────────────────────────────

async function doCompare() {
    const fileInput = document.getElementById('cmp-file');
    if (!fileInput.files.length) {
        alert('Please select a file to compare.');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    showLoading();
    try {
        const res = await fetch('/api/compare', { method: 'POST', body: formData });
        const data = await res.json();
        hideLoading();

        const container = document.getElementById('cmp-result');
        container.classList.remove('hidden');

        if (data.error) {
            container.innerHTML = renderError(data.error);
            return;
        }

        const aes = data.AES;
        const des = data.DES;

        container.innerHTML = `
            <div class="result-header">
                <div class="result-icon success">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
                        <line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                </div>
                <div>
                    <div class="result-title">Algorithm Comparison Complete</div>
                    <div class="result-subtitle">Original data size: ${data.original_size} bytes</div>
                </div>
            </div>
            <table class="compare-table">
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>AES-256</th>
                        <th>DES</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="metric-name">Key Size</td>
                        <td class="aes-val">${aes.key_size_bits} bits</td>
                        <td class="des-val">${des.key_size_bits} bits</td>
                    </tr>
                    <tr>
                        <td class="metric-name">Block Size</td>
                        <td class="aes-val">${aes.block_size_bits} bits</td>
                        <td class="des-val">${des.block_size_bits} bits</td>
                    </tr>
                    <tr>
                        <td class="metric-name">Ciphertext Size</td>
                        <td class="aes-val">${aes.ciphertext_size} bytes</td>
                        <td class="des-val">${des.ciphertext_size} bytes</td>
                    </tr>
                    <tr>
                        <td class="metric-name">Encryption Time</td>
                        <td class="aes-val">${aes.encryption_time_ms} ms</td>
                        <td class="des-val">${des.encryption_time_ms} ms</td>
                    </tr>
                    <tr>
                        <td class="metric-name">Decryption Time</td>
                        <td class="aes-val">${aes.decryption_time_ms} ms</td>
                        <td class="des-val">${des.decryption_time_ms} ms</td>
                    </tr>
                    <tr>
                        <td class="metric-name">Decryption Valid</td>
                        <td class="aes-val">${aes.decryption_valid ? '&#10003; Yes' : '&#10007; No'}</td>
                        <td class="des-val">${des.decryption_valid ? '&#10003; Yes' : '&#10007; No'}</td>
                    </tr>
                </tbody>
            </table>
            <div class="security-note">
                <strong>AES-256:</strong> ${aes.security_note}
            </div>
            <div class="security-note warning">
                <strong>DES:</strong> ${des.security_note}
            </div>
        `;
    } catch (e) {
        hideLoading();
        alert('Error: ' + e.message);
    }
}

// ── RSA Key Generation ────────────────────

async function genRSA() {
    const btn = document.getElementById('rsa-btn');
    btn.disabled = true;
    showLoading();
    try {
        const res = await fetch('/api/generate-rsa', { method: 'POST' });
        const data = await res.json();
        hideLoading();
        btn.disabled = false;

        const status = document.getElementById('rsa-status');
        status.classList.remove('hidden');
        if (data.error) {
            status.className = 'status-msg error';
            status.textContent = data.error;
        } else {
            status.className = 'status-msg success';
            status.textContent = 'RSA-2048 key pair generated! Private & public keys saved to /keys folder.';
        }
    } catch (e) {
        hideLoading();
        btn.disabled = false;
        alert('Error: ' + e.message);
    }
}

// ── Hybrid Encrypt ────────────────────────

async function doHybridEncrypt() {
    const fileInput = document.getElementById('hyb-file');
    if (!fileInput.files.length) {
        alert('Please select a file for hybrid encryption.');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('algorithm', 'Hybrid');

    showLoading();
    try {
        const res = await fetch('/api/encrypt', { method: 'POST', body: formData });
        const data = await res.json();
        hideLoading();

        const container = document.getElementById('hyb-result');
        container.classList.remove('hidden');

        if (data.error) {
            container.innerHTML = renderError(data.error);
            return;
        }

        container.innerHTML = `
            <div class="result-header">
                <div class="result-icon success">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                </div>
                <div>
                    <div class="result-title">Hybrid Encryption Successful</div>
                    <div class="result-subtitle">AES-256 encrypted data + RSA-2048 encrypted key</div>
                </div>
            </div>
            <div class="result-grid">
                <div class="stat-card">
                    <div class="stat-label">Data Encryption</div>
                    <div class="stat-value">AES-256</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Key Encryption</div>
                    <div class="stat-value" style="color:var(--accent-purple)">RSA-2048</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Ciphertext Size</div>
                    <div class="stat-value">${data.ciphertext_size} B</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Encryption Time</div>
                    <div class="stat-value green">${data.encryption_time_ms} ms</div>
                </div>
            </div>
            <div class="hash-row">
                <span class="hash-label">SHA-256:</span>
                <span class="hash-value">${data.original_hash}</span>
            </div>
            <div style="margin-top:16px;">
                <div class="b64-label">Base64 Ciphertext Preview</div>
                <div class="b64-preview">${data.ciphertext_b64}</div>
            </div>
        `;
    } catch (e) {
        hideLoading();
        alert('Error: ' + e.message);
    }
}

// ── Hybrid Decrypt ────────────────────────

async function doHybridDecrypt() {
    const encFile = document.getElementById('hyb-dec-enc');
    const metaFile = document.getElementById('hyb-dec-meta');

    if (!encFile.files.length || !metaFile.files.length) {
        alert('Please select the encrypted file and metadata file.');
        return;
    }

    const formData = new FormData();
    formData.append('encrypted_file', encFile.files[0]);
    formData.append('metadata_file', metaFile.files[0]);
    formData.append('algorithm', 'Hybrid');

    showLoading();
    try {
        const res = await fetch('/api/decrypt', { method: 'POST', body: formData });
        const data = await res.json();
        hideLoading();

        const container = document.getElementById('hyb-result');
        container.classList.remove('hidden');

        if (data.error) {
            container.innerHTML = renderError(data.error);
            return;
        }

        const isSuccess = data.verification === 'SUCCESS';
        container.innerHTML = `
            <div class="result-header">
                <div class="result-icon ${isSuccess ? 'success' : 'error'}">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${isSuccess
                            ? '<polyline points="20 6 9 17 4 12"/>'
                            : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'}
                    </svg>
                </div>
                <div>
                    <div class="result-title">Hybrid Decryption Complete</div>
                    <div class="result-subtitle">RSA decrypted AES key, then AES decrypted data</div>
                </div>
            </div>
            <div class="verification-badge ${isSuccess ? 'success' : 'fail'}">
                ${isSuccess ? '&#10003;' : '&#10007;'} Verification: ${data.verification}
                ${isSuccess ? ' — Decrypted file matches the original!' : ' — Files do NOT match!'}
            </div>
            <div class="result-grid">
                <div class="stat-card">
                    <div class="stat-label">Algorithm</div>
                    <div class="stat-value">Hybrid</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Decryption Time</div>
                    <div class="stat-value green">${data.decryption_time_ms} ms</div>
                </div>
            </div>
            <div class="hash-row">
                <span class="hash-label">Original SHA-256:</span>
                <span class="hash-value">${data.original_hash}</span>
            </div>
            <div class="hash-row">
                <span class="hash-label">Decrypted SHA-256:</span>
                <span class="hash-value">${data.decrypted_hash}</span>
            </div>
            ${data.preview ? `
                <div style="margin-top:16px;">
                    <div class="b64-label">Decrypted Content Preview</div>
                    <div class="content-preview">${escapeHtml(data.preview)}</div>
                </div>
            ` : ''}
        `;
    } catch (e) {
        hideLoading();
        alert('Error: ' + e.message);
    }
}

// ── Utilities ─────────────────────────────

function renderError(msg) {
    return `
        <div class="result-header">
            <div class="result-icon error">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
            </div>
            <div>
                <div class="result-title" style="color:var(--accent-red)">Error</div>
                <div class="result-subtitle">${escapeHtml(msg)}</div>
            </div>
        </div>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
