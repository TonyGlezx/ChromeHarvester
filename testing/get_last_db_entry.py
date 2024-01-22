import mysql.connector
import json

# Load database configuration
with open('dbconfig.json') as f:
    db_config = json.load(f)

# Connect to the database
conn = mysql.connector.connect(**db_config)
cursor = conn.cursor()

# Query to select the last row
query = "SELECT * FROM tab_data ORDER BY id DESC LIMIT 1"  # Replace 'id' with your auto-increment column name

try:
    cursor.execute(query)
    row = cursor.fetchone()
    print("Last inserted row:", row)
except mysql.connector.Error as err:
    print("Error: ", err)
finally:
    cursor.close()
    conn.close()
