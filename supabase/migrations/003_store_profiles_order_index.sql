-- Add order_index to store_profiles for user-reorderable store list
ALTER TABLE store_profiles ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0;

-- Initialize order_index from current created_at ordering per user
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) - 1 AS rn
  FROM store_profiles
)
UPDATE store_profiles sp
SET order_index = ranked.rn
FROM ranked
WHERE sp.id = ranked.id;
