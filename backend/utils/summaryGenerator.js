/**
 * summaryGenerator.js
 * -------------------
 * Produces the "plain-language summary of the three or four terms a
 * signer most needs to understand" required by the problem statement.
 * This is separate from pass/fail findings - it always reports the
 * actual terms in the agreement, in plain English, whether or not
 * they match company policy.
 */

const { findMatchingClauses } = require("./ruleEngine");
const { extractMonthsRent, extractDays, extractCurrencyAmount } = require("./numberExtractor");

function buildSummaryPoints(clauses) {
  const points = [];

  // 1. Rent amount
  const rentClauses = findMatchingClauses(clauses, "monthly rent,rent shall be,rent of,rent payable");
  if (rentClauses.length > 0) {
    const amount = extractCurrencyAmount(rentClauses[0]);
    points.push({
      heading: "Monthly Rent",
      plain_explanation: amount
        ? `The tenant pays ${amount} in rent under this agreement.`
        : "The agreement specifies a rent amount, but the exact figure could not be automatically extracted - check this clause directly.",
      quoted_clause: rentClauses[0],
    });
  } else {
    points.push({
      heading: "Monthly Rent",
      plain_explanation: "No clause explicitly stating the monthly rent amount was found.",
      quoted_clause: null,
    });
  }

  // 2. Security deposit
  const depositClauses = findMatchingClauses(clauses, "security deposit,refundable deposit,deposit amount,deposit of");
  if (depositClauses.length > 0) {
    const months = extractMonthsRent(depositClauses[0]);
    const amount = extractCurrencyAmount(depositClauses[0]);
    let explanation = "The agreement requires a security deposit.";
    if (months !== null) explanation = `The tenant must pay a security deposit equal to ${months} month(s) of rent.`;
    else if (amount) explanation = `The tenant must pay a security deposit of ${amount}.`;
    points.push({ heading: "Security Deposit", plain_explanation: explanation, quoted_clause: depositClauses[0] });
  } else {
    points.push({
      heading: "Security Deposit",
      plain_explanation: "No clause specifying a security deposit amount was found in the agreement.",
      quoted_clause: null,
    });
  }

  // 3. Notice period to end the lease
  const noticeClauses = findMatchingClauses(clauses, "notice period,written notice,notice to vacate,terminate this lease,notice of termination,days notice,terminating this agreement");
  if (noticeClauses.length > 0) {
    const days = extractDays(noticeClauses[0]);
    points.push({
      heading: "Ending the Lease",
      plain_explanation: days !== null
        ? `Either party must give ${days} days' written notice before ending the lease.`
        : "The agreement describes a notice requirement for ending the lease, but the exact period should be double-checked.",
      quoted_clause: noticeClauses[0],
    });
  } else {
    points.push({
      heading: "Ending the Lease",
      plain_explanation: "No clause describing how much notice is needed to end the lease was found.",
      quoted_clause: null,
    });
  }

  // 4. Renewal terms
  const renewalClauses = findMatchingClauses(clauses, "renew this lease,renewal of this agreement,option to renew,automatically renew,automatic renewal");
  if (renewalClauses.length > 0) {
    const isAuto = /automatically renew|automatic renewal/i.test(renewalClauses[0]);
    points.push({
      heading: "Renewal Terms",
      plain_explanation: isAuto
        ? "This lease renews automatically unless action is taken - read this clause carefully to see what notice, if any, is required to opt out."
        : "The agreement gives an option to renew the lease under stated terms.",
      quoted_clause: renewalClauses[0],
    });
  } else {
    points.push({
      heading: "Renewal Terms",
      plain_explanation: "The agreement does not clearly state whether or how it can be renewed.",
      quoted_clause: null,
    });
  }

  return points;
}

module.exports = { buildSummaryPoints };
