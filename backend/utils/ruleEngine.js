/**
 * ruleEngine.js
 * -------------
 * The heart of the review assistant. Takes a lease's clauses and the
 * company's standards (loaded from the `standards` table) and produces
 * a list of findings. The logic is deterministic and rule-based on
 * purpose: a legal reviewer can trace every finding back to a specific
 * keyword match and a specific standard row, instead of trusting an
 * opaque model's judgement.
 *
 * Every finding follows one of four statuses:
 *   - match             : the agreement satisfies the standard
 *   - deviation         : the agreement addresses the topic but falls outside policy
 *   - missing           : the topic is required but was not found anywhere (silence)
 *   - prohibited_found  : a term the company never accepts was found
 */

const { extractMonthsRent, extractDays } = require("./numberExtractor");

/** Finds all clauses containing at least one of the given keywords. */
function findMatchingClauses(clauses, keywordsCsv) {
  const keywords = keywordsCsv
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  return clauses.filter((clause) => {
    const lower = clause.toLowerCase();
    return keywords.some((kw) => lower.includes(kw));
  });
}

function evaluateRangeStandard(standard, clauses) {
  const matches = findMatchingClauses(clauses, standard.keywords);

  if (matches.length === 0) {
    return {
      status: "missing",
      quoted_clause: null,
      explanation: `The agreement does not appear to address "${standard.label}" anywhere. This required term is missing entirely and should be added before signing.`,
    };
  }

  // Try to extract a numeric value from the first matching clause.
  const extractor = standard.unit === "days" ? extractDays : extractMonthsRent;
  let extractedValue = null;
  let sourceClause = matches[0];

  for (const clause of matches) {
    const value = extractor(clause);
    if (value !== null) {
      extractedValue = value;
      sourceClause = clause;
      break;
    }
  }

  if (extractedValue === null) {
    return {
      status: "deviation",
      quoted_clause: sourceClause,
      explanation: `The clause references "${standard.label}" but no clear numeric value could be identified. This needs manual review to confirm it falls within the accepted range of ${standard.min_value}-${standard.max_value} ${standard.unit}.`,
    };
  }

  const min = parseFloat(standard.min_value);
  const max = parseFloat(standard.max_value);

  if (extractedValue >= min && extractedValue <= max) {
    return {
      status: "match",
      quoted_clause: sourceClause,
      explanation: `The agreement states ${extractedValue} ${standard.unit}, which falls within the company's accepted range of ${min}-${max} ${standard.unit}.`,
    };
  }

  const direction = extractedValue < min ? "below" : "above";
  return {
    status: "deviation",
    quoted_clause: sourceClause,
    explanation: `The agreement states ${extractedValue} ${standard.unit}, which is ${direction} the company's accepted range of ${min}-${max} ${standard.unit}.`,
  };
}

function evaluateRequiredClauseStandard(standard, clauses) {
  const matches = findMatchingClauses(clauses, standard.keywords);

  if (matches.length === 0) {
    return {
      status: "missing",
      quoted_clause: null,
      explanation: `The agreement does not contain a "${standard.label}" clause. ${standard.description} Its absence is a gap, not something to overlook.`,
    };
  }

  return {
    status: "match",
    quoted_clause: matches[0],
    explanation: `The agreement addresses "${standard.label}".`,
  };
}

function evaluateProhibitedStandard(standard, clauses) {
  const matches = findMatchingClauses(clauses, standard.keywords);

  if (matches.length > 0) {
    return {
      status: "prohibited_found",
      quoted_clause: matches[0],
      explanation: `This clause matches "${standard.label}", a term the company never accepts. ${standard.description}`,
    };
  }

  return {
    status: "match",
    quoted_clause: null,
    explanation: `No clause matching "${standard.label}" was found. The agreement complies with this policy.`,
  };
}

/**
 * Runs every active standard against the lease's clauses and returns
 * an array of finding objects (not yet saved to the database).
 */
function runReview(clauses, standards) {
  return standards.map((standard) => {
    let result;

    if (standard.rule_type === "range") {
      result = evaluateRangeStandard(standard, clauses);
    } else if (standard.rule_type === "required_clause") {
      result = evaluateRequiredClauseStandard(standard, clauses);
    } else {
      result = evaluateProhibitedStandard(standard, clauses);
    }

    return {
      standard_id: standard.id,
      category: standard.category,
      label: standard.label,
      status: result.status,
      quoted_clause: result.quoted_clause,
      explanation: result.explanation,
      severity: standard.severity,
    };
  });
}

module.exports = { runReview, findMatchingClauses };
