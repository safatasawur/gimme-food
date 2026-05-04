import os
from urllib.parse import urlparse
from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
import pymysql.cursors

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

print("DEBUG: App server starting...")


# =====================================================
# DATABASE CONFIG
# =====================================================

def _build_db_config():
    url = os.environ.get("MYSQL_URL") or os.environ.get("DATABASE_URL")

    if url:
        parsed = urlparse(url)
        return {
            "host": parsed.hostname,
            "port": parsed.port or 3306,
            "user": parsed.username,
            "password": parsed.password,
            "database": parsed.path.lstrip("/"),
            "cursorclass": pymysql.cursors.DictCursor,
            "connect_timeout": 10
        }

    return {
        "host": os.environ.get("MYSQLHOST", "localhost"),
        "port": int(os.environ.get("MYSQLPORT", 3306)),
        "user": os.environ.get("MYSQLUSER", "root"),
        "password": os.environ.get("MYSQLPASSWORD", ""),
        "database": os.environ.get("MYSQLDATABASE", "railway"),
        "cursorclass": pymysql.cursors.DictCursor,
        "connect_timeout": 10
    }


db_config = _build_db_config()


def get_db_connection():
    try:
        return pymysql.connect(**db_config)
    except Exception as e:
        print("DB CONNECTION ERROR:", e)
        return None


# =====================================================
# INIT DATABASE
# =====================================================

