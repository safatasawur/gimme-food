import os
import sys
import traceback
from urllib.parse import urlparse
from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
import pymysql.cursors

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

print("DEBUG: App server starting...")

# --- MYSQL CONFIGURATION ---
def _build_db_config():
    url = os.environ.get('MYSQL_URL') or os.environ.get('DATABASE_URL')
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
    return {
        'host':     os.environ.get('MYSQLHOST', 'localhost'),
        'port':     int(os.environ.get('MYSQLPORT', 3306)),
        'user':     os.environ.get('MYSQLUSER', 'root'),
        'password': os.environ.get('MYSQLPASSWORD', ''),
        'database': os.environ.get('MYSQLDATABASE', 'railway'),
        'cursorclass': pymysql.cursors.DictCursor,
        'connect_timeout': 10
    }

db_config = _build_db_config()

def get_db_connection():
    try:
        return pymysql.connect(**db_config)
    except Exception as e:
        print(f"DEBUG: Connection Error: {e}")
        return None

def init_db():
    print("DEBUG: Initializing database...")
    conn = get_db_connection()
    if conn is None: return
    try:
        with conn.cursor() as cursor:
            # User table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `user` (
                  `user_id` INT NOT NULL AUTO_INCREMENT,
                  `username` VARCHAR(64) NOT NULL,
                  `email` VARCHAR(255) NOT NULL,
                  `password` VARCHAR(255) NOT NULL,
                  `user_city` VARCHAR(64) NOT NULL,
                  `create_time` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (`user_id`),
                  UNIQUE KEY `email_UNIQUE` (`email`)
                )
            """)
            # Force AUTO_INCREMENT if missing
            try:
                cursor.execute("ALTER TABLE `user` MODIFY `user_id` INT NOT NULL AUTO_INCREMENT")
            except: pass

            # Seller table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `seller` (
                  `seller_id` INT NOT NULL AUTO_INCREMENT,
                  `username` VARCHAR(64) NOT NULL,
                  `email` VARCHAR(255) NOT NULL,
                  `password` VARCHAR(255) NOT NULL,
                  `seller_city` VARCHAR(64) NOT NULL,
                  `create_time` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                  PRIMARY KEY (`seller_id`),
                  UNIQUE KEY `email_UNIQUE` (`email`)
                )
            """)
            # Force AUTO_INCREMENT for seller_id
            try:
                cursor.execute("ALTER TABLE `seller` MODIFY `seller_id` INT NOT NULL AUTO_INCREMENT")
            except: pass

            # Check and add missing columns for seller table
            cursor.execute("SHOW COLUMNS FROM `seller` LIKE 'restaurant_name'")
            if not cursor.fetchone():
                print("DEBUG: Adding restaurant_name column to seller table...")
                cursor.execute("ALTER TABLE `seller` ADD COLUMN `restaurant_name` VARCHAR(128)")
            
            cursor.execute("SHOW COLUMNS FROM `seller` LIKE 'restaurant_address'")
            if not cursor.fetchone():
                print("DEBUG: Adding restaurant_address column to seller table...")
                cursor.execute("ALTER TABLE `seller` ADD COLUMN `restaurant_address` VARCHAR(255)")

            cursor.execute("SHOW COLUMNS FROM `seller` LIKE 'seller_city'")
            if not cursor.fetchone():
                print("DEBUG: Adding seller_city column to seller table...")
                cursor.execute("ALTER TABLE `seller` ADD COLUMN `seller_city` VARCHAR(64) DEFAULT 'Unknown'")
            
            # Menu Items table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `menu_items` (
                  `id` INT NOT NULL AUTO_INCREMENT,
                  `restaurant` VARCHAR(128) NOT NULL,
                  `name` VARCHAR(128) NOT NULL,
                  `category` VARCHAR(64) NOT NULL,
                  `ingredients` TEXT NULL,
                  `expiry_date` DATE NOT NULL,
                  `type` VARCHAR(32) NOT NULL,
                  `quantity` INT NOT NULL DEFAULT 1,
                  PRIMARY KEY (`id`)
                )
            """)
        conn.commit()
        print("DEBUG: Database ready.")
    except Exception as e:
        print(f"DEBUG: DB Init Error: {e}")
    finally:
        conn.close()

init_db()

@app.route('/')
def home():
    return jsonify({"status": "OK", "message": "GimmeFood API Live"})

@app.route('/api/health')
def health():
    conn = get_db_connection()
    if conn:
        conn.close()
        return jsonify({"status": "healthy", "db": "connected"})
    return jsonify({"status": "unhealthy", "db": "disconnected"}), 500

@app.route('/api/signup-user', methods=['POST'])
def signup():
    data = request.json or {}
    print(f"DEBUG: Signup request: {data.get('email')} as {data.get('role')}")
    conn = get_db_connection()
    if conn is None: return jsonify({"error": "DB Down"}), 500
    
    try:
        role = data.get('role', 'customer')
        with conn.cursor() as cursor:
            if role == 'owner':
                query = """INSERT INTO seller (username, email, password, seller_city, restaurant_name, restaurant_address) 
                           VALUES (%s, %s, %s, %s, %s, %s)"""
                values = (data.get('username',''), data.get('email',''), data.get('password',''), 
                          data.get('city','Unknown'), data.get('restaurantName',''), data.get('restaurantAddress',''))
            else:
                query = "INSERT INTO user (username, email, password, user_city) VALUES (%s, %s, %s, %s)"
                values = (data.get('username',''), data.get('email',''), data.get('password',''), data.get('city','Unknown'))
            
            cursor.execute(query, values)
        conn.commit()
        return jsonify({"message": "Success"}), 201
    except Exception as e:
        print(f"DEBUG: Signup SQL Error: {e}")
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    print(f"DEBUG: Login request: {data.get('email')}")
    conn = get_db_connection()
    if conn is None: return jsonify({"error": "DB Down"}), 500
    
    try:
        with conn.cursor() as cursor:
            # Check users
            cursor.execute("SELECT * FROM user WHERE email = %s AND password = %s", (data.get('email'), data.get('password')))
            user = cursor.fetchone()
            if user:
                return jsonify({"message": "OK", "role": "customer", "user": user})
            
            # Check sellers
            cursor.execute("SELECT * FROM seller WHERE email = %s AND password = %s", (data.get('email'), data.get('password')))
            seller = cursor.fetchone()
            if seller:
                return jsonify({"message": "OK", "role": "owner", "user": seller})
            
        return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        print(f"DEBUG: Login SQL Error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/food', methods=['GET', 'POST'])
def handle_food():
    conn = get_db_connection()
    if conn is None: return jsonify({"error": "DB Down"}), 500
    try:
        with conn.cursor() as cursor:
            if request.method == 'POST':
                data = request.json
                query = "INSERT INTO menu_items (restaurant, name, category, ingredients, expiry_date, type, quantity) VALUES (%s, %s, %s, %s, %s, %s, %s)"
                cursor.execute(query, (data['restaurant'], data['name'], data['category'], str(data['ingredients']), data['expiryDate'], data['type'], data.get('quantity', 1)))
                conn.commit()
                return jsonify({"message": "Added"}), 201
            else:
                cursor.execute("SELECT * FROM menu_items")
                return jsonify(cursor.fetchall())
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()

@app.route('/api/request-food', methods=['POST'])
def request_food():
    data = request.json
    conn = get_db_connection()
    if conn is None: return jsonify({"error": "DB Down"}), 500
    try:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE menu_items SET quantity = quantity - 1 WHERE id = %s AND quantity > 0", (data['item_id'],))
        conn.commit()
        return jsonify({"message": "Updated"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
