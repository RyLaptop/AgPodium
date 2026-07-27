-- Contact email for orgs (used for transactional notifications to directors)
ALTER TABLE public.orgs ADD COLUMN IF NOT EXISTS contact_email text;

NOTIFY pgrst, 'reload schema';
