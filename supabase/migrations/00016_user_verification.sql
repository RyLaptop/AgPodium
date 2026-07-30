-- ============================================================
-- 00016 — manual account verification by admins
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

-- Existing site admins are automatically verified
UPDATE public.users SET is_verified = true WHERE is_site_admin = true;

NOTIFY pgrst, 'reload schema';
