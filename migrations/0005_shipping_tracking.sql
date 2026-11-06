PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS shipments (
  order_id TEXT PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  carrier TEXT NOT NULL DEFAULT '',
  tracking_number TEXT NOT NULL DEFAULT '',
  tracking_url TEXT NOT NULL DEFAULT '',
  estimated_delivery TEXT NOT NULL DEFAULT '',
  shipment_status TEXT NOT NULL DEFAULT 'Label Created' CHECK(shipment_status IN ('Label Created','Picked Up','In Transit','Out for Delivery','Delivered','Delivery Exception','RTO')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS shipment_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(shipment_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_shipment_events_order ON shipment_events(order_id, id DESC);
