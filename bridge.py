import mysql.connector
from flask import Flask, jsonify, request
from flask_cors import CORS

# flask is the web framework that creates the actual server
# it listens for requests from the frontend (like when a button is clicked)
app = Flask(__name__)

# cors stands for cross-origin resource sharing
# this allows your frontend files to safely talk to your backend script
CORS(app)

# db_config is a dictionary containing all the credentials for the database
# these details act like a 'login' for the python script to enter the sql server
db_config = {
    'host': '192.168.1.10',   # the specific network address of the sql computer
    'user': 'your_user',      # the username granted permission to access the data
    'password': 'your_password', # the secret key associated with that user
    'database': 'your_db'     # the specific database name within the sql server
}

def query_db(query, args=(), one=False):
    """
    this helper function manages the lifecycle of a database query.
    it handles connecting, executing the command, and cleaning up.
    """
    # this line initiates the digital 'handshake' with the mysql server
    conn = mysql.connector.connect(**db_config)
    
    # a cursor is like a digital pointer that executes the sql commands
    # setting dictionary=true ensures the results look like javascript objects
    cur = conn.cursor(dictionary=True)
    
    # execute takes the sql command and injects the variables safely
    # this prevents 'sql injection' which is a common security vulnerability
    cur.execute(query, args)
    
    # fetchall retrieves every row that matches the query request
    rv = cur.fetchall()
    
    # commit is necessary for commands that change data (insert/update)
    # it ensures the changes are permanently saved in the sql storage
    conn.commit()
    
    # closing the cursor and connection releases system resources
    # this keeps the computer's memory clean and prevents lag
    cur.close()
    conn.close()
    
    # if 'one' is true, it returns only the first item instead of a list
    return (rv[0] if rv else None) if one else rv

# --- api endpoints (the 'bridges') ---

@app.route('/api/food', methods=['GET'])



def get_all_food():
    """
    this is the 'read' bridge. 
    it fetches all available food items to display on the customer page.
    """
    # query_db runs the selection command on the 'food' table
    results = query_db("select * from food")
    
    # jsonify turns the python list into a format the web browser understands
    return jsonify(results)

@app.route('/api/signup', methods=['POST'])
def signup_user():
    """
    this is the 'write' bridge.
    it takes user data from the browser and inserts it into the database.
    """
    # request.json captures the data packets sent from the frontend javascript
    data = request.json
    try:
        # the %s acts as a secure placeholder for the user's personal details
        query_db(
            "insert into users (name, email, password, role, address) values (%s, %s, %s, %s, %s)",
            (data['name'], data['email'], data['password'], data['role'], data['address'])
        )
        # 201 is the standard success code for creating a new resource
        return jsonify({"message": "success"}), 201
    except Exception as e:
        # if the database rejects the data, we send back the error message
        return jsonify({"error": str(e)}), 400

@app.route('/api/request-food', methods=['POST'])
def process_request():
    """
    this is the 'update' bridge.
    it decrements the quantity of food when a user successfully claims it.
    """
    # we get the specific item id from the frontend team's request
    data = request.json
    
    # this sql command updates the inventory in real-time
    # the 'quantity > 0' check prevents the count from going into negatives
    query_db("update food set quantity = quantity - 1 where id = %s and quantity > 0", (data['id'],))
    
    return jsonify({"status": "updated"}), 200

# this block ensures the server only starts if this script is run directly
if __name__ == '__main__':
    # debug=true allows the script to reload automatically when you save changes
    # port 5000 is the default channel for flask communications
    app.run(debug=True, port=5000)
