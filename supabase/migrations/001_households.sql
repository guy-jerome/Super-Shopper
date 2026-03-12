-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Household sharing — run this in your Supabase SQL editor
-- Dashboard → SQL Editor → New query → paste + run
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ── Households ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS households (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL DEFAULT 'Our Household',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE households ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_can_see_household" ON households
  FOR SELECT USING (
    id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );

CREATE POLICY "creator_can_insert_household" ON households
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- ── Household members ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS household_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_can_read_household_roster" ON household_members
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM household_members hm WHERE hm.user_id = auth.uid()
    )
  );

CREATE POLICY "user_can_insert_self_as_member" ON household_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_can_delete_self_as_member" ON household_members
  FOR DELETE USING (user_id = auth.uid());

-- ── Invite codes ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS household_invites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT UNIQUE NOT NULL,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE NOT NULL,
  created_by   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  used         BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE household_invites ENABLE ROW LEVEL SECURITY;

-- Anyone can look up a valid code (needed for joining)
CREATE POLICY "anyone_can_read_valid_invite" ON household_invites
  FOR SELECT USING (used = FALSE AND expires_at > NOW());

CREATE POLICY "members_can_create_invite" ON household_invites
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );

-- Allow the system to mark invites as used
CREATE POLICY "owner_can_mark_invite_used" ON household_invites
  FOR UPDATE USING (TRUE);

-- ── Extend shopping_list ─────────────────────────────────────
ALTER TABLE shopping_list
  ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS added_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── Extend shopping_notes ────────────────────────────────────
ALTER TABLE shopping_notes
  ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id) ON DELETE SET NULL;

-- ── Extra RLS policies for household access ──────────────────
-- These stack with the existing user_id policies (Supabase OR's them)
CREATE POLICY "household_list_access" ON shopping_list
  FOR ALL USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "household_notes_access" ON shopping_notes
  FOR ALL USING (
    household_id IN (
      SELECT household_id FROM household_members WHERE user_id = auth.uid()
    )
  );

-- ── Enable realtime on shopping_list ─────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_list;
