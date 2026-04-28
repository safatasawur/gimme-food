import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)
CORS(app)  # Allows your frontend JS to talk to this backend

# --- MYSQL CONFIGURATION ---
# These values are read from Railway environment variables.
# Set them in your Railway service: Settings > Variables
db_config = {
    'host':     os.environ.get('MYSQLHOST', 'localhost'),
    'port':     int(os.environ.get('MYSQLPORT', 3306)),
    'user':     os.environ.get('MYSQLUSER', 'root'),
    'password': os.environ.get('MYSQLPASSWORD', ''),
    'database': os.environ.get('MYSQLDATABASE', 'foodsaver_db'),
}

def get_db_connection():
    try:
        conn = mysql.connector.connect(**db_config)
        return conn
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

# --- API ROUTES ---

@app.route('/api/food', methods=['GET'])
def get_food():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB Connection Failed"}), 500

    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM menu_items")
    items = cursor.fetchall()

    cursor.close()
    conn.close()
    return jsonify(items)

@app.route('/api/food', methods=['POST'])
def add_food():
    data = request.json
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB Connection Failed"}), 500

    cursor = conn.cursor()

    query = """INSERT INTO menu_items 
               (restaurant, name, category, ingredients, expiry_date, type, quantity) 
               VALUES (%s, %s, %s, %s, %s, %s, %s)"""

    values = (
        data['restaurant'],
        data['name'],
        data['category'],
        ",".join(data['ingredients']),  # Convert list to string for DB
        data['expiryDate'],
        data['type'],
        data.get('quantity', 1)
    )

    cursor.execute(query, values)
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Item added successfully"}), 201

@app.route('/api/request/<int:item_id>', methods=['PATCH'])
def request_food(item_id):
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB Connection Failed"}), 500

    cursor = conn.cursor()
    cursor.execute(
        "UPDATE menu_items SET quantity = quantity - 1 WHERE id = %s AND quantity > 0",
        (item_id,)
    )

    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Inventory updated"})

if __name__ == '__main__':
    # Railway injects the PORT env variable — this is critical!
    port = int(os.environ.get('PORT', 5000))
    print(f"Bridge server running on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
