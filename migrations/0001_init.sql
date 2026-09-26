PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  mrp INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  tag TEXT DEFAULT 'New',
  rating REAL DEFAULT 0,
  description TEXT DEFAULT '',
  specifications TEXT DEFAULT '{}',
  image_key TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL UNIQUE,
  alt_text TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('percent','fixed')),
  value INTEGER NOT NULL,
  min_cart INTEGER NOT NULL DEFAULT 0,
  max_discount INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  expires_at TEXT,
  usage_limit INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT UNIQUE,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT NOT NULL,
  area TEXT,
  landmark TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  shipping INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  coupon_code TEXT,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cod','razorpay')),
  payment_status TEXT NOT NULL DEFAULT 'pending',
  status TEXT NOT NULL DEFAULT 'Confirmed',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  tracking_number TEXT,
  inventory_released INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  name_snapshot TEXT NOT NULL,
  price_snapshot INTEGER NOT NULL,
  qty INTEGER NOT NULL,
  image_key TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  csrf_token TEXT NOT NULL,
  username TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category, active);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

INSERT OR IGNORE INTO settings(key,value) VALUES
 ('store_name','LUXURIOUS HUB'),
 ('tagline','THE EVERYDAY EDIT'),
 ('whatsapp',''),
 ('phone',''),
 ('email',''),
 ('address',''),
 ('free_shipping','499'),
 ('shipping_fee','49'),
 ('cod_enabled','1'),
 ('razorpay_enabled','0'),
 ('shipping_policy','Free shipping above ₹499. Orders below ₹499 use the shipping charge shown at checkout.'),
 ('returns_policy','Keep your order ID ready when contacting support for returns or refunds.'),
 ('about_text','Luxurious Hub brings together watches, perfumes, attars and mobile accessories in one simple everyday edit.');

INSERT OR IGNORE INTO coupons(code,type,value,min_cart,max_discount,enabled) VALUES
 ('LIVE15','percent',15,499,500,1),
 ('WELCOME10','fixed',100,799,100,1);

