import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, LevelFormat, ExternalHyperlink,
  PageBreak, UnderlineType
} from "docx";
import fs from "fs";

// ── Colour palette ─────────────────────────────────────────────
const BLUE      = "1A3C6E";   // deep navy for headings
const BLUE_LIGHT= "2E75B6";   // accent blue
const TEAL      = "0E7490";   // section accent
const DARK      = "1E293B";   // body text
const MUTED     = "64748B";   // captions / labels
const WHITE     = "FFFFFF";
const GREY_BG   = "F1F5F9";
const GREEN     = "166534";
const GREEN_BG  = "DCFCE7";
const RED_BG    = "FEE2E2";
const RED       = "991B1B";
const ORANGE    = "92400E";
const ORANGE_BG = "FEF3C7";

// ── Helpers ────────────────────────────────────────────────────
const pt  = n => n * 2;                 // half-points
const dxa = n => n * 1440;             // inches → DXA
const em  = n => n * 914400;           // inches → EMU

const cellBorder = (color = "D1D5DB") => ({
  top:    { style: BorderStyle.SINGLE, size: 4, color },
  bottom: { style: BorderStyle.SINGLE, size: 4, color },
  left:   { style: BorderStyle.SINGLE, size: 4, color },
  right:  { style: BorderStyle.SINGLE, size: 4, color },
});

const noBorder = () => ({
  top:    { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left:   { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right:  { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
});

const hr = (color = BLUE_LIGHT) =>
  new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color, space: 1 } },
    spacing: { after: 160 },
    children: [],
  });

const spacer = (after = 160) =>
  new Paragraph({ spacing: { after }, children: [] });

const body = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, font: "Calibri", size: pt(11), color: DARK, ...opts })],
  });

const bodyRuns = (runs, after = 120) =>
  new Paragraph({
    spacing: { after },
    children: runs.map(r => new TextRun({ font: "Calibri", size: pt(11), color: DARK, ...r })),
  });

const bullet = (text, bold = false) =>
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, font: "Calibri", size: pt(11), color: DARK, bold })],
  });

const numbered = (text) =>
  new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, font: "Calibri", size: pt(11), color: DARK })],
  });

const sectionHeading = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 120 },
    children: [new TextRun({ text, font: "Calibri", size: pt(14), bold: true, color: BLUE })],
  });

const subHeading = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, font: "Calibri", size: pt(12), bold: true, color: TEAL })],
  });

const qaQuestion = (n, text) =>
  new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({ text: `Q${n}. `, font: "Calibri", size: pt(12), bold: true, color: BLUE_LIGHT }),
      new TextRun({ text, font: "Calibri", size: pt(12), bold: true, color: DARK }),
    ],
  });

const qaAnswer = (text) =>
  new Paragraph({
    indent: { left: 360 },
    spacing: { after: 120 },
    children: [new TextRun({ text, font: "Calibri", size: pt(11), color: DARK })],
  });

const code = (text) =>
  new Paragraph({
    spacing: { after: 40 },
    indent: { left: 360 },
    children: [new TextRun({ text, font: "Courier New", size: pt(10), color: "0F4C81" })],
  });

// coloured info box (single-cell table)
const infoBox = (lines, fillColor = GREEN_BG, textColor = GREEN, borderColor = "86EFAC") =>
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorder(borderColor),
            shading: { fill: fillColor, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 160, right: 160 },
            children: lines.map(l =>
              new Paragraph({
                spacing: { after: 60 },
                children: [new TextRun({ text: l, font: "Calibri", size: pt(11), color: textColor })],
              })
            ),
          }),
        ],
      }),
    ],
  });

// ── Generic data table ─────────────────────────────────────────
const dataTable = (headers, rows, colWidths) => {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      new TableCell({
        borders: cellBorder("93C5FD"),
        shading: { fill: BLUE_LIGHT, type: ShadingType.CLEAR },
        width: { size: colWidths[i], type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        verticalAlign: VerticalAlign.CENTER,
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: h, font: "Calibri", size: pt(11), bold: true, color: WHITE })],
          }),
        ],
      })
    ),
  });

  const dataRows = rows.map((row, ri) =>
    new TableRow({
      children: row.map((cell, ci) =>
        new TableCell({
          borders: cellBorder("D1D5DB"),
          shading: { fill: ri % 2 === 0 ? WHITE : GREY_BG, type: ShadingType.CLEAR },
          width: { size: colWidths[ci], type: WidthType.DXA },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              children: [new TextRun({ text: cell, font: "Calibri", size: pt(10.5), color: DARK })],
            }),
          ],
        })
      ),
    })
  );

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
};

