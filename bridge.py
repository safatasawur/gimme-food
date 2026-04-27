from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)
CORS(app) # Allows your frontend JS to talk to this backend

# --- MYSQL CONFIGURATION ---
# Ask your friend for these specific details
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'YOUR_PASSWORD_HERE',
    'database': 'foodsaver_db' 
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
    if conn is None: return jsonify({"error": "DB Connection Failed"}), 500
    
    cursor = conn.cursor(dictionary=True)
    # Ensure this table name matches your friend's MySQL schema
    cursor.execute("SELECT * FROM menu_items") 
    items = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return jsonify(items)

@app.route('/api/food', methods=['POST'])
def add_food():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Matching the fields found in your owner.js
    query = """INSERT INTO menu_items 
               (restaurant, name, category, ingredients, expiry_date, type, quantity) 
               VALUES (%s, %s, %s, %s, %s, %s, %s)"""
    
    values = (
        data['restaurant'], 
        data['name'], 
        data['category'], 
        ",".join(data['ingredients']), # Convert list to string for DB
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
    cursor = conn.cursor()
    
    # Decrease quantity by 1, similar to the logic in customer.js
    cursor.execute("UPDATE menu_items SET quantity = quantity - 1 WHERE id = %s AND quantity > 0", (item_id,))
    
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Inventory updated"})

if __name__ == '__main__':
    print("Bridge server running on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
