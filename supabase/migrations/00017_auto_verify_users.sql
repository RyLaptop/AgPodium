-- ============================================================
-- 00017 — remove manual verification gate; all users auto-verified
-- ============================================================

-- Verify any existing accounts that weren't approved yet
UPDATE public.users SET is_verified = true WHERE is_verified = false;

-- Change default so new accounts are verified immediately on creation
ALTER TABLE public.users ALTER COLUMN is_verified SET DEFAULT true;

NOTIFY pgrst, 'reload schema';