// ── Cover page ─────────────────────────────────────────────────
const coverPage = [
  spacer(dxa(1.2)),

  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: "CRYPTOGRAPHY LIB LAB", font: "Calibri", size: pt(28), bold: true, color: BLUE })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: "Project Report", font: "Calibri", size: pt(18), color: BLUE_LIGHT })],
  }),

  hr(),
  spacer(80),

  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: "Course: Cryptography / Information Security Lab", font: "Calibri", size: pt(12), color: MUTED })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: "Scenario: Secure Student Records", font: "Calibri", size: pt(12), color: DARK })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: "Algorithms: AES-256 · DES · RSA-2048 · Hybrid", font: "Calibri", size: pt(12), color: DARK })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: "Language: Python 3.10 · PyCryptodome · Flask", font: "Calibri", size: pt(12), color: DARK })],
  }),

  spacer(dxa(0.4)),

  // Summary info box
  new Table({
    width: { size: 7000, type: WidthType.DXA },
    columnWidths: [3500, 3500],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: noBorder(),
            shading: { fill: GREY_BG, type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 200, right: 200 },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Project Type", font: "Calibri", size: pt(10), bold: true, color: MUTED })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Individual", font: "Calibri", size: pt(12), color: DARK })] }),
            ],
          }),
          new TableCell({
            borders: noBorder(),
            shading: { fill: GREY_BG, type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 200, right: 200 },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Difficulty", font: "Calibri", size: pt(10), bold: true, color: MUTED })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Medium-Plus (Path 3)", font: "Calibri", size: pt(12), color: DARK })] }),
            ],
          }),
        ],
      }),
    ],
  }),

  spacer(dxa(1.5)),
  new Paragraph({ children: [new PageBreak()] }),
];

// ── Section 1: Project Overview ────────────────────────────────
const section1 = [
  sectionHeading("1. Project Overview"),
  hr(),

  body("This project implements the Cryptography Lib Lab using Python 3.10 with the PyCryptodome library. The application encrypts and decrypts real student records using three approved paths: symmetric encryption (AES-256 and DES), algorithm comparison, and hybrid encryption (AES + RSA). All functionality is exposed through a modern dark-themed local web interface built with Flask."),
  spacer(80),

  subHeading("1.1  Selected Scenario"),
  body("Secure Student Records — a CSV file containing 15 fake student records (Student ID, Name, Department, GPA, Email, Phone) is used as the real input data. This simulates a realistic use case where sensitive academic data must be stored securely."),
  spacer(80),

  subHeading("1.2  Selected Paths"),
  dataTable(
    ["Path", "Algorithms", "Description", "Difficulty"],
    [
      ["Path 1", "AES-256 / DES", "Encrypt and decrypt students.csv, save ciphertext, verify recovery", "Medium-Easy"],
      ["Path 2", "AES vs DES", "Compare ciphertext size, encryption time, decryption time, security", "Medium"],
      ["Path 3", "AES + RSA", "AES encrypts data, RSA-2048 encrypts the AES key (Hybrid)", "Medium-Plus"],
    ],
    [1600, 1600, 4560, 1600]
  ),
  spacer(120),

  subHeading("1.3  Sample Input Data"),
  body("The input file students.csv contains 15 fake, anonymised student records with the following columns:"),
  bullet("StudentID — unique numeric identifier"),
  bullet("Name — fake full name"),
  bullet("Department — academic department"),
  bullet("GPA — grade point average"),
  bullet("Email — fake university email address"),
  bullet("Phone — fake phone number"),
  spacer(80),
  code("StudentID,Name,Department,GPA,Email,Phone"),
  code("1001,Ahmed Al-Rashid,Computer Engineering,3.72,ahmed.rashid@university.edu,+964-770-1234567"),
  code("1002,Sara Mohammed,Electrical Engineering,3.85,sara.mohammed@university.edu,+964-771-2345678"),
  code("...  (15 records total)"),
  spacer(120),
];

