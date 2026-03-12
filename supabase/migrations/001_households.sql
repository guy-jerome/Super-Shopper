-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Household sharing — run this in your Supabase SQL editor
-- Dashboard → SQL Editor → New query → paste + run
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ── Create all tables first (before any cross-table policies) ─

CREATE TABLE IF NOT EXISTS households (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL DEFAULT 'Our Household',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS household_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

CREATE TABLE IF NOT EXISTS household_invites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT UNIQUE NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  created_by   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  used         BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Extend existing tables ────────────────────────────────────

ALTER TABLE shopping_list
  ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS added_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE shopping_notes
  ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id) ON DELETE SET NULL;

-- ── Enable RLS on new tables ──────────────────────────────────

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_invites ENABLE ROW LEVEL SECURITY;

-- ── Helper function (avoids recursive RLS) ───────────────────
-- SECURITY DEFINER bypasses RLS when called from within policies,
-- preventing infinite recursion on household_members self-references.
CREATE OR REPLACE FUNCTION get_my_household_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT household_id FROM household_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ── Policies: households ──────────────────────────────────────

-- NOTE: uses get_my_household_id() to avoid recursive RLS on household_members
CREATE POLICY "members_can_see_household" ON households
  FOR SELECT USING (id = get_my_household_id());

CREATE POLICY "creator_can_insert_household" ON households
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- ── Policies: household_members ───────────────────────────────

CREATE POLICY "members_can_read_household_roster" ON household_members
  FOR SELECT USING (household_id = get_my_household_id());

CREATE POLICY "user_can_insert_self_as_member" ON household_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_can_delete_self_as_member" ON household_members
  FOR DELETE USING (user_id = auth.uid());

-- ── Policies: household_invites ───────────────────────────────

-- Anyone can look up a valid code (needed for joining)
CREATE POLICY "anyone_can_read_valid_invite" ON household_invites
  FOR SELECT USING (used = FALSE AND expires_at > NOW());

CREATE POLICY "members_can_create_invite" ON household_invites
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND household_id = get_my_household_id()
  );

-- Allow marking invites as used
CREATE POLICY "owner_can_mark_invite_used" ON household_invites
  FOR UPDATE USING (TRUE);

-- ── Extra RLS policies for household access on existing tables ─

CREATE POLICY "household_list_access" ON shopping_list
  FOR ALL USING (household_id = get_my_household_id());

CREATE POLICY "household_notes_access" ON shopping_notes
  FOR ALL USING (household_id = get_my_household_id());

-- ── Enable realtime on shopping_list ─────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_list;
