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