/**
 * numberExtractor.js
 * ------------------
 * Small helpers to pull numeric values (a count of months, or a count
 * of days) out of a clause's plain English text. Kept deliberately
 * simple/regex-based so the whole review process stays transparent
 * and explainable to a legal reviewer (no black-box guessing).
 */

const WORD_NUMBERS = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirty: 30, sixty: 60, ninety: 90,
};

function wordToNumber(word) {
  if (!word) return null;
  const lower = word.toLowerCase();
  if (WORD_NUMBERS[lower] !== undefined) return WORD_NUMBERS[lower];
  const asNum = parseFloat(word.replace(/,/g, ""));
  return Number.isNaN(asNum) ? null : asNum;
}

/**
 * Extracts a "number of months" value from a clause, e.g.
 * "a deposit of 2 months' rent" -> 2
 * "three months' rent as security deposit" -> 3
 */
function extractMonthsRent(clauseText) {
  const patterns = [
    /(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:-|\s)?months?['\u2019]?\s*rent/i,
    /(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:-|\s)?months?\s*(?:of\s*)?deposit/i,
  ];
  for (const pattern of patterns) {
    const match = clauseText.match(pattern);
    if (match) {
      const value = wordToNumber(match[1]);
      if (value !== null) return value;
    }
  }
  return null;
}

/**
 * Extracts a "number of days" value from a clause, converting months
 * to days (x30) when the clause states notice in months instead.
 * e.g. "60 days written notice" -> 60
 *      "two months' notice"     -> 60
 */
function extractDays(clauseText) {
  const dayPattern = /(\d+(?:\.\d+)?|thirty|sixty|ninety|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:-|\s)?days?/i;
  const dayMatch = clauseText.match(dayPattern);
  if (dayMatch) {
    const value = wordToNumber(dayMatch[1]);
    if (value !== null) return value;
  }

  const monthPattern = /(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*(?:-|\s)?months?/i;
  const monthMatch = clauseText.match(monthPattern);
  if (monthMatch) {
    const value = wordToNumber(monthMatch[1]);
    if (value !== null) return value * 30;
  }

  return null;
}

/**
 * Extracts a currency-style rent/deposit amount, e.g. "Rs. 50,000" or
 * "INR 50000" or "$1200". Used only for the plain-language summary,
 * not for pass/fail range checks (which use extractMonthsRent).
 */
function extractCurrencyAmount(clauseText) {
  const pattern = /(?:rs\.?|inr|₹|\$|usd)\s*([\d,]+(?:\.\d+)?)/i;
  const match = clauseText.match(pattern);
  if (match) {
    return match[0].trim();
  }
  return null;
}

module.exports = { extractMonthsRent, extractDays, extractCurrencyAmount, wordToNumber };
