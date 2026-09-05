-- =====================================================================
-- Seed data: the company's standard positions ("the playbook").
-- These rows are exactly what the rule engine checks every lease
-- against. Edit them here, or later through the Standards page in
-- the app, to change what counts as a match/deviation/prohibited term.
-- =====================================================================

USE lease_review_db;

INSERT INTO standards (category, label, rule_type, min_value, max_value, unit, keywords, description, severity) VALUES

-- Acceptable ranges -----------------------------------------------------
('deposit', 'Security Deposit Amount', 'range', 1, 3, 'months_rent',
 'security deposit,refundable deposit,deposit amount,deposit equivalent to,deposit of',
 'The security deposit must be between 1 and 3 months'' rent. Deposits outside this range are flagged as a deviation.',
 'high'),

('notice_period', 'Termination Notice Period', 'range', 30, 90, 'days',
 'notice period,written notice,notice to vacate,terminate this lease,notice of termination,days notice',
 'Either party must give between 30 and 90 days'' written notice to terminate the lease.',
 'high'),

-- Required clauses -------------------------------------------------------
('maintenance', 'Maintenance Responsibility Clause', 'required_clause', NULL, NULL, NULL,
 'maintenance,repairs,upkeep,structural repair,responsible for repairs,maintain the premises',
 'The lease must clearly state which party (landlord or tenant) is responsible for maintenance and repairs.',
 'high'),

('deposit_return', 'Return-of-Deposit Timeline', 'required_clause', NULL, NULL, NULL,
 'return of deposit,refund the deposit,deposit shall be returned,deposit refund,return the security deposit,deposit will be refunded',
 'The lease must state a clear timeline for returning the security deposit after the tenant vacates.',
 'high'),

('renewal_terms', 'Renewal / Continuation Terms', 'required_clause', NULL, NULL, NULL,
 'renew this lease,renewal of this agreement,option to renew,lease renewal,extend this lease,may be renewed,renewed for an additional,renewed for a further',
 'The lease should clearly state whether and how the agreement can be renewed or extended.',
 'medium'),

-- Prohibited terms ---------------------------------------------------------
('auto_renewal', 'Silent Automatic Renewal', 'prohibited', NULL, NULL, NULL,
 'automatically renew,automatic renewal,shall automatically extend,evergreen renewal',
 'The company never accepts automatic renewal clauses that do not require advance written notice to the tenant.',
 'critical'),

('non_refundable_deposit', 'Non-Refundable Deposit', 'prohibited', NULL, NULL, NULL,
 'non-refundable deposit,deposit is non-refundable,deposit shall not be refunded,forfeit the entire deposit',
 'The company never accepts a security deposit being labeled entirely non-refundable.',
 'critical'),

('unilateral_rent_increase', 'Unilateral Rent Increase', 'prohibited', NULL, NULL, NULL,
 'increase rent at any time,sole discretion to increase rent,rent may be increased without notice,arbitrarily increase the rent',
 'The company never accepts a clause letting the landlord raise rent at will without notice or a fixed schedule.',
 'critical'),

('waiver_of_rights', 'Waiver of Legal Rights', 'prohibited', NULL, NULL, NULL,
 'waives all rights,waive any right to legal action,tenant waives the right to sue,waives the right to a jury,irrevocably waives',
 'The company never accepts clauses in which the tenant waives their legal right to seek recourse.',
 'critical');
