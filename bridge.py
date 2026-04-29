import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)
CORS(app)

# Correct Railway internal config (NO external proxy)
db_config = {
    'host': os.environ.get('MYSQLHOST'),
    'port': int(os.environ.get('MYSQLPORT', 3306)),
    'user': os.environ.get('MYSQLUSER'),
    'password': os.environ.get('MYSQLPASSWORD'),
    'database': os.environ.get('MYSQLDATABASE'),
}

def get_db_connection():
    try:
        return mysql.connector.connect(**db_config)
    except Error as e:
        print("DB ERROR:", e)
        return None

# --- ROUTES ---

@app.route('/')
def home():
    return "API running"

@app.route('/api/food', methods=['GET'])
def get_food():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB failed"}), 500

    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT item_id, item_name, item_category, item_expiry_date, 
               item_quantity, item_price, store_id
        FROM menu_item
    """)
    items = cursor.fetchall()

    cursor.close()
    conn.close()
    return jsonify(items)

@app.route('/api/food', methods=['POST'])
def add_food():
    data = request.json

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB failed"}), 500

    cursor = conn.cursor()

    query = """
        INSERT INTO menu_item 
        (item_name, item_category, item_expiry_date, item_quantity, item_price, store_id)
        VALUES (%s, %s, %s, %s, %s, %s)
    """

    values = (
        data.get('name'),
        data.get('category'),
        data.get('expiryDate'),
        data.get('quantity', 1),
        data.get('price', 0),
        data.get('store_id', 1)
    )

    cursor.execute(query, values)
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": "Item added"}), 201

@app.route('/api/request/<int:item_id>', methods=['PATCH'])
def request_food(item_id):
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB failed"}), 500

    cursor = conn.cursor()

    cursor.execute("""
        UPDATE menu_item 
        SET item_quantity = item_quantity - 1 
        WHERE item_id = %s AND item_quantity > 0
    """, (item_id,))

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": "Updated"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
