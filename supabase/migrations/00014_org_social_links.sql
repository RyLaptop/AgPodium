ALTER TABLE public.orgs ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE public.orgs ADD COLUMN IF NOT EXISTS tiktok_url text;
ALTER TABLE public.orgs ADD COLUMN IF NOT EXISTS instagram_url text;

NOTIFY pgrst, 'reload schema';
