-- Add status column to org_affiliations for request/accept flow
ALTER TABLE org_affiliations ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'accepted';

-- Deduplicate bidirectional rows (keep only one per pair, with status='accepted')
DELETE FROM org_affiliations a
WHERE EXISTS (
  SELECT 1 FROM org_affiliations b
  WHERE b.org_id = a.affiliate_org_id
    AND b.affiliate_org_id = a.org_id
    AND b.id < a.id
);

NOTIFY pgrst, 'reload schema';
