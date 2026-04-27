from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)  # Enables the frontend to communicate with this API

DB_NAME = "foodsaver.db"

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row  # Allows accessing columns by name
    return conn

def init_db():
    """Initializes the database and creates tables based on your ER diagram."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create User table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            name TEXT,
            address TEXT,
            role TEXT,
            restaurant_name TEXT,
            restaurant_address TEXT,
            food_type TEXT
        )
    ''')
    
    # Create Menu Items table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS menu_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            restaurant TEXT,
            name TEXT NOT NULL,
            category TEXT,
            ingredients TEXT,
            expiry_date TEXT,
            type TEXT,
            quantity INTEGER DEFAULT 1
        )
    ''')
    
    conn.commit()
    conn.close()

# --- ROUTES ---

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    conn = get_db_connection()
    try:
        conn.execute('''
            INSERT INTO users (email, password, name, address, role, restaurant_name, restaurant_address, food_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
            (data['email'], data['password'], data.get('name'), data.get('address'), data['role'],
             data.get('restaurantName'), data.get('restaurantAddress'), data.get('foodType')))
        conn.commit()
        return jsonify({"message": "User registered successfully"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "User already exists"}), 400
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ? AND password = ?',
                        (data['email'], data['password'])).fetchone()
    conn.close()
    
    if user:
        return jsonify(dict(user)), 200
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/food', methods=['GET'])
def get_all_food():
    conn = get_db_connection()
    items = conn.execute('SELECT * FROM menu_items').fetchall()
    conn.close()
    return jsonify([dict(row) for row in items])

@app.route('/api/food', methods=['POST'])
def add_food():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO menu_items (restaurant, name, category, ingredients, expiry_date, type, quantity)
        VALUES (?, ?, ?, ?, ?, ?, ?)''',
        (data['restaurant'], data['name'], data['category'], ",".join(data['ingredients']),
         data['expiryDate'], data['type'], data['quantity']))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return jsonify({"message": "Item added", "id": new_id}), 201

@app.route('/api/request/<int:item_id>', methods=['PATCH'])
def request_food(item_id):
    conn = get_db_connection()
    # Check if quantity > 0
    item = conn.execute('SELECT quantity FROM menu_items WHERE id = ?', (item_id,)).fetchone()
    if item and item['quantity'] > 0:
        conn.execute('UPDATE menu_items SET quantity = quantity - 1 WHERE id = ?', (item_id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Request successful"}), 200
    conn.close()
    return jsonify({"error": "Item unavailable"}), 400

if __name__ == '__main__':
    init_db()
    print("Bridge server running on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
