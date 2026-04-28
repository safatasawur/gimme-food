from flask import Flask
import pymysql

app = Flask(__name__)

@app.route("/")
def home():
    return "OK"


@app.route("/test-db")
def test_db():
    conn = pymysql.connect(
        host="metro.proxy.rlwy.net",
        port=41339,
        user="root",
        password="ZuOfBdZfwqPvthhVbSnCNgBoFRkVmwbg",
        database="railway",
        ssl={"ssl": {}}
    )

    cur = conn.cursor()
    cur.execute("SELECT 1")
    result = cur.fetchone()

    cur.close()
    conn.close()

    return str(result)
