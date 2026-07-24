-- Phase 8: org approval, logos, staff titles, affiliations, cohosts, meeting cancel, DMs

-- Org approval flow + logo
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved';
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Staff titles (President, Social Chair, etc.)
ALTER TABLE org_members ADD COLUMN IF NOT EXISTS title text;

-- Meeting cancellation
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Org affiliations
CREATE TABLE IF NOT EXISTS org_affiliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  affiliate_org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, affiliate_org_id),
  CHECK (org_id != affiliate_org_id)
);

-- Meeting co-hosts (one org invites another)
CREATE TABLE IF NOT EXISTS meeting_cohosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(meeting_id, org_id)
);

-- Direct messages
CREATE TABLE IF NOT EXISTS dm_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL REFERENCES users(id),
  user_b uuid NOT NULL REFERENCES users(id),
  initiated_by uuid NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dm_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES dm_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id),
  body text NOT NULL CHECK (length(body) > 0 AND length(body) <= 2000),
  created_at timestamptz DEFAULT now()
);
