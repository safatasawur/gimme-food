import pymysql

conn = pymysql.connect(
    host="metro.proxy.rlwy.net",
    user="root",
    password="ZuOfBdZfwqPvthhVbSnCNgBoFRkVmwbg",
    database="railway",
    port=41339,
    ssl={"ssl": {}}
)

cursor = conn.cursor()

schema = """
CREATE TABLE IF NOT EXISTS `user` (
  `user_id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(16) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `create_time` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `user_city` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC)
);

CREATE TABLE IF NOT EXISTS `seller` (
  `seller_id` VARCHAR(45) NOT NULL,
  `username` VARCHAR(16) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `create_time` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `store_id` INT NOT NULL AUTO_INCREMENT,
  `seller_city` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`seller_id`),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC),
  UNIQUE INDEX `store_id_UNIQUE` (`store_id` ASC)
);

CREATE TABLE IF NOT EXISTS `categories` (
  `category_id` VARCHAR(30) NOT NULL,
  `category_name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`category_id`)
);

CREATE TABLE IF NOT EXISTS `stores` (
  `store_id` INT NOT NULL AUTO_INCREMENT,
  `store_name` VARCHAR(50) NOT NULL,
  `store_open` TINYINT NOT NULL DEFAULT 1,
  `store_has_items` TINYINT NOT NULL DEFAULT 0,
  `seller_id` VARCHAR(45) NULL,
  `store_address` VARCHAR(200) NULL,
  PRIMARY KEY (`store_id`),
  UNIQUE INDEX `store_id_UNIQUE` (`store_id` ASC)
);

CREATE TABLE IF NOT EXISTS `menu_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `restaurant` VARCHAR(100) NOT NULL,
  `name` VARCHAR(80) NOT NULL,
  `category` VARCHAR(45) NOT NULL,
  `ingredients` TEXT NULL,
  `expiry_date` DATE NOT NULL,
  `type` VARCHAR(20) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
);
"""

for statement in schema.split(";"):
    stmt = statement.strip()
    if stmt:
        try:
            cursor.execute(stmt)
            print(f"OK: {stmt[:60]}...")
        except Exception as e:
            print(f"SKIP/ERROR: {e} — {stmt[:60]}")

conn.commit()
cursor.close()
conn.close()
print("Schema applied successfully!")