// ── Section 2: Algorithm Details ───────────────────────────────
const section2 = [
  sectionHeading("2. Algorithm Details"),
  hr(),

  subHeading("2.1  AES-256-CBC (Primary Algorithm)"),
  body("AES (Advanced Encryption Standard) with a 256-bit key in CBC (Cipher Block Chaining) mode was chosen as the primary symmetric algorithm. It is the current industry standard approved by NIST and has no known practical attacks."),
  dataTable(
    ["Property", "Value"],
    [
      ["Key Size", "256 bits (32 bytes)"],
      ["Block Size", "128 bits (16 bytes)"],
      ["Mode", "CBC (Cipher Block Chaining)"],
      ["IV Size", "16 bytes (randomly generated per encryption)"],
      ["Padding", "PKCS7"],
      ["Library", "PyCryptodome — Crypto.Cipher.AES"],
    ],
    [3000, 6360]
  ),
  spacer(120),

  subHeading("2.2  DES-CBC (Educational Comparison)"),
  body("DES (Data Encryption Standard) is included for educational comparison only. It uses a 64-bit key (56 bits effective) and is considered cryptographically broken due to its small key size, which makes it vulnerable to brute-force attacks."),
  dataTable(
    ["Property", "Value"],
    [
      ["Key Size", "64 bits (56 bits effective — 8 parity bits)"],
      ["Block Size", "64 bits (8 bytes)"],
      ["Mode", "CBC (Cipher Block Chaining)"],
      ["IV Size", "8 bytes (randomly generated per encryption)"],
      ["Padding", "PKCS7"],
      ["Library", "PyCryptodome — Crypto.Cipher.DES"],
    ],
    [3000, 6360]
  ),
  spacer(80),
  infoBox(
    ["WARNING: DES is deprecated and should never be used in real-world applications.",
     "It is included here strictly for educational comparison with AES as permitted by the project brief."],
    ORANGE_BG, ORANGE, "FCD34D"
  ),
  spacer(120),

  subHeading("2.3  RSA-2048 with OAEP (Key Encryption)"),
  body("RSA (Rivest–Shamir–Adleman) is an asymmetric encryption algorithm used in the hybrid scheme to encrypt the AES session key. A 2048-bit key pair is generated: the public key encrypts, and the private key decrypts. OAEP padding is applied for security."),
  dataTable(
    ["Property", "Value"],
    [
      ["Key Size", "2048 bits"],
      ["Padding", "OAEP (Optimal Asymmetric Encryption Padding)"],
      ["Usage", "Encrypt the 256-bit AES key only — NOT used for large data"],
      ["Library", "PyCryptodome — Crypto.PublicKey.RSA, Crypto.Cipher.PKCS1_OAEP"],
    ],
    [3000, 6360]
  ),
  spacer(120),

  subHeading("2.4  Hybrid Encryption (AES + RSA)"),
  body("Hybrid encryption combines the speed of AES with the key-distribution advantage of RSA. This mirrors real-world protocols such as TLS."),
  numbered("A random 256-bit AES key is generated for the session."),
  numbered("AES-256-CBC encrypts the student records file using this key."),
  numbered("RSA-2048 encrypts the AES key using the recipient's public key."),
  numbered("Both the encrypted data and the encrypted AES key are saved."),
  numbered("Decryption reverses this: RSA decrypts the AES key, then AES decrypts the data."),
  spacer(120),
];

