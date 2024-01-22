from flask_testing import TestCase
from index import app  # Import the Flask app from index.py

import json

class MyTest(TestCase):

    def create_app(self):
        app.config['TESTING'] = True
        return app

    def test_extract(self):
        response = self.client.post('/extract', json={"your_key": "your_value"})
        self.assertEqual(response.status_code, 200)
        # Further assertions based on the expected output

    # Similar test methods for other endpoints

if __name__ == '__main__':
    import unittest
    unittest.main()


@app.route('/bare_extraction', methods=['POST'])
def bare_extraction():
    data = request.json
    result = trafilatura.bare_extraction(**data)
    return jsonify(result)

curl -X POST http://localhost:5000/extract -H "Content-Type: application/json" -d '{"filecontent": │
"<html>Your HTML content here</html>"}'  

@app.route('/sitemap_search', methods=['GET'])
def sitemap_search():
    url = request.args.get('url')
    target_lang = request.args.get('target_lang')
    external = request.args.get('external') == 'True'
    result = trafilatura.sitemaps.sitemap_search(url, target_lang, external)
    return jsonify(result)

@app.route('/find_feed_urls', methods=['GET'])
def find_feed_urls():
    url = request.args.get('url')
    target_lang = request.args.get('target_lang')
    external = request.args.get('external') == 'True'
    result = trafilatura.feeds.find_feed_urls(url, target_lang, external)
    return jsonify(result)

@app.route('/focused_crawler', methods=['POST'])
def focused_crawler():
    data = request.json
    result = trafilatura.spider.focused_crawler(**data)
    return jsonify(result)


@app.route('/xmltotxt', methods=['POST'])
def xmltotxt():
    data = request.json
    result = trafilatura.xml.xmltotxt(data['xmloutput'], data['include_formatting'])
    return jsonify(result)

@app.route('/validate_tei', methods=['POST'])
def validate_tei():
    data = request.json
    result = trafilatura.xml.validate_tei(data['xmldoc'])
    return jsonify(result)