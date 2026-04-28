from flask import Flask
from flask_sqlalchemy import SQLAlchemy


app=Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"]="mysql+pymysql://root:PASSWORD@metro.proxy.rlwy.net:41339/railway"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"]=False

db=SQLAlchemy(app)

@app.route("/")
def home():
    return "OK"

@app.route("/test-db")
def test_db():
    return "DB SETUP OK"

if __name__=="__main__":
    app.run(debug=True)

    from flask import Flask
import pymysql
import os

app = Flask(__name__)

@app.route("/init-db")
def init_db():
    conn = pymysql.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()

    with open("schema.sql", "r", encoding="utf-8") as f:
        sql = f.read()

    for stmt in sql.split(";"):
        if stmt.strip():
            cur.execute(stmt)

    conn.commit()
    cur.close()
    conn.close()

    return "DB initialized"

@app.route("/test-db")
def test_db():
    import pymysql, os

    conn = pymysql.connect(
        host="metro.proxy.rlwy.net",
        port=41339,
        user="root",
        password="...",
        database="railway",
        ssl={"ssl": {}}
    )

    cur = conn.cursor()
    cur.execute("SELECT 1")
    return str(cur.fetchone())


