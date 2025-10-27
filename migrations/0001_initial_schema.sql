-- HPX Travel Reimbursement System - Database Schema
-- Version: 1.0
-- Created: 2024-10-27

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_code TEXT UNIQUE NOT NULL,
    employee_name TEXT NOT NULL,
    designation TEXT,
    department TEXT,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- Drafts Table (Work in Progress)
CREATE TABLE IF NOT EXISTS drafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    draft_name TEXT,
    form_data TEXT NOT NULL,
    receipts_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Templates Table (Reusable Patterns)
CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    template_name TEXT NOT NULL,
    template_data TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Claims Table (Submitted Claims History)
CREATE TABLE IF NOT EXISTS claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    claim_period TEXT NOT NULL,
    purpose_of_travel TEXT,
    total_amount REAL NOT NULL,
    journey_amount REAL DEFAULT 0,
    hotel_amount REAL DEFAULT 0,
    conveyance_amount REAL DEFAULT 0,
    da_amount REAL DEFAULT 0,
    other_amount REAL DEFAULT 0,
    form_data TEXT NOT NULL,
    excel_generated BOOLEAN DEFAULT 1,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- OCR Learning Table (AI Pattern Learning)
CREATE TABLE IF NOT EXISTS ocr_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    merchant_name TEXT,
    category TEXT,
    amount_pattern TEXT,
    typical_amount REAL,
    location TEXT,
    confidence_score REAL,
    times_used INTEGER DEFAULT 1,
    last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Receipt Analysis Table (OCR History)
CREATE TABLE IF NOT EXISTS receipt_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    receipt_image_hash TEXT,
    extracted_amount REAL,
    extracted_date TEXT,
    extracted_merchant TEXT,
    category TEXT,
    ocr_confidence REAL,
    user_corrected BOOLEAN DEFAULT 0,
    corrected_amount REAL,
    analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sessions Table (Login Sessions)
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    device_info TEXT,
    ip_address TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_users_employee_code ON users(employee_code);
CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_period ON claims(user_id, claim_period);
CREATE INDEX IF NOT EXISTS idx_ocr_patterns_user_merchant ON ocr_patterns(user_id, merchant_name);
CREATE INDEX IF NOT EXISTS idx_receipt_analysis_user ON receipt_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
