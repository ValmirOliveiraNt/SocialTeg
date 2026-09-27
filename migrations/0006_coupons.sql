CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE COLLATE NOCASE,
  description TEXT NOT NULL DEFAULT '',
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value REAL NOT NULL CHECK (discount_value > 0),
  minimum_order_amount REAL NOT NULL DEFAULT 0,
  maximum_discount_amount REAL,
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT,
  expires_at TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id TEXT PRIMARY KEY,
  coupon_id TEXT NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  discount_amount REAL NOT NULL,
  redeemed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (coupon_id) REFERENCES coupons(id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

ALTER TABLE orders ADD COLUMN coupon_id TEXT REFERENCES coupons(id);
ALTER TABLE orders ADD COLUMN coupon_code TEXT;

CREATE INDEX IF NOT EXISTS idx_coupons_code_status ON coupons(code, status);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON coupon_redemptions(coupon_id, redeemed_at DESC);
