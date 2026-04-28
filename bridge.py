import os
import mysql.connector
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

db_config = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'user': os.environ.get('DB_USER', 'teamfood'),
    'password': os.environ.get('DB_PASS', 'strongpassword'),
    'database': os.environ.get('DB_NAME', 'gimme_food'),
    'port': int(os.environ.get('DB_PORT', 3306))
}

def get_conn():
    return mysql.connector.connect(**db_config)

def query_db(query, args=(), one=False):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute(query, args)
    rv = cur.fetchall()
    conn.commit()
    cur.close()
    conn.close()
    return (rv[0] if rv else None) if one else rv

def execute_db(query, args=()):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(query, args)
    lastid = cur.lastrowid
    conn.commit()
    cur.close()
    conn.close()
    return lastid

@app.route('/')
def index():
    return send_from_directory(ROOT_DIR, 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(ROOT_DIR, path)

@app.route('/api/food', methods=['GET'])
def get_all_food():
    try:
        sql = ("SELECT m.item_id, m.item_name, m.item_category, m.item_expiry_date, "
               "m.item_quantity, m.item_price, s.store_name "
               "FROM menu_item m LEFT JOIN stores s ON m.store_id = s.store_id")
        rows = query_db(sql)
        mapped = []
        for r in rows:
            mapped.append({
                'id': r.get('item_id'),
                'name': r.get('item_name'),
                'restaurant': r.get('store_name') or '',
                'category': r.get('item_category'),
                'expiryDate': r.get('item_expiry_date').isoformat() if r.get('item_expiry_date') else None,
                'quantity': r.get('item_quantity'),
                'price': float(r.get('item_price')) if r.get('item_price') is not None else None,
                'type': 'regular'
            })
        return jsonify(mapped)
    except Exception as e:
        print('Error fetching food:', e)
        return jsonify([]), 200

@app.route('/api/signup-user', methods=['POST'])
def signup_user():
    data = request.json or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    if not username or not email or not password:
        return jsonify({'error': 'missing_fields'}), 400
    try:
        exists = query_db('SELECT user_id FROM user WHERE email = %s', (email,), one=True)
        if exists:
            return jsonify({'error': 'email_exists'}), 409
        execute_db('INSERT INTO user (username, email, password) VALUES (%s, %s, %s)',
                   (username, email, password))
        return jsonify({'message': 'success'}), 201
    except Exception as e:
        print('Signup error:', e)
        return jsonify({'error': 'server_error'}), 500

@app.route('/api/check-schema', methods=['GET'])
def check_schema():
    expected = {'tables': ['menu_item', 'stores', 'user', 'categories']}
    result = {}
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("SHOW TABLES")
        tables = [row[0] for row in cur.fetchall()]
        cur.close()
        conn.close()
        for t in expected['tables']:
            result[t] = t in tables
        return jsonify({'ok': True, 'tables': result})
    except Exception as e:
        print('Schema check error:', e)
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route('/api/seed-user', methods=['POST'])
def seed_user():
    data = request.json or {}
    email = data.get('email')
    username = data.get('username', 'testuser')
    password = data.get('password', 'testpass')
    if not email:
        return jsonify({'error': 'missing_email'}), 400
    try:
        exists = query_db('SELECT user_id FROM user WHERE email = %s', (email,), one=True)
        if exists:
            return jsonify({'message': 'exists'}), 200
        execute_db('INSERT INTO user (username, email, password, user_city) VALUES (%s, %s, %s, %s)',
                   (username, email, password, 'Unknown'))
        return jsonify({'message': 'seeded'}), 201
    except Exception as e:
        print('Seed user error:', e)
        return jsonify({'error': 'server_error'}), 500

@app.route('/api/login', methods=['POST'])
def login_user():
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({'error': 'missing_fields'}), 400
    try:
        user = query_db('SELECT user_id, username, email FROM user WHERE email = %s AND password = %s', (email, password), one=True)
        if user:
            return jsonify({'user': {'id': user.get('user_id'), 'username': user.get('username'), 'email': user.get('email')}, 'role': 'customer'}), 200

        seller = query_db('SELECT store_id, username, email FROM seller WHERE email = %s AND password = %s', (email, password), one=True)
        if seller:
            return jsonify({'user': {'id': seller.get('store_id'), 'username': seller.get('username'), 'email': seller.get('email')}, 'role': 'owner'}), 200

        return jsonify({'error': 'invalid_credentials'}), 401
    except Exception as e:
        print('Login error:', e)
        return jsonify({'error': 'server_error'}), 500

@app.route('/api/request-food', methods=['POST'])
def request_food():
    data = request.json or {}
    email = data.get('email')
    item_id = data.get('item_id')
    if not email or not item_id:
        return jsonify({'error': 'missing_fields'}), 400
    try:
        user = query_db('SELECT user_id FROM user WHERE email = %s', (email,), one=True)
        if not user:
            return jsonify({'error': 'user_not_found'}), 404

        item = query_db('SELECT item_id FROM menu_item WHERE item_id = %s', (item_id,), one=True)
        if not item:
            return jsonify({'error': 'item_not_found'}), 404

        last = execute_db('INSERT INTO food_request (user_id, item_id, status) VALUES (%s, %s, %s)',
                          (user.get('user_id'), item_id, 'pending'))
        return jsonify({'message': 'requested', 'request_id': last}), 201
    except Exception as e:
        print('Request food error:', e)
        return jsonify({'error': 'server_error'}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
