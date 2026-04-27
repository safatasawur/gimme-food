USE `gimme_food`;

-- Create a DB user matching bridge.py credentials
CREATE USER IF NOT EXISTS 'teamfood'@'localhost' IDENTIFIED BY 'strongpassword';
GRANT ALL PRIVILEGES ON `gimme_food`.* TO 'teamfood'@'localhost';
FLUSH PRIVILEGES;

-- Minimal categories
INSERT IGNORE INTO categories (category_id, category_name) VALUES
  ('meal', 'Meal'),
  ('bakery', 'Bakery'),
  ('beverage', 'Beverage');

-- Insert a seller and store with explicit ids so we can reference them
INSERT INTO seller (seller_id, username, email, password, store_id, seller_city)
  VALUES ('s1', 'owner1', 'owner1@example.com', 'ownerpass', 1, 'TestCity')
  ON DUPLICATE KEY UPDATE username=VALUES(username);

INSERT INTO stores (store_name, store_open, store_has_items, store_id, seller_id, store_address)
  VALUES ('Test Store', 1, 1, 1, 's1', '123 Main St')
  ON DUPLICATE KEY UPDATE store_name=VALUES(store_name);

-- Minimal menu item
INSERT INTO menu_item (item_id, item_name, item_price, item_stock, item_category, item_expiry_date, item_quantity, store_id)
  VALUES (1, 'Chicken Biryani', 5.50, 1, 'meal', '2026-03-30', 3, 1)
  ON DUPLICATE KEY UPDATE item_name=VALUES(item_name);

-- Minimal user (customer)
INSERT INTO user (user_id, username, email, password, user_city)
  VALUES (1, 'customer1', 'cust@example.com', 'custpass', 'TestCity')
  ON DUPLICATE KEY UPDATE username=VALUES(username);