// ── Section 3: Program Flow ────────────────────────────────────
const section3 = [
  sectionHeading("3. Program Flow"),
  hr(),

  body("The application follows the minimum required program flow from the project specification:"),
  spacer(80),

  dataTable(
    ["Step", "Action", "Output"],
    [
      ["1", "Load original data from file", "students.csv read into memory"],
      ["2", "Generate or load encryption key", "Random AES/DES key generated via get_random_bytes()"],
      ["3", "Encrypt the data", "Ciphertext produced using AES/DES/Hybrid"],
      ["4", "Save ciphertext, IV, and metadata", "students_encrypted.bin + students_metadata.json"],
      ["5", "Decrypt the ciphertext", "Plaintext recovered from ciphertext using stored key and IV"],
      ["6", "Compare with original", "SHA-256 hash of original vs SHA-256 hash of decrypted file"],
      ["7", "Print verification result", "SUCCESS or FAILED displayed in UI and terminal"],
    ],
    [600, 3360, 5400]
  ),
  spacer(120),

  subHeading("3.1  Example Terminal Output"),
  code("Original file loaded: students.csv"),
  code("AES key generated successfully."),
  code("File encrypted successfully: students_encrypted.bin"),
  code("File decrypted successfully: students_decrypted.csv"),
  code("Original  SHA-256: 4acf654f8f027417982fb34d86063ed93663580101fba91b6e7a51db9fba343a"),
  code("Decrypted SHA-256: 4acf654f8f027417982fb34d86063ed93663580101fba91b6e7a51db9fba343a"),
  code("Verification result: SUCCESS - decrypted file matches the original file."),
  spacer(120),

  subHeading("3.2  Code Structure"),
  dataTable(
    ["File", "Responsibility"],
    [
      ["crypto_utils.py", "All crypto functions: key generation, AES/DES/RSA/Hybrid encrypt-decrypt, SHA-256 verification, metadata save/load, algorithm comparison"],
      ["app.py", "Flask web backend with API routes: /api/encrypt, /api/decrypt, /api/compare, /api/generate-rsa"],
      ["gui_app.py", "Tkinter desktop GUI (alternative interface)"],
      ["main.py", "Entry point: launches web UI by default, --cli for terminal menu, --tkinter for desktop GUI"],
      ["templates/index.html", "Single-page web app with 4 tabs: Encrypt, Decrypt, AES vs DES, Hybrid"],
      ["static/style.css", "Dark-themed UI styling"],
      ["static/script.js", "Frontend logic: file upload, API calls, dynamic result rendering"],
      ["data/students.csv", "Sample input data (15 fake student records)"],
    ],
    [2400, 6960]
  ),
  spacer(120),
];

// ── Section 4: Results ─────────────────────────────────────────
const section4 = [
  sectionHeading("4. Results"),
  hr(),

  subHeading("4.1  AES-256 Encryption Results"),
  dataTable(
    ["Metric", "Value"],
    [
      ["Input File", "students.csv"],
      ["Original File Size", "1,374 bytes"],
      ["Ciphertext Size", "1,376 bytes (2 bytes of PKCS7 padding added)"],
      ["Encryption Time", "~4.58 ms"],
      ["Output File", "students_encrypted.bin"],
      ["Metadata File", "students_metadata.json (stores IV and original SHA-256)"],
    ],
    [3600, 5760]
  ),
  spacer(120),

  subHeading("4.2  AES vs DES Comparison Results"),
  dataTable(
    ["Metric", "AES-256", "DES"],
    [
      ["Key Size", "256 bits", "64 bits (56 effective)"],
      ["Block Size", "128 bits", "64 bits"],
      ["Ciphertext Size", "1,376 bytes", "1,376 bytes"],
      ["Encryption Time", "~0.07 ms", "~0.14 ms"],
      ["Decryption Time", "~0.06 ms", "~0.04 ms"],
      ["Decryption Valid", "YES", "YES"],
      ["Security Status", "Approved — No known attacks", "DEPRECATED — Brute-forceable"],
    ],
    [3120, 3120, 3120]
  ),
  spacer(80),
  body("Observation: Both algorithms produce the same ciphertext size for this file. AES is faster to encrypt and is exponentially more secure due to its 256-bit key space (2^256 possible keys vs 2^56 for DES)."),
  spacer(120),

  subHeading("4.3  Hybrid Encryption Results"),
  dataTable(
    ["Metric", "Value"],
    [
      ["Data Encrypted With", "AES-256-CBC (random session key)"],
      ["AES Key Encrypted With", "RSA-2048-OAEP (public key)"],
      ["Ciphertext Size", "1,376 bytes"],
      ["Encrypted AES Key Size", "256 bytes (RSA-2048 output)"],
      ["Total Encryption Time", "~1.31 ms"],
      ["Decryption Verification", "SUCCESS — SHA-256 hashes match"],
    ],
    [3600, 5760]
  ),
  spacer(120),

  subHeading("4.4  SHA-256 Verification"),
  body("SHA-256 is used to prove that decryption perfectly recovered the original data. The hash of the original file is stored in the metadata JSON at encryption time. After decryption, the hash of the recovered file is recomputed and compared:"),
  spacer(40),
  infoBox(
    ["Original  SHA-256: 4acf654f8f027417982fb34d86063ed93663580101fba91b6e7a51db9fba343a",
     "Decrypted SHA-256: 4acf654f8f027417982fb34d86063ed93663580101fba91b6e7a51db9fba343a",
     "Result: SUCCESS — Decrypted file matches the original file exactly."],
    GREEN_BG, GREEN, "86EFAC"
  ),
  spacer(120),
];

