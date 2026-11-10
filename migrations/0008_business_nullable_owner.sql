-- Tornar owner_id opcional (nullable) para permitir negocios pre-cadastrados sem proprietario
PRAGMA foreign_keys=OFF;

CREATE TABLE IF NOT EXISTS businesses_new (
  id TEXT PRIMARY KEY,
  owner_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Brasil',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  menu_url TEXT,
  google_reviews_url TEXT,
  instagram_url TEXT,
  default_destination_type TEXT NOT NULL DEFAULT 'google_review',
  default_target_url TEXT,
  default_destination_configuration TEXT NOT NULL DEFAULT '{}'
);

INSERT INTO businesses_new (
  id, owner_id, name, description, logo_url, cover_url, phone, email, website,
  address, city, state, country, created_at, updated_at, menu_url,
  google_reviews_url, instagram_url, default_destination_type,
  default_target_url, default_destination_configuration
)
SELECT 
  id, owner_id, name, description, logo_url, cover_url, phone, email, website,
  address, city, state, country, created_at, updated_at, menu_url,
  google_reviews_url, instagram_url, default_destination_type,
  default_target_url, default_destination_configuration
FROM businesses;

DROP TABLE businesses;

ALTER TABLE businesses_new RENAME TO businesses;

CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);

PRAGMA foreign_keys=ON;