def init_db():
    conn = get_db_connection()

    if conn is None:
        print("DB NOT CONNECTED")
        return

    try:
        with conn.cursor() as cursor:

            # ---------------- USER TABLE ----------------
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS user (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(64) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                user_city VARCHAR(64),
                create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

            # ---------------- SELLER TABLE ----------------
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS seller (
                seller_id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(64) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                seller_city VARCHAR(64),
                restaurant_name VARCHAR(128),
                restaurant_address VARCHAR(255),
                create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

          # ---------------- FOOD TABLE ----------------
            cursor.execute("DROP TABLE IF EXISTS menu_items") # <--- ADD THIS LINE
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS menu_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                owner_id INT,
                restaurant VARCHAR(128),
                name VARCHAR(128),
                category VARCHAR(64),
                ingredients TEXT,
                expiry_date DATE,
                type VARCHAR(32),
                quantity INT DEFAULT 1
            )
            """)

            # ---------------- REQUEST TABLE ----------------
            cursor.execute("DROP TABLE IF EXISTS requests") # <--- ADD THIS LINE
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                food_id INT NOT NULL,
                customer_id INT NOT NULL,
                owner_id INT NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

            # ---------------- NOTIFICATIONS ----------------
            cursor.execute("DROP TABLE IF EXISTS notifications") # <--- ADD THIS LINE
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

        conn.commit()
        print("DATABASE READY")

    except Exception as e:
        print("INIT DB ERROR:", e)

    finally:
        conn.close()


init_db()


# =====================================================
# BASIC ROUTES
# =====================================================

@app.route("/")
def home():
    return jsonify({
        "status": "OK",
        "message": "GimmeFood API Running"
    })


@app.route("/api/health")
def health():
    conn = get_db_connection()

    if conn:
        conn.close()
        return jsonify({
            "status": "healthy",
            "db": "connected"
        })

    return jsonify({
        "status": "error",
        "db": "disconnected"
    }), 500


# =====================================================
# SIGNUP
# =====================================================

@app.route("/api/signup-user", methods=["POST"])
def signup():

    data = request.json or {}
    role = data.get("role", "customer")

    conn = get_db_connection()

    if conn is None:
        return jsonify({"error": "DB Down"}), 500

    try:
        with conn.cursor() as cursor:

            if role == "owner":

                cursor.execute("""
                INSERT INTO seller
                (username,email,password,seller_city,restaurant_name,restaurant_address)
                VALUES (%s,%s,%s,%s,%s,%s)
                """, (
                    data.get("username"),
                    data.get("email"),
                    data.get("password"),
                    data.get("city"),
                    data.get("restaurantName"),
                    data.get("restaurantAddress")
                ))

            else:

                cursor.execute("""
                INSERT INTO user
                (username,email,password,user_city)
                VALUES (%s,%s,%s,%s)
                """, (
                    data.get("username"),
                    data.get("email"),
                    data.get("password"),
                    data.get("city")
                ))

        conn.commit()
        return jsonify({"message": "Signup successful"})

    except Exception as e:
        return jsonify({"error": str(e)}), 400

    finally:
        conn.close()


# =====================================================
# LOGIN
# =====================================================

@app.route("/api/login", methods=["POST"])
def login():

    data = request.json or {}

    conn = get_db_connection()

    if conn is None:
        return jsonify({"error": "DB Down"}), 500

    try:
        with conn.cursor() as cursor:

            # customer
            cursor.execute("""
            SELECT * FROM user
            WHERE email=%s AND password=%s
            """, (
                data.get("email"),
                data.get("password")
            ))

            user = cursor.fetchone()

            if user:
                return jsonify({
                    "message": "OK",
                    "role": "customer",
                    "user": user
                })

            # owner
            cursor.execute("""
            SELECT * FROM seller
            WHERE email=%s AND password=%s
            """, (
                data.get("email"),
                data.get("password")
            ))

            seller = cursor.fetchone()

            if seller:
                return jsonify({
                    "message": "OK",
                    "role": "owner",
                    "user": seller
                })

        return jsonify({"error": "Invalid login"}), 401

    finally:
        conn.close()


# =====================================================
# FOOD ROUTES
# =====================================================

@app.route("/api/food", methods=["GET", "POST"])
def food():

    conn = get_db_connection()

    if conn is None:
        return jsonify({"error": "DB Down"}), 500

    try:
        with conn.cursor() as cursor:

            # ADD FOOD
            if request.method == "POST":

                data = request.json or {}

                cursor.execute("""
                INSERT INTO menu_items
                (owner_id,restaurant,name,category,ingredients,expiry_date,type,quantity)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                """, (
                    data.get("owner_id"),
                    data.get("restaurant"),
                    data.get("name"),
                    data.get("category"),
                    str(data.get("ingredients")),
                    data.get("expiryDate"),
                    data.get("type"),
                    data.get("quantity", 1)
                ))

                conn.commit()
                return jsonify({"message": "Food added"})

            # GET FOOD
            cursor.execute("""
            SELECT * FROM menu_items
            WHERE quantity > 0
            ORDER BY id DESC
            """)

            rows = cursor.fetchall()
            return jsonify(rows)

    except Exception as e:
        return jsonify({"error": str(e)}), 400

    finally:
        conn.close()


# =====================================================
# CUSTOMER REQUEST FOOD
# =====================================================

@app.route("/api/request-food", methods=["POST"])
def request_food():

    data = request.json or {}

    conn = get_db_connection()

    if conn is None:
        return jsonify({"error": "DB Down"}), 500

    try:
        with conn.cursor() as cursor:

            cursor.execute("""
            INSERT INTO requests
            (food_id, customer_id, owner_id, status)
            VALUES (%s,%s,%s,'pending')
            """, (
                data.get("food_id"),
                data.get("customer_id"),
                data.get("owner_id")
            ))

            cursor.execute("""
            INSERT INTO notifications
            (user_id,message)
            VALUES (%s,%s)
            """, (
                data.get("owner_id"),
                "You have a new food request"
            ))

        conn.commit()
        return jsonify({"message": "Request sent"})

    except Exception as e:
        return jsonify({"error": str(e)}), 400

    finally:
        conn.close()


# =====================================================
# OWNER VIEW REQUESTS
# =====================================================

@app.route("/api/owner-requests/<int:owner_id>")
def owner_requests(owner_id):

    conn = get_db_connection()

    try:
        with conn.cursor() as cursor:

            cursor.execute("""
            SELECT * FROM requests
            WHERE owner_id=%s
            ORDER BY created_at DESC
            """, (owner_id,))

            rows = cursor.fetchall()

        return jsonify(rows)

    finally:
        conn.close()


# =====================================================
# APPROVE REQUEST
# =====================================================

@app.route("/api/approve-request/<int:req_id>", methods=["POST"])
def approve_request(req_id):

    conn = get_db_connection()

    try:
        with conn.cursor() as cursor:

            cursor.execute("""
            SELECT * FROM requests
            WHERE id=%s
            """, (req_id,))

            req = cursor.fetchone()

            if not req:
                return jsonify({"error": "Request not found"}), 404

            # approve request
            cursor.execute("""
            UPDATE requests
            SET status='approved'
            WHERE id=%s
            """, (req_id,))

            # reduce food quantity
            cursor.execute("""
            UPDATE menu_items
            SET quantity = quantity - 1
            WHERE id=%s AND quantity > 0
            """, (req["food_id"],))

            # notify customer
            cursor.execute("""
            INSERT INTO notifications
            (user_id,message)
            VALUES (%s,%s)
            """, (
                req["customer_id"],
                "Your request was approved"
            ))

        conn.commit()
        return jsonify({"message": "Approved"})

    finally:
        conn.close()


# =====================================================
# DECLINE REQUEST
# =====================================================

@app.route("/api/decline-request/<int:req_id>", methods=["POST"])
def decline_request(req_id):

    conn = get_db_connection()

    try:
        with conn.cursor() as cursor:

            cursor.execute("""
            SELECT * FROM requests
            WHERE id=%s
            """, (req_id,))

            req = cursor.fetchone()

            if not req:
                return jsonify({"error": "Request not found"}), 404

            cursor.execute("""
            UPDATE requests
            SET status='declined'
            WHERE id=%s
            """, (req_id,))

            cursor.execute("""
            INSERT INTO notifications
            (user_id,message)
            VALUES (%s,%s)
            """, (
                req["customer_id"],
                "Your request was declined"
            ))

        conn.commit()
        return jsonify({"message": "Declined"})

    finally:
        conn.close()


# =====================================================
# USER NOTIFICATIONS
# =====================================================

@app.route("/api/notifications/<int:user_id>")
def notifications(user_id):

    conn = get_db_connection()

    try:
        with conn.cursor() as cursor:

            cursor.execute("""
            SELECT * FROM notifications
            WHERE user_id=%s
            ORDER BY created_at DESC
            """, (user_id,))

            rows = cursor.fetchall()

        return jsonify(rows)

    finally:
        conn.close()
# =====================================================
# MARK NOTIFICATIONS AS READ
# =====================================================

@app.route("/api/mark-notifications-read/<int:user_id>", methods=["POST"])
def mark_notifications_read(user_id):
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB Down"}), 500
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
            UPDATE notifications
            SET is_read = TRUE
            WHERE user_id = %s
            """, (user_id,))
        conn.commit()
        return jsonify({"message": "Notifications marked as read"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()


# =====================================================
# CUSTOMER REQUEST HISTORY
# =====================================================
@app.route("/api/customer-requests/<int:customer_id>", methods=["GET"])
def customer_requests(customer_id):
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB Down"}), 500
    try:
        with conn.cursor() as cursor:
            # We join the requests and menu_items tables together so the 
            # customer can see the food name and restaurant name!
            cursor.execute("""
            SELECT requests.id as req_id, requests.status, requests.created_at, 
                   requests.food_id, menu_items.name, menu_items.restaurant, menu_items.type
            FROM requests
            JOIN menu_items ON requests.food_id = menu_items.id
            WHERE requests.customer_id = %s
            ORDER BY requests.id DESC
            """, (customer_id,))
            
            rows = cursor.fetchall()
            return jsonify(rows)
            
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    finally:
        conn.close()
# =====================================================
# START APP
# =====================================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
