-- =====================================================================
-- Lease Agreement Review Assistant - Database Schema
-- MySQL 8
-- =====================================================================

CREATE DATABASE IF NOT EXISTS lease_review_db;
USE lease_review_db;

-- ---------------------------------------------------------------------
-- standards
-- The company's "playbook" of standard positions. Every check the
-- rule engine performs comes from a row in this table, so the legal
-- team can see and edit exactly what the system is checking for.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS standards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(60) NOT NULL,          -- e.g. 'deposit', 'notice_period', 'maintenance'
    label VARCHAR(150) NOT NULL,            -- human readable name shown in UI
    rule_type ENUM('range', 'required_clause', 'prohibited') NOT NULL,
    min_value DECIMAL(12,2) NULL,           -- used for 'range' rules (e.g. min deposit amount / min notice days)
    max_value DECIMAL(12,2) NULL,           -- used for 'range' rules
    unit VARCHAR(30) NULL,                  -- e.g. 'INR', 'days', 'months'
    keywords TEXT NOT NULL,                 -- comma-separated keywords/phrases the engine searches for
    description TEXT NOT NULL,              -- plain-language explanation of the standard / why it matters
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- reviews
-- One row per lease agreement submitted for review.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,            -- filename or a name the user gives the agreement
    source_type ENUM('pasted_text', 'file_upload') NOT NULL DEFAULT 'pasted_text',
    full_text LONGTEXT NOT NULL,            -- the full lease text the engine analyzed
    overall_status ENUM('clean', 'needs_review') NOT NULL DEFAULT 'needs_review',
    total_findings INT NOT NULL DEFAULT 0,
    deviation_count INT NOT NULL DEFAULT 0,
    missing_count INT NOT NULL DEFAULT 0,
    prohibited_count INT NOT NULL DEFAULT 0,
    match_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- findings
-- One row per check the engine ran against a specific review.
-- Every deviation/prohibited finding must carry a quoted clause;
-- 'missing' findings intentionally have no quote (silence = finding).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS findings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT NOT NULL,
    standard_id INT NULL,                   -- nullable in case a standard is later deleted
    category VARCHAR(60) NOT NULL,
    label VARCHAR(150) NOT NULL,
    status ENUM('match', 'deviation', 'missing', 'prohibited_found') NOT NULL,
    quoted_clause TEXT NULL,                -- the exact clause text found in the agreement
    explanation TEXT NOT NULL,              -- plain-language statement of the deviation / why it matches / what's missing
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_findings_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    CONSTRAINT fk_findings_standard FOREIGN KEY (standard_id) REFERENCES standards(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------
-- summary_points
-- The 3-4 plain-language "what a signer needs to understand" points
-- generated per review, stored separately from findings since they
-- are informational, not pass/fail checks.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS summary_points (
    id INT AUTO_INCREMENT PRIMARY KEY,
    review_id INT NOT NULL,
    heading VARCHAR(150) NOT NULL,
    plain_explanation TEXT NOT NULL,
    quoted_clause TEXT NULL,
    display_order INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_summary_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
);

CREATE INDEX idx_findings_review ON findings(review_id);
CREATE INDEX idx_summary_review ON summary_points(review_id);
CREATE INDEX idx_standards_active ON standards(active);
