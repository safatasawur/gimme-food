import os
import sys
from urllib.parse import urlparse
from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
import pymysql.cursors

app = Flask(__name__)
CORS(app)

print("DEBUG: App server starting...")

# --- MYSQL CONFIGURATION ---
def _build_db_config():
    # Railway provides MYSQL_URL or DATABASE_URL as a full connection string
    url = os.environ.get('MYSQL_URL') or os.environ.get('DATABASE_URL')
    print(f"DEBUG: Found URL: {url[:30]}..." if url else "DEBUG: No connection URL found")
    
    if url:
        parsed = urlparse(url)
        return {
            'host':     parsed.hostname,
            'port':     parsed.port or 3306,
            'user':     parsed.username,
            'password': parsed.password,
            'database': parsed.path.lstrip('/'),
            'cursorclass': pymysql.cursors.DictCursor,
            'connect_timeout': 10
        }
    
    # Fallback to individual Railway env vars or localhost
    config = {
        'host':     os.environ.get('MYSQLHOST', 'localhost'),
        'port':     int(os.environ.get('MYSQLPORT', 3306)),
        'user':     os.environ.get('MYSQLUSER', 'root'),
        'password': os.environ.get('MYSQLPASSWORD', ''),
        'database': os.environ.get('MYSQLDATABASE', 'railway'),
        'cursorclass': pymysql.cursors.DictCursor,
        'connect_timeout': 10
    }
    print(f"DEBUG: Using fallback config for host: {config['host']}")
    return config

try:
    db_config = _build_db_config()
except Exception as e:
    print(f"DEBUG: Error building DB config: {e}")
    db_config = {}

def get_db_connection():
    try:
        conn = pymysql.connect(**db_config)
        return conn
    except Exception as e:
        print(f"DEBUG: Error connecting to MySQL: {e}")
        return None

def init_db():
    """Create tables if they don't exist yet."""
    print("DEBUG: Initializing database...")
    conn = get_db_connection()
    if conn is None:
        print("DEBUG: WARNING: Could not connect to DB on startup.")
        return
    try:
        with conn.cursor() as cursor:
            # User table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `user` (
                  `user_id` INT NOT NULL AUTO_INCREMENT,
                  `username` VARCHAR(16) NOT NULL,
                  `email` VARCHAR(255) NOT NULL,
                  `password` VARCHAR(255) NOT NULL,
                  `user_city` VARCHAR(45) NOT NULL,
                  `create_time` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (`user_id`),
                  UNIQUE KEY `email_UNIQUE` (`email`),
                  UNIQUE KEY `username_UNIQUE` (`username`)
                )
            """)
            # Seller table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `seller` (
                  `seller_id` INT NOT NULL AUTO_INCREMENT,
                  `username` VARCHAR(16) NOT NULL,
                  `email` VARCHAR(255) NOT NULL,
                  `password` VARCHAR(255) NOT NULL,
                  `seller_city` VARCHAR(45) NOT NULL,
                  `restaurant_name` VARCHAR(100),
                  `restaurant_address` VARCHAR(255),
                  `create_time` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (`seller_id`),
                  UNIQUE KEY `username_UNIQUE` (`username`),
                  UNIQUE KEY `email_UNIQUE` (`email`)
                )
            """)
            # Menu Items table
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
        print("DEBUG: Database tables ready.")
    except Exception as e:
        print(f"DEBUG: DB init error: {e}")
    finally:
        conn.close()

# Run on startup
try:
    init_db()
except Exception as e:
    print(f"DEBUG: Startup init failed: {e}")

# --- ROUTES ---

@app.route('/')
def home():
    return jsonify({"status": "OK", "message": "GimmeFood API is running"})

@app.route('/api/health')
def health():
    conn = get_db_connection()
    if conn:
        conn.close()
        return jsonify({"status": "healthy", "db": "connected"})
    return jsonify({"status": "unhealthy", "db": "disconnected"}), 500

# --- AUTH ROUTES ---

@app.route('/api/signup-user', methods=['POST'])
def signup():
    data = request.json
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB Connection Failed"}), 500
    
    try:
        with conn.cursor() as cursor:
            role = data.get('role', 'customer')
            
            if role == 'owner':
                query = """INSERT INTO seller (username, email, password, seller_city, restaurant_name, restaurant_address) 
                           VALUES (%s, %s, %s, %s, %s, %s)"""
                values = (data['username'], data['email'], data['password'], data.get('city', 'Unknown'), 
                          data.get('restaurantName'), data.get('restaurantAddress'))
            else:
                query = "INSERT INTO user (username, email, password, user_city) VALUES (%s, %s, %s, %s)"
                values = (data['username'], data['email'], data['password'], data.get('city', 'Unknown'))
                
            cursor.execute(query, values)
        conn.commit()
        return jsonify({"message": f"{role.capitalize()} registered successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB Connection Failed"}), 500
    
    try:
        with conn.cursor() as cursor:
            query = "SELECT * FROM user WHERE email = %s AND password = %s"
            cursor.execute(query, (data['email'], data['password']))
            user = cursor.fetchone()
            
            if user:
                return jsonify({"message": "Login successful", "role": "customer", "user": user})
            
            # Check sellers if not found in users
            query = "SELECT * FROM seller WHERE email = %s AND password = %s"
            cursor.execute(query, (data['email'], data['password']))
            seller = cursor.fetchone()
            
            if seller:
                return jsonify({"message": "Login successful", "role": "owner", "user": seller})
            
        return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

# --- FOOD ROUTES ---

@app.route('/api/food', methods=['GET'])
def get_food():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB Connection Failed"}), 500
    
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM menu_items")
            items = cursor.fetchall()
        return jsonify(items)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/food', methods=['POST'])
def add_food():
    data = request.json
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB Connection Failed"}), 500
    
    try:
        with conn.cursor() as cursor:
            query = """INSERT INTO menu_items 
                       (restaurant, name, category, ingredients, expiry_date, type, quantity) 
                       VALUES (%s, %s, %s, %s, %s, %s, %s)"""
            
            # Handle ingredients if list
            ingredients = data['ingredients']
            if isinstance(ingredients, list):
                ingredients = ",".join(ingredients)
                
            values = (
                data['restaurant'],
                data['name'],
                data['category'],
                ingredients,
                data['expiryDate'],
                data['type'],
                data.get('quantity', 1)
            )
            cursor.execute(query, values)
        conn.commit()
        return jsonify({"message": "Item added successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()

@app.route('/api/request-food', methods=['POST'])
def request_food_post():
    data = request.json
    item_id = data.get('item_id')
    
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB Connection Failed"}), 500
    
    try:
        with conn.cursor() as cursor:
            # Decrement quantity
            cursor.execute(
                "UPDATE menu_items SET quantity = quantity - 1 WHERE id = %s AND quantity > 0",
                (item_id,)
            )
        conn.commit()
        return jsonify({"message": "Inventory updated"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