INSERT OR IGNORE INTO products(slug,name,category,price,mrp,stock,tag,rating,description,specifications) VALUES
 ('classic-noir','Classic Noir','Watches',799,1199,24,'Featured',4.6,'A clean everyday watch with a refined dial and steel bracelet.','{"movement":"Quartz","strap":"Stainless steel","case":"Metal","waterResistance":"Confirm before purchase"}'),
 ('silver-meridian','Silver Meridian','Watches',1099,1549,18,'New',4.5,'Minimal silver styling for everyday wear.','{"movement":"Quartz","strap":"Steel bracelet","dial":"Silver"}'),
 ('the-weekender','The Weekender','Watches',1399,1899,17,'Featured',4.7,'A relaxed chronograph-inspired everyday watch.','{"movement":"Quartz","strap":"Leather","style":"Chronograph"}'),
 ('rosegold-muse','Rosegold Muse','Watches',1699,2249,12,'Bestseller',4.7,'Soft rose-gold styling for work and evenings.','{"movement":"Quartz","finish":"Rose gold","style":"Analog"}'),
 ('midnight-chronograph','Midnight Chronograph','Watches',1999,2599,10,'New',4.8,'Bold dark dial with a chronograph look.','{"movement":"Quartz","glass":"Mineral"}'),
 ('urban-slate','Urban Slate','Watches',899,1299,22,'New',4.4,'Sporty everyday styling with a flexible strap.','{"movement":"Quartz","strap":"Silicone"}'),
 ('heritage-gold','Heritage Gold','Watches',2299,2999,8,'Premium',4.8,'Premium mesh styling with a warm gold finish.','{"movement":"Quartz","strap":"Mesh bracelet"}'),
 ('edge-runner','Edge Runner','Watches',1299,1799,15,'Trending',4.5,'Sport-led everyday watch with a clean profile.','{"movement":"Quartz","strap":"Silicone"}'),
 ('luna-pearl','Luna Pearl','Watches',1499,2099,11,'Bestseller',4.7,'Elegant pearl-inspired dial styling.','{"movement":"Analog","dial":"Pearl-inspired"}'),
 ('classic-steel','Classic Steel','Watches',1199,1699,16,'Featured',4.5,'Timeless steel bracelet styling.','{"movement":"Quartz","strap":"Stainless steel"}'),
 ('amber-evening','Amber Evening','Perfumes',699,999,30,'Bestseller',4.7,'Warm amber, vanilla and woods inspired profile.','{"size":"50 ml","notes":"Amber · Vanilla · Woods","type":"Eau de Parfum"}'),
 ('citrus-daybreak','Citrus Daybreak','Perfumes',699,1029,28,'New',4.5,'Fresh citrus profile for daytime wear.','{"size":"50 ml","notes":"Bergamot · Citrus · Musk"}'),
 ('velvet-rose','Velvet Rose','Perfumes',899,1259,21,'New',4.7,'Soft floral profile with rose and musk.','{"size":"50 ml","notes":"Rose · Peony · Musk"}'),
 ('ocean-drift','Ocean Drift','Perfumes',1099,1489,14,'Featured',4.5,'Fresh aquatic fragrance profile.','{"size":"100 ml","notes":"Marine · Citrus · Cedar"}'),
 ('white-bloom','White Bloom','Perfumes',799,1099,19,'Bestseller',4.6,'Light floral fragrance for everyday use.','{"size":"50 ml","notes":"Jasmine · White flowers · Musk"}'),
 ('dark-cedar','Dark Cedar','Perfumes',999,1399,13,'Premium',4.6,'Woody fragrance profile with cedar and amber.','{"size":"50 ml","notes":"Cedar · Pepper · Amber"}'),
 ('sandal-mist','Sandal Mist','Perfumes',849,1199,22,'New',4.5,'Soft sandalwood inspired fragrance.','{"size":"50 ml","notes":"Sandalwood · Vanilla · Musk"}'),
 ('midnight-oud','Midnight Oud','Perfumes',1299,1799,9,'Premium',4.8,'Deep oud-inspired evening fragrance.','{"size":"100 ml","notes":"Oud · Saffron · Amber"}'),
 ('fresh-linen','Fresh Linen','Perfumes',649,899,26,'Everyday',4.4,'Clean airy fragrance profile.','{"size":"50 ml","notes":"Linen · Citrus · Soft woods"}'),
 ('golden-haze','Golden Haze','Perfumes',1199,1599,12,'Trending',4.7,'Warm amber profile for evenings.','{"size":"100 ml","notes":"Amber · Rose · Tonka"}'),
 ('royal-oud','Royal Oud','Attar',199,299,40,'Bestseller',4.8,'Oud-inspired concentrated attar.','{"size":"6 ml","notes":"Oud · Amber · Woods"}'),
 ('white-musk','White Musk','Attar',249,349,36,'New',4.6,'Soft clean musk profile.','{"size":"6 ml","notes":"White musk · Powder · Rose"}'),
 ('rose-saffron','Rose Saffron','Attar',299,399,31,'Featured',4.7,'Rich floral attar with rose and saffron notes.','{"size":"6 ml","notes":"Rose · Saffron · Amber"}'),
 ('sandal-noir','Sandal Noir','Attar',279,399,25,'Premium',4.5,'Sandalwood-led concentrated fragrance.','{"size":"6 ml","notes":"Sandalwood · Musk"}'),
 ('musk-amber','Musk Amber','Attar',229,329,33,'Bestseller',4.7,'Smooth amber musk blend.','{"size":"6 ml","notes":"Musk · Amber · Vanilla"}'),
 ('oud-al-arab','Oud Al Arab','Attar',399,549,18,'Premium',4.8,'Arabic-inspired oud blend.','{"size":"12 ml","notes":"Oud · Spice · Woods"}'),
 ('jasmine-mist','Jasmine Mist','Attar',219,299,29,'New',4.4,'Light jasmine floral attar.','{"size":"6 ml","notes":"Jasmine · Floral"}'),
 ('rose-musk','Rose Musk','Attar',259,359,27,'Featured',4.6,'Soft rose and musk blend.','{"size":"6 ml","notes":"Rose · Musk"}'),
 ('classic-sandal','Classic Sandal','Attar',189,279,42,'Everyday',4.4,'Simple sandalwood everyday attar.','{"size":"6 ml","notes":"Sandalwood · Soft woods"}'),
 ('oudh-royal-12ml','Oudh Royal 12ml','Attar',499,699,15,'Premium',4.8,'Concentrated oud blend in a larger bottle.','{"size":"12 ml","notes":"Oud · Leather · Amber"}'),
 ('wireless-earbuds','Wireless Earbuds','Mobile Accessories',999,1299,20,'Featured',4.5,'Compact wireless earbuds for daily use.','{"connectivity":"Bluetooth","compatibility":"Android / iPhone"}'),
 ('30w-fast-charger','30W Fast Charger','Mobile Accessories',799,999,24,'Featured',4.7,'Fast USB-C charger for compatible devices.','{"output":"30W","port":"USB-C"}'),
 ('usb-c-braided-cable','USB-C Braided Cable','Mobile Accessories',299,399,50,'New',4.6,'Durable braided charging and data cable.','{"length":"1.2 m","connector":"USB-C"}'),
 ('everyday-power-bank','Everyday Power Bank','Mobile Accessories',1499,1899,12,'Bestseller',4.6,'Portable power for everyday travel.','{"capacity":"10000 mAh","ports":"USB-C + USB-A"}'),
 ('20w-usb-c-charger','20W USB-C Charger','Mobile Accessories',599,799,26,'Bestseller',4.5,'Compact PD charger for phones and accessories.','{"output":"20W PD","port":"USB-C"}'),
 ('lightning-cable','Lightning Cable','Mobile Accessories',349,449,44,'Everyday',4.4,'Everyday charging and data cable for compatible devices.','{"length":"1 m","connector":"Lightning"}'),
 ('magnetic-car-holder','Magnetic Car Holder','Mobile Accessories',449,699,18,'New',4.4,'Dashboard magnetic phone holder.','{"mount":"Dashboard","fit":"Universal"}'),
 ('tws-mini-pro','TWS Mini Pro','Mobile Accessories',1299,1699,16,'Trending',4.7,'Compact TWS earbuds with ENC.','{"bluetooth":"5.3","feature":"ENC"}'),
 ('10000mah-slim-bank','10000mAh Slim Bank','Mobile Accessories',1199,1499,14,'Featured',4.5,'Slim everyday power bank.','{"capacity":"10000 mAh","ports":"Dual USB"}'),
 ('3-in-1-charging-cable','3-in-1 Charging Cable','Mobile Accessories',399,549,32,'New',4.5,'Multi-connector cable for everyday carry.','{"connectors":"Type-C + Lightning + Micro USB"}'),
 ('65w-gan-charger','65W GaN Charger','Mobile Accessories',1999,2499,10,'Premium',4.8,'Compact high-output GaN charger.','{"output":"65W","technology":"GaN","port":"USB-C"}');
