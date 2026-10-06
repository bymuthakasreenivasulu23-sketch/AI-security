-- TrustLens AI Database Schema
-- Compatible with PostgreSQL and Replit Postgres

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    auto_scan BOOLEAN DEFAULT TRUE NOT NULL,
    ai_analysis BOOLEAN DEFAULT TRUE NOT NULL,
    telemetry_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    sensitive_page_protection BOOLEAN DEFAULT TRUE NOT NULL,
    show_low_confidence BOOLEAN DEFAULT FALSE NOT NULL,
    risk_notification_threshold INTEGER DEFAULT 60 CHECK (risk_notification_threshold BETWEEN 0 AND 100),
    retention_days INTEGER DEFAULT 30 CHECK (retention_days BETWEEN 1 AND 365),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Scans Table
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    page_url TEXT NOT NULL,
    page_title VARCHAR(500) NOT NULL DEFAULT 'Untitled Page',
    page_type VARCHAR(100) NOT NULL DEFAULT 'general',
    risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'mild', 'moderate', 'high', 'critical')),
    finding_count INTEGER NOT NULL DEFAULT 0 CHECK (finding_count >= 0),
    analysis_mode VARCHAR(20) NOT NULL DEFAULT 'rule_based' CHECK (analysis_mode IN ('ai', 'rule_based')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Findings Table
CREATE TABLE IF NOT EXISTS findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    confidence NUMERIC(3, 2) NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    evidence TEXT NOT NULL,
    explanation TEXT NOT NULL,
    potential_impact TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    source_element VARCHAR(500) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    finding_id UUID NOT NULL REFERENCES findings(id) ON DELETE CASCADE,
    feedback_type VARCHAR(50) NOT NULL CHECK (feedback_type IN ('accurate', 'false_positive', 'helpful', 'not_helpful', 'missed_element')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_finding_feedback UNIQUE (user_id, finding_id)
);

-- Indexes for performance and data isolation
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_domain ON scans(domain);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_findings_scan_id ON findings(scan_id);
CREATE INDEX IF NOT EXISTS idx_findings_category ON findings(category);
CREATE INDEX IF NOT EXISTS idx_feedback_finding_id ON feedback(finding_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
