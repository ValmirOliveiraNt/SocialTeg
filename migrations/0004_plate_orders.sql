CREATE TABLE IF NOT EXISTS plate_orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  business_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  has_custom_logo INTEGER NOT NULL DEFAULT 0,
  ownership TEXT NOT NULL,
  requires_return INTEGER NOT NULL DEFAULT 0,
  digital_access TEXT NOT NULL,
  fixed_destination_url TEXT,
  unit_price REAL NOT NULL,
  customization_total REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_payment',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  provider_transaction_id TEXT,
  pix_code TEXT,
  tracking_code TEXT,
  assigned_serials TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (business_id) REFERENCES businesses(id)
);
CREATE INDEX IF NOT EXISTS idx_plate_orders_user ON plate_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plate_orders_transaction ON plate_orders(provider_transaction_id);