// ── Section 5: Security Questions ──────────────────────────────
const section5 = [
  sectionHeading("5. Security Understanding Questions"),
  hr(),

  qaQuestion(1, "Which algorithm did you choose, and why?"),
  qaAnswer("The primary algorithm chosen is AES-256-CBC. AES (Advanced Encryption Standard) was selected because it is the current industry standard for symmetric encryption, standardised by NIST in 2001. The 256-bit variant provides the highest security level and has no known practical attacks even against quantum computers with Grover's algorithm (effectively reducing key strength to 128 bits, still unbreakable). DES is also included strictly for educational comparison, and RSA-2048 is used in the hybrid scheme exclusively for encrypting the AES session key — not for encrypting the file data directly."),
  spacer(60),

  qaQuestion(2, "What is the key used for in your project?"),
  qaAnswer("The key is the secret parameter that controls the encryption and decryption process. Without the correct key, the ciphertext is computationally indistinguishable from random noise and cannot be reversed."),
  new Paragraph({
    indent: { left: 360 },
    spacing: { after: 40 },
    children: [new TextRun({ text: "AES key (32 bytes / 256 bits): ", font: "Calibri", size: pt(11), bold: true, color: DARK }),
               new TextRun({ text: "generated randomly with get_random_bytes(32) and used to encrypt and decrypt the student CSV file. Saved to students_key.bin.", font: "Calibri", size: pt(11), color: DARK })],
  }),
  new Paragraph({
    indent: { left: 360 },
    spacing: { after: 40 },
    children: [new TextRun({ text: "DES key (8 bytes / 64 bits): ", font: "Calibri", size: pt(11), bold: true, color: DARK }),
               new TextRun({ text: "generated randomly with get_random_bytes(8) and used for the DES comparison only.", font: "Calibri", size: pt(11), color: DARK })],
  }),
  new Paragraph({
    indent: { left: 360 },
    spacing: { after: 120 },
    children: [new TextRun({ text: "RSA key pair (2048 bits): ", font: "Calibri", size: pt(11), bold: true, color: DARK }),
               new TextRun({ text: "the public key encrypts the AES session key; the private key decrypts it. The actual file data is never encrypted with RSA directly.", font: "Calibri", size: pt(11), color: DARK })],
  }),

  qaQuestion(3, "What is the role of the IV (Initialisation Vector)?"),
  qaAnswer("The IV (Initialisation Vector) is a random value used in CBC mode to ensure that encrypting the same plaintext twice with the same key produces different ciphertext. Without the IV, identical blocks of plaintext would produce identical ciphertext blocks, which leaks patterns. In this project:"),
  new Paragraph({
    indent: { left: 360 },
    spacing: { after: 40 },
    children: [new TextRun({ text: "AES IV: ", font: "Calibri", size: pt(11), bold: true, color: DARK }),
               new TextRun({ text: "16 bytes, generated fresh for each encryption using get_random_bytes(AES.block_size).", font: "Calibri", size: pt(11), color: DARK })],
  }),
  new Paragraph({
    indent: { left: 360 },
    spacing: { after: 120 },
    children: [new TextRun({ text: "DES IV: ", font: "Calibri", size: pt(11), bold: true, color: DARK }),
               new TextRun({ text: "8 bytes, generated fresh for each encryption using get_random_bytes(DES.block_size).", font: "Calibri", size: pt(11), color: DARK })],
  }),
  qaAnswer("The IV is not secret — it is saved in the metadata JSON file alongside the algorithm name and original SHA-256 hash so that decryption can reconstruct the exact cipher object. It must be unique per encryption to prevent pattern leakage."),
  spacer(60),

  qaQuestion(4, "What does the encrypted output look like compared to the original data?"),
  qaAnswer("The original file is a human-readable CSV with structured text containing student names, IDs, GPAs, and emails. After encryption, the output is binary ciphertext that appears as completely random bytes with no discernible structure or patterns. When viewed in Base64 encoding (as shown in the web UI), it appears as a random string of letters, numbers, and symbols."),
  spacer(40),
  new Paragraph({
    indent: { left: 360 },
    spacing: { after: 40 },
    children: [new TextRun({ text: "Original (plaintext): ", font: "Calibri", size: pt(11), bold: true, color: DARK })],
  }),
  code("StudentID,Name,Department,GPA,Email,Phone"),
  code("1001,Ahmed Al-Rashid,Computer Engineering,3.72,..."),
  spacer(40),
  new Paragraph({
    indent: { left: 360 },
    spacing: { after: 40 },
    children: [new TextRun({ text: "Encrypted (Base64 of ciphertext): ", font: "Calibri", size: pt(11), bold: true, color: DARK })],
  }),
  code("A9SwWXbwXnCf1Dpx7tAjfscDbWIfJMM6EC8dxZQtUWs0mxj0aqPhLi+VuOqj6OTG"),
  code("otjH/c/v9hzmv28UQtSAq8lVVCt9SB+OsnAgAagL1VCkOdD9Khg2HrhlBUaIk1n0..."),
  spacer(80),
  qaAnswer("The ciphertext is the same size as the original data (padded to the nearest block boundary). There is no way to recover any information about the original data from the ciphertext without the key and IV."),
  spacer(60),

  qaQuestion(5, "How did you prove that decryption recovered the original data?"),
  qaAnswer("The project uses SHA-256 cryptographic hashing to provide a mathematically rigorous proof of data integrity. The verification process works as follows:"),
  numbered("Before encryption, the SHA-256 hash of the original file is computed and stored in the metadata JSON."),
  numbered("After decryption, the SHA-256 hash of the recovered file is recomputed."),
  numbered("The two hashes are compared. If they match exactly, the decryption is verified as successful."),
  spacer(40),
  infoBox(
    ["SHA-256 produces a 256-bit (64 hex character) digest that is unique to the file's content.",
     "Even a single bit difference in the decrypted output would produce a completely different hash.",
     "Matching hashes guarantee byte-for-byte identical files with overwhelming probability (2^-256 collision chance)."],
    GREEN_BG, GREEN, "86EFAC"
  ),
  spacer(60),

  qaQuestion(6, "What is one security limitation of your project?"),
  qaAnswer("The most significant security limitation is that the symmetric encryption keys (AES and DES) are stored as plain binary files (students_key.bin) in the output directory. This means that anyone with access to the file system can retrieve the key and decrypt the ciphertext. In a real-world system, the key would be:"),
  bullet("Protected by a passphrase using a Key Derivation Function (KDF) such as PBKDF2 or Argon2"),
  bullet("Stored in a hardware security module (HSM) or a secure key management service"),
  bullet("Transmitted over an authenticated secure channel — never stored alongside the ciphertext"),
  spacer(40),
  body("A secondary limitation is that DES should not be used in any real application. It is included only for the educational algorithm-comparison requirement of this project."),
  spacer(80),
];

