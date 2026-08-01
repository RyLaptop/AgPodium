-- Paid events + RSVP fields on meetings
ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ticket_url text,
  ADD COLUMN IF NOT EXISTS rsvp_enabled boolean NOT NULL DEFAULT false;

-- Paid events on bulletin posts
ALTER TABLE public.bulletin_posts
  ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ticket_url text;

-- RSVP table
CREATE TABLE IF NOT EXISTS public.meeting_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);
ALTER TABLE public.meeting_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rsvp_public_read"   ON public.meeting_rsvps FOR SELECT USING (true);
CREATE POLICY "rsvp_auth_insert"   ON public.meeting_rsvps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rsvp_auth_delete"   ON public.meeting_rsvps FOR DELETE USING (auth.uid() = user_id);

-- Surveys
CREATE TABLE IF NOT EXISTS public.org_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.users(id),
  title text NOT NULL,
  description text,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.org_surveys ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.survey_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES public.org_surveys(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('text', 'multiple_choice', 'checkbox')),
  options jsonb,
  sort_order int NOT NULL DEFAULT 0
);
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES public.org_surveys(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id),
  answers jsonb NOT NULL DEFAULT '{}',
  submitted_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "survey_read" ON public.org_surveys FOR SELECT USING (
  is_public = true OR EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = org_surveys.org_id AND user_id = auth.uid() AND status = 'active'
  )
);
CREATE POLICY "survey_staff_insert" ON public.org_surveys FOR INSERT WITH CHECK (
  auth.uid() = created_by AND EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = org_surveys.org_id AND user_id = auth.uid()
    AND role IN ('director', 'officer') AND status = 'active'
  )
);
CREATE POLICY "survey_staff_delete" ON public.org_surveys FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = org_surveys.org_id AND user_id = auth.uid()
    AND role IN ('director', 'officer') AND status = 'active'
  )
);
CREATE POLICY "survey_questions_read"        ON public.survey_questions FOR SELECT USING (true);
CREATE POLICY "survey_questions_staff_write" ON public.survey_questions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.org_surveys s
    JOIN public.org_members m ON m.org_id = s.org_id
    WHERE s.id = survey_questions.survey_id
    AND m.user_id = auth.uid() AND m.role IN ('director', 'officer') AND m.status = 'active'
  )
);
CREATE POLICY "survey_responses_insert"     ON public.survey_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "survey_responses_staff_read" ON public.survey_responses FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.org_surveys s
    JOIN public.org_members m ON m.org_id = s.org_id
    WHERE s.id = survey_responses.survey_id
    AND m.user_id = auth.uid() AND m.role IN ('director', 'officer') AND m.status = 'active'
  )
);

-- Onboarding checklists
CREATE TABLE IF NOT EXISTS public.onboarding_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL UNIQUE REFERENCES public.orgs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.onboarding_checklists ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.onboarding_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.onboarding_checklists(id) ON DELETE CASCADE,
  label text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);
ALTER TABLE public.onboarding_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.member_checklist_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.onboarding_items(id) ON DELETE CASCADE,
  checked_by uuid NOT NULL REFERENCES public.users(id),
  checked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);
ALTER TABLE public.member_checklist_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_member_read" ON public.onboarding_checklists FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.org_members WHERE org_id = onboarding_checklists.org_id AND user_id = auth.uid() AND status = 'active')
);
CREATE POLICY "checklist_staff_all" ON public.onboarding_checklists FOR ALL USING (
  EXISTS (SELECT 1 FROM public.org_members WHERE org_id = onboarding_checklists.org_id AND user_id = auth.uid() AND role IN ('director', 'officer') AND status = 'active')
);
CREATE POLICY "items_read"      ON public.onboarding_items FOR SELECT USING (true);
CREATE POLICY "items_staff_all" ON public.onboarding_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.onboarding_checklists c
    JOIN public.org_members m ON m.org_id = c.org_id
    WHERE c.id = onboarding_items.checklist_id
    AND m.user_id = auth.uid() AND m.role IN ('director', 'officer') AND m.status = 'active'
  )
);
CREATE POLICY "completions_read" ON public.member_checklist_completions FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = member_checklist_completions.org_id AND user_id = auth.uid()
    AND role IN ('director', 'officer') AND status = 'active'
  )
);
CREATE POLICY "completions_staff_all" ON public.member_checklist_completions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.org_members
    WHERE org_id = member_checklist_completions.org_id AND user_id = auth.uid()
    AND role IN ('director', 'officer') AND status = 'active'
  )
);

-- Custom org awards
CREATE TABLE IF NOT EXISTS public.org_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.org_awards ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.member_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  award_id uuid NOT NULL REFERENCES public.org_awards(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  awarded_by uuid NOT NULL REFERENCES public.users(id),
  note text,
  awarded_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.member_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "awards_public_read" ON public.org_awards FOR SELECT USING (true);
CREATE POLICY "awards_staff_all"   ON public.org_awards FOR ALL USING (
  EXISTS (SELECT 1 FROM public.org_members WHERE org_id = org_awards.org_id AND user_id = auth.uid() AND role IN ('director', 'officer') AND status = 'active')
);
CREATE POLICY "member_awards_public_read" ON public.member_awards FOR SELECT USING (true);
CREATE POLICY "member_awards_staff_all"   ON public.member_awards FOR ALL USING (
  EXISTS (SELECT 1 FROM public.org_members WHERE org_id = member_awards.org_id AND user_id = auth.uid() AND role IN ('director', 'officer') AND status = 'active')
);

-- Anonymous incident reports (no user_id column — truly anonymous)
CREATE TABLE IF NOT EXISTS public.incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "incidents_anon_insert" ON public.incident_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "incidents_staff_read"  ON public.incident_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.org_members WHERE org_id = incident_reports.org_id AND user_id = auth.uid() AND role IN ('director', 'officer') AND status = 'active')
);

NOTIFY pgrst, 'reload schema';
