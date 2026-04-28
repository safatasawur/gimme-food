import pymysql

conn = pymysql.connect(
    host="metro.proxy.rlwy.net",
    user="root",
    password="ZuOfBdZfwqPvthhVbSnCNgBoFRkVmwbg",
    database="railway",
    port=41339
)

cursor = conn.cursor()

with open("schema.sql", "r", encoding="utf-8") as f:
    sql = f.read()

for statement in sql.split(";"):
    if statement.strip():
        cursor.execute(statement)

conn.commit()
cursor.close()
conn.close()

print("done")
