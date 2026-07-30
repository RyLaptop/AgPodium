-- ============================================================
-- 00015 — org_members status column (pending / active join flow)
-- ============================================================

-- Add status column if not already present (may have been applied manually).
ALTER TABLE public.org_members
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
  CHECK (status IN ('pending', 'active'));

-- New members added by directors default to 'active'; self-joins will
-- explicitly pass status = 'pending' from the application layer.

-- Update the self-join policy so users can set status = 'pending' on insert.
-- Drop and recreate because ALTER POLICY ... WITH CHECK isn't supported in older PG.
DROP POLICY IF EXISTS "org_members_self_join_as_member" ON public.org_members;
CREATE POLICY "org_members_self_join_as_member" ON public.org_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'member'
    AND status = 'pending'
  );

NOTIFY pgrst, 'reload schema';
