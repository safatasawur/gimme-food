import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
import pymysql.cursors

app = Flask(__name__)
CORS(app)  # Allows your frontend JS to talk to this backend

# --- MYSQL CONFIGURATION (Railway env vars) ---
db_config = {
    'host':     os.environ.get('MYSQLHOST', 'metro.proxy.rlwy.net'),
    'port':     int(os.environ.get('MYSQLPORT', 41339)),
    'user':     os.environ.get('MYSQLUSER', 'root'),
    'password': os.environ.get('MYSQLPASSWORD', 'ZuOfBdZfwqPvthhVbSnCNgBoFRkVmwbg'),
    'database': os.environ.get('MYSQLDATABASE', 'railway'),
    'ssl':      {'ssl': {}},
    'cursorclass': pymysql.cursors.DictCursor,
}

def get_db_connection():
    try:
        conn = pymysql.connect(**db_config)
        return conn
    except Exception as e:
        print(f"Error connecting to MySQL: {e}")
        return None

# --- HEALTH CHECK ---

@app.route('/')
def home():
    return jsonify({"status": "OK", "message": "GimmeFood API is running"})

@app.route('/test-db')
def test_db():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB Connection Failed"}), 500
    cur = conn.cursor()
    cur.execute("SELECT 1")
    result = cur.fetchone()
    cur.close()
    conn.close()
    return jsonify({"db": "connected", "result": str(result)})

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
