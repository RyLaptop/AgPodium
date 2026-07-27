-- Create storage buckets for org logos and user avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('org-logos', 'org-logos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Recurring meeting series grouping
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS series_id uuid;
CREATE INDEX IF NOT EXISTS meetings_series_id_idx ON meetings (series_id) WHERE series_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
