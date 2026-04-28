import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
import pymysql.cursors

app = Flask(__name__)
CORS(app)

# --- MYSQL CONFIGURATION ---
db_config = {
    'host':     os.environ['MYSQLHOST'],
    'port':     int(os.environ.get('MYSQLPORT', 3306)),
    'user':     os.environ['MYSQLUSER'],
    'password': os.environ['MYSQLPASSWORD'],
    'database': os.environ.get('MYSQLDATABASE', 'railway'),
    'ssl':      {'ssl': {}},
    'cursorclass': pymysql.cursors.DictCursor,
}

def get_db_connection():
    try:
        conn = pymysql.connect(**db_config)
        return conn
    except Exception as e:
        print(f"DB connection error: {e}")
        return None

def init_db():
    """Create tables if they don't exist yet."""
    conn = get_db_connection()
    if conn is None:
        print("WARNING: Could not connect to DB on startup.")
        return
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `user` (
                  `user_id` INT NOT NULL AUTO_INCREMENT,
                  `username` VARCHAR(16) NOT NULL,
                  `email` VARCHAR(255) NOT NULL,
                  `password` VARCHAR(255) NOT NULL,
                  `create_time` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                  `user_city` VARCHAR(45) NOT NULL,
                  PRIMARY KEY (`user_id`),
                  UNIQUE KEY `email_UNIQUE` (`email`),
                  UNIQUE KEY `username_UNIQUE` (`username`)
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `seller` (
                  `seller_id` VARCHAR(45) NOT NULL,
                  `username` VARCHAR(16) NOT NULL,
                  `email` VARCHAR(255) NOT NULL,
                  `password` VARCHAR(255) NOT NULL,
                  `create_time` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                  `seller_city` VARCHAR(45) NOT NULL,
                  PRIMARY KEY (`seller_id`),
                  UNIQUE KEY `username_UNIQUE` (`username`),
                  UNIQUE KEY `email_UNIQUE` (`email`)
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `categories` (
                  `category_id` VARCHAR(30) NOT NULL,
                  `category_name` VARCHAR(45) NOT NULL,
                  PRIMARY KEY (`category_id`)
                )
            """)
            cursor.execute("""
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
                )
            """)
        conn.commit()
        print("Database tables ready.")
    except Exception as e:
        print(f"DB init error: {e}")
    finally:
        conn.close()

# Run on startup
init_db()

# --- HEALTH CHECK ---

@app.route('/')
def home():
    return jsonify({"status": "OK", "message": "GimmeFood API is running"})

@app.route('/test-db')
def test_db():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB Connection Failed"}), 500
    with conn.cursor() as cur:
        cur.execute("SELECT 1 as ok")
        result = cur.fetchone()
    conn.close()
    return jsonify({"db": "connected", "result": result})

# --- API ROUTES ---

@app.route('/api/food', methods=['GET'])
def get_food():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB Connection Failed"}), 500
    with conn.cursor() as cursor:
        cursor.execute("SELECT * FROM menu_items")
        items = cursor.fetchall()
    conn.close()
    return jsonify(items)

@app.route('/api/food', methods=['POST'])
def add_food():
    data = request.json
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB Connection Failed"}), 500
    query = """INSERT INTO menu_items 
               (restaurant, name, category, ingredients, expiry_date, type, quantity) 
               VALUES (%s, %s, %s, %s, %s, %s, %s)"""
    values = (
        data['restaurant'],
        data['name'],
        data['category'],
        ",".join(data['ingredients']),
        data['expiryDate'],
        data['type'],
        data.get('quantity', 1)
    )
    with conn.cursor() as cursor:
        cursor.execute(query, values)
    conn.commit()
    conn.close()
    return jsonify({"message": "Item added successfully"}), 201

@app.route('/api/request/<int:item_id>', methods=['PATCH'])
def request_food(item_id):
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB Connection Failed"}), 500
    with conn.cursor() as cursor:
        cursor.execute(
            "UPDATE menu_items SET quantity = quantity - 1 WHERE id = %s AND quantity > 0",
            (item_id,)
        )
    conn.commit()
    conn.close()
    return jsonify({"message": "Inventory updated"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
