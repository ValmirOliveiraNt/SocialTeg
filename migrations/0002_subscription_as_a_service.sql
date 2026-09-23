-- Modelo AvaliaTag: assinatura mensal pré-paga e placas em comodato.
-- Execute uma única vez no D1 antes de publicar o código.
ALTER TABLE subscriptions ADD COLUMN current_period_start TEXT;
ALTER TABLE subscriptions ADD COLUMN current_period_end TEXT;
ALTER TABLE subscriptions ADD COLUMN next_billing_at TEXT;
ALTER TABLE subscriptions ADD COLUMN grace_period_ends_at TEXT;
ALTER TABLE subscriptions ADD COLUMN cancel_at_period_end INTEGER NOT NULL DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN canceled_at TEXT;
ALTER TABLE subscriptions ADD COLUMN ended_at TEXT;
ALTER TABLE subscriptions ADD COLUMN payment_method_brand TEXT;
ALTER TABLE subscriptions ADD COLUMN payment_method_last4 TEXT;
ALTER TABLE subscriptions ADD COLUMN billing_method TEXT;
ALTER TABLE subscriptions ADD COLUMN collection_status TEXT NOT NULL DEFAULT 'not_required';
ALTER TABLE subscriptions ADD COLUMN collection_requested_at TEXT;
ALTER TABLE subscriptions ADD COLUMN returned_at TEXT;
ALTER TABLE subscriptions ADD COLUMN updated_at TEXT;

UPDATE subscriptions SET updated_at = COALESCE(updated_at, datetime('now'));

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_created
  ON subscriptions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_period
  ON subscriptions(status, current_period_end);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  received_at TEXT NOT NULL
);

UPDATE plans SET
  name = 'AvaliaTag Completo',
  description = 'Placa inteligente em comodato e todos os recursos da plataforma',
  price = 29.90,
  billing_interval = 'monthly',
  max_tags = 999,
  max_businesses = 1,
  analytics_enabled = 1,
  advanced_analytics = 1,
  popular = 1,
  features = '["1 placa padrão AvaliaTag incluída", "NFC e QR Code ativos durante a assinatura", "Todos os destinos e modelos", "Telemetria e relatórios completos", "Cancelamento a qualquer momento", "Placas adicionais com preço por quantidade"]',
  status = 'active'
WHERE id = 'plan-pro';

UPDATE plans SET status = 'inactive' WHERE id IN ('plan-starter', 'plan-enterprise');
