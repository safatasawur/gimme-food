import mysql.connector
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

db_config = {
    'host': 'localhost',    # FIXED: Removed the space
    'user': 'teamfood',
    'password': 'strongpassword',
    'database': 'gimme_food',
    'port': 3306            # This tells Python to talk TO the database on 3306
}

def query_db(query, args=(), one=False):
    conn = mysql.connector.connect(**db_config)
    cur = conn.cursor(dictionary=True)
    cur.execute(query, args)
    rv = cur.fetchall()
    conn.commit()
    cur.close()
    conn.close()
    return (rv[0] if rv else None) if one else rv

@app.route('/api/food', methods=['GET'])
def get_all_food():
    results = query_db("SELECT * FROM menu_item")
    return jsonify(results)

@app.route('/api/signup-user', methods=['POST'])
def signup_user():
    data = request.json
    try:
        query_db(
            "INSERT INTO user (username, email, password) VALUES (%s, %s, %s)",
            (data['username'], data['email'], data['password'])
        )
        return jsonify({"message": "success"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    # FIXED: Flask runs on 5000, MySQL stays on 3306
    app.run(debug=True, port=5000)