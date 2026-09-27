ALTER TABLE orders ADD COLUMN provider_transaction_id TEXT;
ALTER TABLE orders ADD COLUMN pix_code TEXT;
ALTER TABLE orders ADD COLUMN paid_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_provider_transaction
  ON orders(provider_transaction_id)
  WHERE provider_transaction_id IS NOT NULL;
