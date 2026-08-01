-- Ad click tracking
CREATE TABLE IF NOT EXISTS public.ad_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('universal', 'premium', 'standard')),
  clicked_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

-- Org media gallery posts
CREATE TABLE IF NOT EXISTS public.org_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  caption text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.org_posts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS org_posts_org_created_idx ON public.org_posts(org_id, created_at DESC);

-- RLS: anyone can read org posts
CREATE POLICY "org_posts_public_read" ON public.org_posts
  FOR SELECT USING (true);

-- Active staff/directors can insert
CREATE POLICY "org_posts_staff_insert" ON public.org_posts
  FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_id = org_posts.org_id
        AND user_id = auth.uid()
        AND role IN ('director', 'officer')
        AND status = 'active'
    )
  );

-- Author or any active staff/director can delete
CREATE POLICY "org_posts_staff_delete" ON public.org_posts
  FOR DELETE USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_id = org_posts.org_id
        AND user_id = auth.uid()
        AND role IN ('director', 'officer')
        AND status = 'active'
    )
  );

-- Storage bucket for gallery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('org-posts', 'org-posts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "org_posts_storage_read" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'org-posts');

CREATE POLICY "org_posts_storage_upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'org-posts');

CREATE POLICY "org_posts_storage_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'org-posts');

NOTIFY pgrst, 'reload schema';
