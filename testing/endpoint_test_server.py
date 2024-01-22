from flask import Flask, request

app = Flask(__name__)

@app.route('/post-data', methods=['POST'])
def post_data():
    data = request.json
    print("Received data:", data)
    return "Data received"

if __name__ == '__main__':
    app.run(debug=True, port=5000)
