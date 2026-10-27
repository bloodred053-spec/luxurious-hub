PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sellers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  phone TEXT NOT NULL,
  gstin TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','suspended')),
  status_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS seller_sessions (
  token_hash TEXT PRIMARY KEY,
  csrf_token TEXT NOT NULL,
  seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

ALTER TABLE products ADD COLUMN seller_id INTEGER REFERENCES sellers(id);
ALTER TABLE products ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE products ADD COLUMN approval_note TEXT NOT NULL DEFAULT '';

ALTER TABLE order_items ADD COLUMN seller_id INTEGER REFERENCES sellers(id);
ALTER TABLE order_items ADD COLUMN seller_status TEXT NOT NULL DEFAULT 'New';
ALTER TABLE order_items ADD COLUMN seller_tracking_number TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS product_image_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_type TEXT NOT NULL CHECK(size_type IN ('large','medium','listing','small')),
  image_type TEXT NOT NULL DEFAULT 'product',
  object_key TEXT,
  external_url TEXT,
  title TEXT NOT NULL DEFAULT '',
  option_code TEXT NOT NULL DEFAULT '0',
  sort_order INTEGER NOT NULL DEFAULT 0,
  show_in_slider INTEGER NOT NULL DEFAULT 0,
  image_style TEXT NOT NULL DEFAULT 'none',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(product_id, size_type)
);

CREATE INDEX IF NOT EXISTS idx_sellers_status ON sellers(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seller_sessions_seller ON seller_sessions(seller_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_products_seller_status ON products(seller_id, approval_status, active);
CREATE INDEX IF NOT EXISTS idx_order_items_seller ON order_items(seller_id, seller_status);
CREATE INDEX IF NOT EXISTS idx_product_image_variants_product ON product_image_variants(product_id, sort_order, id);
