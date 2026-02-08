-- Migration: Add claim_type support for 3 claim types
-- Created: 2026-02-06
-- Purpose: Enable Tour Allowance, OPD Medical, and Contingency claims

-- Add claim_type column to claims table
ALTER TABLE claims ADD COLUMN claim_type TEXT DEFAULT 'tour';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_claims_type ON claims(claim_type);

-- Update existing claims to have 'tour' type
UPDATE claims SET claim_type = 'tour' WHERE claim_type IS NULL;
