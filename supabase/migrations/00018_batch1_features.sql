-- ============================================================
-- 00018 — batch 1: profile social links, org GroupMe/Flare, featured org
-- ============================================================

-- User profile social links
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS tiktok_url text,
  ADD COLUMN IF NOT EXISTS contact_email text;

-- Org GroupMe + Flare community links with member-only lock toggle
ALTER TABLE public.orgs
  ADD COLUMN IF NOT EXISTS groupme_url text,
  ADD COLUMN IF NOT EXISTS flare_url text,
  ADD COLUMN IF NOT EXISTS social_links_locked boolean NOT NULL DEFAULT false;

-- Featured org of the week flag
ALTER TABLE public.orgs
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

NOTIFY pgrst, 'reload schema';
