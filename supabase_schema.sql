-- ========================================================
-- SCHEMA OFICIAL SUPABASE - GOOGLE AVALIADOR (AVALIATAG)
-- Compatível com PostgreSQL + Supabase Auth + RLS + Vercel
-- ========================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE PERFIS DE USUÁRIO (Vinculada ao auth.users do Supabase)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  avatar TEXT,
  role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
  plan_id VARCHAR(50) DEFAULT 'plan-starter',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE ESTABELECIMENTOS / EMPRESAS (Com suporte a telemetria Google)
CREATE TABLE IF NOT EXISTS businesses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  website TEXT,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  country VARCHAR(50) DEFAULT 'Brasil',
  -- Campos de Telemetria e Integração com Google Places API
  google_place_id VARCHAR(255),
  google_rating NUMERIC(2,1) DEFAULT 5.0,
  google_reviews_count INTEGER DEFAULT 0,
  last_google_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE PRODUTOS / TOTENS / PLACAS NFC
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image TEXT,
  price NUMERIC(10,2) NOT NULL,
  stock INTEGER DEFAULT 100,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE TAGS NFC FÍSICAS
CREATE TABLE IF NOT EXISTS nfc_tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  public_id VARCHAR(50) UNIQUE NOT NULL, -- Código curto da URL (ex: /t/tag-mesa-01)
  serial_number VARCHAR(100) UNIQUE NOT NULL,
  uid VARCHAR(100),
  product_id VARCHAR(50) REFERENCES products(id) ON DELETE SET NULL,
  status VARCHAR(30) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'pending_activation', 'active', 'inactive', 'blocked', 'lost')),
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255), -- Ex: Mesa 04, Balcão 1
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE DESTINOS DAS TAGS (Redirecionamento dinâmico)
CREATE TABLE IF NOT EXISTS tag_destinations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tag_id UUID REFERENCES nfc_tags(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('google_review', 'instagram', 'whatsapp', 'website', 'custom_url')),
  title VARCHAR(255) NOT NULL,
  target_url TEXT NOT NULL,
  configuration JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA DE TELEMETRIA E ESCANEAMENTOS / TAPS NFC
CREATE TABLE IF NOT EXISTS tag_scans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tag_id UUID REFERENCES nfc_tags(id) ON DELETE CASCADE NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  destination_type VARCHAR(50) NOT NULL,
  device_type VARCHAR(50) DEFAULT 'Mobile',
  operating_system VARCHAR(50) DEFAULT 'Android',
  browser VARCHAR(50) DEFAULT 'Chrome',
  country VARCHAR(100) DEFAULT 'Brasil',
  region VARCHAR(100),
  referrer TEXT
);

-- 7. TABELA DE AVALIAÇÕES REAIS DO GOOGLE (Sincronizadas via Google Places)
CREATE TABLE IF NOT EXISTS google_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  google_review_id VARCHAR(255),
  author_name VARCHAR(255) NOT NULL,
  author_photo_url TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABELA DE PEDIDOS
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  subtotal NUMERIC(10,2) NOT NULL,
  discount NUMERIC(10,2) DEFAULT 0.00,
  shipping NUMERIC(10,2) DEFAULT 0.00,
  total NUMERIC(10,2) NOT NULL,
  payment_status VARCHAR(30) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'approved', 'failed', 'refunded')),
  payment_method VARCHAR(30) DEFAULT 'pix' CHECK (payment_method IN ('pix', 'credit_card', 'boleto')),
  shipping_address JSONB NOT NULL,
  tracking_code VARCHAR(100),
  assigned_serials JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABELA DE ITENS DO PEDIDO
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id VARCHAR(50) REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL
);

-- 10. TABELA DE PLANOS DE ASSINATURA
CREATE TABLE IF NOT EXISTS plans (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  billing_interval VARCHAR(20) DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'yearly', 'lifetime')),
  max_tags INTEGER DEFAULT 5,
  max_businesses INTEGER DEFAULT 1,
  analytics_enabled BOOLEAN DEFAULT TRUE,
  advanced_analytics BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active',
  popular BOOLEAN DEFAULT FALSE,
  features JSONB DEFAULT '[]'::jsonb
);