// ── Section 6: Deliverables ────────────────────────────────────
const section6 = [
  sectionHeading("6. Deliverables"),
  hr(),

  dataTable(
    ["Deliverable", "File / Location", "Status"],
    [
      ["Source Code", "main.py, crypto_utils.py, app.py, gui_app.py, templates/, static/", "COMPLETE"],
      ["Sample Input Data", "data/students.csv (15 fake records)", "COMPLETE"],
      ["Encrypted Output", "output/students_encrypted.bin", "COMPLETE"],
      ["Decrypted Output", "output/students_decrypted.csv", "COMPLETE"],
      ["Metadata File", "output/students_metadata.json (IV + SHA-256)", "COMPLETE"],
      ["Short Report", "report.docx (this document)", "COMPLETE"],
      ["Video Demo", "2–5 minute screen recording", "PENDING"],
    ],
    [2400, 4560, 2400]
  ),
  spacer(120),

  subHeading("6.1  Extra Features Implemented"),
  bullet("Modern dark-themed local web UI (Flask + HTML/CSS/JS) — all operations accessible via browser"),
  bullet("Interactive CLI menu (python main.py --cli) with all 7 operations"),
  bullet("Tkinter desktop GUI (python main.py --tkinter) as an alternative interface"),
  bullet("SHA-256 hash verification — mathematically proves byte-for-byte data recovery"),
  bullet("AES vs DES benchmark comparison — side-by-side table with timing and security analysis"),
  bullet("Hybrid encryption (AES + RSA) — mirrors real-world TLS key exchange"),
  bullet("Base64 ciphertext display — ciphertext shown in readable format in the web UI"),
  bullet("Drag-and-drop file upload interface in the web UI"),
  bullet("GitHub repository: https://github.com/Hussinanwer/crypto_project"),
  spacer(120),
];

