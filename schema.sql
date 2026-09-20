CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT,
  avatar TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  status TEXT NOT NULL DEFAULT 'active',
  plan_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
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
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  price REAL NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  features TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  billing_interval TEXT NOT NULL DEFAULT 'monthly',
  max_tags INTEGER NOT NULL DEFAULT 1,
  max_businesses INTEGER NOT NULL DEFAULT 1,
  analytics_enabled INTEGER NOT NULL DEFAULT 1,
  advanced_analytics INTEGER NOT NULL DEFAULT 0,
  popular INTEGER NOT NULL DEFAULT 0,
  features TEXT,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS nfc_tags (
  id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE NOT NULL,
  serial_number TEXT UNIQUE NOT NULL,
  uid TEXT,
  product_id TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  owner_id TEXT,
  business_id TEXT,
  name TEXT NOT NULL,
  location TEXT,
  activated_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tag_destinations (
  id TEXT PRIMARY KEY,
  tag_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'google_review',
  title TEXT NOT NULL,
  target_url TEXT NOT NULL,
  configuration TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tag_id) REFERENCES nfc_tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tag_scans (
  id TEXT PRIMARY KEY,
  tag_id TEXT NOT NULL,
  scanned_at TEXT NOT NULL DEFAULT (datetime('now')),
  destination_type TEXT NOT NULL,
  device_type TEXT,
  operating_system TEXT,
  browser TEXT,
  country TEXT,
  region TEXT,
  referrer TEXT,
  ip_hash TEXT,
  FOREIGN KEY (tag_id) REFERENCES nfc_tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  subtotal REAL NOT NULL,
  discount REAL NOT NULL DEFAULT 0,
  shipping REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL DEFAULT 'pix',
  shipping_address TEXT NOT NULL,
  tracking_code TEXT,
  assigned_serials TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  total REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tags_public_id ON nfc_tags(public_id);
CREATE INDEX IF NOT EXISTS idx_tags_serial ON nfc_tags(serial_number);
CREATE INDEX IF NOT EXISTS idx_tags_owner ON nfc_tags(owner_id);
CREATE INDEX IF NOT EXISTS idx_scans_tag_id ON tag_scans(tag_id);
CREATE INDEX IF NOT EXISTS idx_scans_date ON tag_scans(scanned_at);
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_destinations_tag ON tag_destinations(tag_id);

INSERT OR IGNORE INTO plans (id, name, description, price, billing_interval, max_tags, max_businesses, analytics_enabled, advanced_analytics, popular, features, status)
VALUES 
('plan-starter', 'Plano Grátis Inicial', 'Ideal para começar a coletar avaliações no balcão', 0, 'monthly', 1, 1, 1, 0, 0, '["1 Tag NFC ativa", "Redirecionamento dinâmico", "Google Avaliações", "Métricas básicas"]', 'active'),
('plan-pro', 'Plano Pro Negócios', 'Para comércios que desejam maximizar conversão com página personalizada', 29.9, 'monthly', 5, 3, 1, 1, 1, '["Até 5 Tags NFC", "Até 3 Estabelecimentos", "Página personalizada com logo", "Google, WhatsApp, Instagram", "Métricas avançadas", "Display imprimível"]', 'active'),
('plan-enterprise', 'Plano Enterprise Redes & Franquias', 'Gestão corporativa centralizada para redes e franquias', 69.9, 'monthly', 999, 99, 1, 1, 0, '["Tags NFC ilimitadas", "Múltiplas filiais", "Relatórios unificados", "Suporte prioritário"]', 'active');

INSERT OR IGNORE INTO products (id, name, description, image, price, stock, status, features)
VALUES
('prod-acrylic-stand', 'Display de Balcão Acrílico Cristal Google Avaliações', 'Display inclinado em acrílico cristal 3mm com chip NFC NTAG213 e impressão UV com QR Code permanente.', 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=600&h=450&fit=crop', 79.9, 100, 'active', '["Chip NFC NTAG213", "Acrílico cristal 3mm", "QR Code permanente", "Compatível iOS e Android", "Redirecionamento dinâmico"]'),
('prod-wood-stand', 'Stand Premium Madeira Nobre & Acrílico Fosco', 'Feito artesanalmente para cafeterias, clínicas e escritórios que prezam pelo design refinado.', 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600&h=450&fit=crop', 119.9, 50, 'active', '["Base em madeira maciça jequitibá", "Acrílico fosco jateado", "NFC integrado invisível", "Design de alto padrão"]'),
('prod-3pack-stickers', 'Pack 3x Tags Adesivas NFC 3M Ultra Resistentes', 'Adesivos circulares epóxi impermeáveis com adesivo 3M para fixação em mesas e balcões.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=450&fit=crop', 99.9, 200, 'active', '["3 Unidades Epóxi blindadas", "Adesivo automotivo 3M", "Diâmetro de 35mm", "Métricas individuais por tag"]');

INSERT OR IGNORE INTO users (id, name, email, phone, role, status, plan_id)
VALUES ('u-admin', 'Administrador', 'admin@avaliatag.com.br', '(11) 99999-0000', 'admin', 'active', 'plan-enterprise');

