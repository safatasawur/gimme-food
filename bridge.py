import sqlite3
from flask import Flask, jsonify, request
from flask_cors import CORS

# initialize the flask application
app = Flask(__name__)

# enable cors so the frontend team can access this api from their browsers
CORS(app)

# path to the database file provided by the sql team
db_path = "foodsaver.db"

def query_db(query, args=(), one=False):
    """
    utility function to run sql commands.
    it opens a connection, executes the query, and returns results as dictionaries.
    """
    conn = sqlite3.connect(db_path)
    # this line allows us to access data by column names (e.g., row['name'])
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(query, args)
    rv = cur.fetchall()
    conn.commit()
    conn.close()
    # return a single result or a list of results
    return (rv[0] if rv else None) if one else rv

# --- endpoints for the frontend team ---

@app.route('/api/food', methods=['GET'])
def get_all_food():
    """
    this is the 'get' bridge. 
    the frontend calls this to populate the food cards on the website.
    it fetches every row from the sql team's 'food' table.
    """
    results = query_db("select * from food")
    # convert sql objects into a json format the frontend team can read
    return jsonify([dict(row) for row in results])

@app.route('/api/signup', methods=['POST'])
def signup_user():
    """
    this is the 'post' bridge for new users.
    it takes the data from the frontend signup form and pushes it into sql.
    """
    data = request.json
    try:
        # insert user data into the sql team's 'users' table
        query_db(
            "insert into users (name, email, password, role, address) values (?, ?, ?, ?, ?)",
            (data['name'], data['email'], data['password'], data['role'], data['address'])
        )
        return jsonify({"message": "user successfully saved to sql database"}), 201
    except Exception as e:
        # if the sql team's table is missing or data is wrong, return the error
        return jsonify({"error": str(e)}), 400

@app.route('/api/request-food', methods=['POST'])
def process_request():
    """
    this bridge handles the transaction when a customer clicks 'request'.
    it tells the sql database to decrease the quantity of an item by 1.
    """
    data = request.json
    # update the food table only if there is stock left (quantity > 0)
    query_db("update food set quantity = quantity - 1 where id = ? and quantity > 0", (data['id'],))
    return jsonify({"status": "inventory updated in sql"}), 200

# start the bridge server
if __name__ == '__main__':
    # the server runs on http://127.0.0.1:5000
    app.run(debug=True, port=5000)


# flask is a lightweight python framework that acts as the server-side 
# engine for our app, handling requests from the website and sending back data. 
# sqlite is a simple, file-based database that stores all actual information
# like user accounts and food inventory, in a single permanent file. together, they 
# form the backend bridge. flask listens for actions on the frontend and tells sqlite 
# when to save or retrieve data ensuring nothing is lost when the browser is closed.

