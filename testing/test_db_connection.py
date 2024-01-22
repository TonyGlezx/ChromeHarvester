import mysql.connector
import json

# Load database configuration from your JSON file
with open('dbconfig.json') as f:
    db_config = json.load(f)

# Test the connection
try:
    conn = mysql.connector.connect(**db_config)
    print("✔️ Successfully connected to the database")
except mysql.connector.Error as err:
    print(f"❌ Error connecting to database: {err}")
finally:
    if conn.is_connected():
        conn.close()
        print("✔️ Connection closed")