-- 11. TABELA DE ASSINATURAS REAIS
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id VARCHAR(50) REFERENCES plans(id) NOT NULL,
  provider VARCHAR(50) DEFAULT 'asaas',
  provider_subscription_id VARCHAR(255),
  status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. TABELA DE LOGS DE AUDITORIA
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) - SEGURANÇA MULTI-TENANT
-- ========================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfc_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Políticas de Profiles
CREATE POLICY "Usuários podem ver o próprio perfil" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuários podem atualizar o próprio perfil" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas de Empresas
CREATE POLICY "Clientes veem suas empresas" ON businesses FOR ALL USING (auth.uid() = owner_id);

-- Políticas de Tags
CREATE POLICY "Clientes veem suas tags" ON nfc_tags FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Público pode ler tag ativa para redirecionamento" ON nfc_tags FOR SELECT USING (status = 'active');

-- Políticas de Scans (Clientes veem scans das suas tags, público pode registrar scan)
CREATE POLICY "Público pode registrar scan" ON tag_scans FOR INSERT WITH CHECK (true);
CREATE POLICY "Clientes veem scans de suas tags" ON tag_scans FOR SELECT USING (
  EXISTS (SELECT 1 FROM nfc_tags WHERE nfc_tags.id = tag_scans.tag_id AND nfc_tags.owner_id = auth.uid())
);

-- Políticas de Destinos
CREATE POLICY "Clientes gerenciam destinos de suas tags" ON tag_destinations FOR ALL USING (
  EXISTS (SELECT 1 FROM nfc_tags WHERE nfc_tags.id = tag_destinations.tag_id AND nfc_tags.owner_id = auth.uid())
);
CREATE POLICY "Público pode ler destinos ativos" ON tag_destinations FOR SELECT USING (is_active = true);

-- Produtos e Planos são públicos para leitura
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Produtos visíveis publicamente" ON products FOR SELECT USING (true);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Planos visíveis publicamente" ON plans FOR SELECT USING (true);

-- Gatilho para criar Perfil automaticamente ao cadastrar no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS 
BEGIN
  INSERT INTO public.profiles (id, name, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    'active'
  );
  RETURN NEW;
END;
 LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inserção de Planos Padrão
INSERT INTO plans (id, name, description, price, billing_interval, max_tags, max_businesses, analytics_enabled, advanced_analytics, status, popular, features)
VALUES 
('plan-starter', 'Iniciante', 'Perfeito para pequenos negócios e autônomos', 49.90, 'monthly', 3, 1, true, false, 'active', false, '["Até 3 Tags NFC", "1 Estabelecimento", "Métricas de cliques diários", "Suporte via WhatsApp"]'::jsonb),
('plan-pro', 'Profissional', 'Ideal para restaurantes, clínicas e varejo', 99.90, 'monthly', 10, 3, true, true, 'active', true, '["Até 10 Tags NFC", "Até 3 Estabelecimentos", "Integração Google Places API", "Telemetria de Avaliações Reais", "Relatórios Semanais"]'::jsonb),
('plan-enterprise', 'Empresarial', 'Redes, franquias e alta escala', 199.90, 'monthly', 50, 10, true, true, 'active', false, '["Até 50 Tags NFC", "Até 10 Estabelecimentos", "Multi-usuários", "API e Webhooks", "Gerente de contas dedicado"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Inserção de Produtos Padrão
INSERT INTO products (id, name, description, image, price, stock, status, features)
VALUES
('prod-stand-acrylic', 'Totem Display Acrílico Premium', 'Display elegante em acrílico cristal com chip NFC NTAG213 e QR Code UV permanente para balcão ou mesas.', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80', 69.90, 85, 'active', '["Acrílico Cristal 3mm", "Chip NFC NTAG213 integrado", "QR Code de alta resolução", "Resistente à água e limpeza"]'::jsonb),
('prod-stand-wood', 'Totem Madeira Nobre Rústica', 'Design sofisticado em madeira maciça com gravação a laser, ideal para cafés, bistrôs e restaurantes sofisticados.', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80', 89.90, 42, 'active', '["Madeira Maciça Tratada", "Acabamento fosco acetinado", "Chip NFC de longo alcance", "Gravação a laser personalizada"]'::jsonb),
('prod-sticker-nfc', 'Adesivo NFC Resinada Ultra-Resistente', 'Adesivo resinado 3D com camada metálica anti-interferência para colar em cardápios, vidros, mesas ou paredes.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80', 29.90, 300, 'active', '["Resina epóxi 3D flexível", "Proteção Anti-Metal", "Adesivo 3M de alta fixação", "À prova de chuva e sol"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

