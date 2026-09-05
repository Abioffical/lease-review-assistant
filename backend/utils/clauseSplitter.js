/**
 * clauseSplitter.js
 * -----------------
 * Breaks a raw lease agreement's text into individual "clauses" so the
 * rule engine can search and quote them one at a time, instead of
 * matching against one giant blob of text.
 *
 * The splitting strategy is intentionally simple (beginner-friendly):
 *  1. Split on blank lines / newlines first (paragraphs).
 *  2. Within long paragraphs, also split on sentence boundaries.
 *  3. Clean up whitespace and drop empty fragments.
 */

function splitIntoClauses(rawText) {
  if (!rawText || typeof rawText !== "string") return [];

  // Normalize line endings and collapse excessive blank lines
  const normalized = rawText.replace(/\r\n/g, "\n").trim();

  // First pass: split on paragraph breaks (numbered clauses usually
  // start on their own line in real lease documents, e.g. "1. Rent...")
  const paragraphs = normalized
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const clauses = [];

  paragraphs.forEach((para) => {
    // If a paragraph is short enough, treat it as one clause.
    if (para.length <= 400) {
      clauses.push(para);
      return;
    }

    // Otherwise split long paragraphs into sentences so quotes stay
    // short and precise rather than dumping a wall of text.
    const sentences = para
      .split(/(?<=[.;])\s+(?=[A-Z0-9])/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    clauses.push(...sentences);
  });

  return clauses;
}

module.exports = { splitIntoClauses };