// ── Section 7: Libraries Used ──────────────────────────────────
const section7 = [
  sectionHeading("7. Libraries and Tools"),
  hr(),

  dataTable(
    ["Library / Tool", "Version", "Purpose"],
    [
      ["PyCryptodome", "3.23.0", "AES, DES, RSA, padding, random bytes"],
      ["Flask", "3.1.3", "Local web server and REST API routes"],
      ["hashlib", "Built-in", "SHA-256 hashing for verification"],
      ["base64", "Built-in", "Base64 encoding of ciphertext for display"],
      ["json", "Built-in", "Saving/loading IV and metadata"],
      ["tkinter", "Built-in", "Desktop GUI (alternative interface)"],
      ["Python", "3.10.11", "Runtime language"],
    ],
    [2400, 1800, 5160]
  ),
  spacer(120),
];

// ── Full document ──────────────────────────────────────────────
const allChildren = [
  ...coverPage,
  ...section1,
  ...section2,
  new Paragraph({ children: [new PageBreak()] }),
  ...section3,
  ...section4,
  new Paragraph({ children: [new PageBreak()] }),
  ...section5,
  new Paragraph({ children: [new PageBreak()] }),
  ...section6,
  ...section7,
];

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: "numbers",
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  styles: {
    default: {
      document: { run: { font: "Calibri", size: pt(11), color: DARK } },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: pt(14), bold: true, font: "Calibri", color: BLUE },
        paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: pt(12), bold: true, font: "Calibri", color: TEAL },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 1 },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE_LIGHT, space: 1 } },
            children: [
              new TextRun({ text: "Cryptography Lib Lab — Project Report", font: "Calibri", size: pt(9), color: MUTED }),
              new TextRun({ text: "     |     AES-256 · DES · RSA-2048 · Hybrid", font: "Calibri", size: pt(9), color: MUTED }),
            ],
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 6, color: BLUE_LIGHT, space: 1 } },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Page ", font: "Calibri", size: pt(9), color: MUTED }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Calibri", size: pt(9), color: MUTED }),
              new TextRun({ text: " | Cryptography / Information Security Lab", font: "Calibri", size: pt(9), color: MUTED }),
            ],
          }),
        ],
      }),
    },
    children: allChildren,
  }],
});

const outPath = "C:\\Users\\pc\\Documents\\Engineering\\Year 4\\Secound_term\\Embedded Security\\Project\\crypto_project\\Cryptography_Lab_Report.docx";

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outPath, buffer);
  console.log("Report generated: " + outPath);
});
