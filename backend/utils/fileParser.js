/**
 * fileParser.js
 * -------------
 * Extracts plain text from an uploaded lease file. Supports .txt and
 * .pdf files, which covers the common ways a lease document would be
 * shared without needing any external service.
 */

const fs = require("fs");
const pdfParse = require("pdf-parse");

async function extractTextFromFile(filePath, mimeType) {
  if (mimeType === "application/pdf" || filePath.toLowerCase().endsWith(".pdf")) {
    const dataBuffer = fs.readFileSync(filePath);
    const parsed = await pdfParse(dataBuffer);
    return parsed.text;
  }

  // Default: treat as plain text
  return fs.readFileSync(filePath, "utf-8");
}

module.exports = { extractTextFromFile };
