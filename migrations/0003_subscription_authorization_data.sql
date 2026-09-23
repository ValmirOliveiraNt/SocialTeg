-- Preserve the one-time Pix Automático authorization returned during enrollment.
-- SyncPay may omit the QR Code from later subscription lookups.
ALTER TABLE subscriptions ADD COLUMN provider_authorization_data TEXT;
