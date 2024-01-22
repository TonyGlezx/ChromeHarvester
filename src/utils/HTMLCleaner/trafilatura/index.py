# TO DO

# Parameter Handling

# Error Handling

# Security

# Performance

# Testing and Validation

from flask import Flask, request, jsonify
import trafilatura
from lxml import etree, html  # Ensure lxml is installed
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, T5Tokenizer
import torch

import toml
import re

from pathlib import Path
import gpt4all.gpt4all

gpt4all.gpt4all.DEFAULT_MODEL_DIRECTORY = Path.home() / '.config' / 'ch'


from gpt4all import GPT4All





app = Flask(__name__)

# Load FLAN-T5 model
tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-large")
#model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-large")
model = GPT4All("mistral-7b-instruct-v0.1.Q4_0.gguf")

@app.route('/extract', methods=['POST'])
def extract():
    data = request.json
    # Pass data as keyword arguments
    result = trafilatura.extract(**data)
    return jsonify(result)

@app.route('/baseline', methods=['POST'])
def baseline():
    data = request.json
    filecontent = data['filecontent']
    extracted_element, extracted_text, text_length = trafilatura.baseline(filecontent)
    
    # Convert extracted text to a JSON-serializable format
    result = {
        'extracted_text': extracted_text,
        'text_length': text_length
    }
    return jsonify(result)


@app.route('/html2txt', methods=['POST'])
def html2txt():
    data = request.json
    result = trafilatura.html2txt(data['content'])
    return jsonify(result)

@app.route('/try_readability', methods=['POST'])
def try_readability():
    data = request.json
    element = trafilatura.external.try_readability(data['htmlinput'])

    # Convert the LXML element to a string
    result = etree.tostring(element, pretty_print=True, method="html").decode()
    
    return jsonify({'result': result})

@app.route('/try_justext', methods=['POST'])
def try_justext():
    data = request.json
    tree = html.fromstring(data['tree'])
    result = trafilatura.external.try_justext(tree, data['url'], data['target_language'])

    # Convert the result to a string
    result_string = etree.tostring(result, pretty_print=True, method="html").decode()

    return jsonify({'result': result_string})

@app.route('/extract_metadata', methods=['POST'])
def extract_metadata():
    data = request.json
    document = trafilatura.extract_metadata(**data)

    # Convert the Document object to a dictionary
    if document:
        result = document.as_dict()
    else:
        result = None

    return jsonify(result)


@app.route('/extract_comments', methods=['POST'])
def extract_comments():
    data = request.json
    result = trafilatura.core.extract_comments(**data)
    return jsonify(result)


@app.route('/fetch_url', methods=['GET'])
def fetch_url():
    url = request.args.get('url')
    decode = request.args.get('decode') == 'True'
    no_ssl = request.args.get('no_ssl') == 'True'
    html_content = trafilatura.fetch_url(url, decode, no_ssl)

    # Return the HTML content directly
    return html_content, 200, {'Content-Type': 'text/html; charset=utf-8'}



def match_form_fields(form_elements, toml_path=".config.toml"):
    """ Match form fields with values from TOML data. """
    with open(toml_path, 'r') as file:
        toml_data = toml.load(file)
    matched_fields = {}
    first_or_last_name_matched = False
    full_name_matched = False
    message_matched = False

    for field, info in toml_data.items():
        value = info['value']
        name_regex_list = info['name_regex']

        for element in form_elements:
            if any(re.search(pattern, element['name']) for pattern in name_regex_list):
                matched_fields[field] = value
                if field in ["first_name", "last_name"]:
                    first_or_last_name_matched = True
                elif field == "full_name":
                    full_name_matched = True
                elif field == "message":
                    message_matched = True
                break

    # Check the specific conditions for a valid contact form
    if not ((first_or_last_name_matched and message_matched) or (full_name_matched and message_matched)):
        return "Not valid contact form"

    return matched_fields


@app.route('/match-fields', methods=['POST'])
def match_fields_endpoint():
    # Expecting JSON data with 'form_elements' key
    data = request.json
    form_elements = data.get('form_elements', [])

    # Validate the input
    if not form_elements or not isinstance(form_elements, list):
        return jsonify({"error": "Invalid input"}), 400

    result = match_form_fields(form_elements)

    # Check if the result is a string message or matched fields
    if isinstance(result, str):
        return jsonify({"message": result}), 400
    else:
        return jsonify({"matched_fields": result}), 200

@app.route('/flan-t5', methods=['POST'])
def query_flan_t5():
    # Extract text from the request
    text = request.json.get('text')

    # Make sure text is provided
    if not text:
        return jsonify({'error': 'No text provided'}), 400

    # Process the text with FLAN-T5
    inputs = tokenizer.encode("translate English to French: " + text, return_tensors="pt")
    with torch.no_grad():
        outputs = model.generate(inputs)

    # Decode and return the response
    response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return jsonify({'response': response_text})




@app.route('/mistral', methods=['POST'])
def query_mistral():
    # Extract text from the request
    text = request.json.get('text')

    print("Pinged mistral")
    print(text)

    # Make sure text is provided
    if not text:
        return jsonify({'error': 'No text provided'}), 400

    # Process the text with FLAN-T5
    
    
    outputs = model.generate(text, max_tokens=100)

    # Decode and return the response
    
    return jsonify({'response': "hello world"})


 


def tokenize_text(text, model_name="t5-base"):
    tokenizer = T5Tokenizer.from_pretrained(model_name)
    tokens = tokenizer.encode(text, add_special_tokens=True)
    return tokens, len(tokens)

@app.route('/tokens-number', methods=['POST'])
def tokens_number_endpoint():
    data = request.get_json()

    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400

    text = data['text']
    _, token_count = tokenize_text(text)
    print(_)

    return jsonify({'token_count': token_count})

@app.route('/tokenize', methods=['POST'])
def tokenize_endpoint():
    data = request.get_json()

    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400

    text = data['text']
    _, token_count = tokenize_text(text)
    

    return jsonify({'tokens': _})

@app.route('/untokenize', methods=['POST'])
def untokenize_endpoint():
    data = request.get_json()

    if not data or 'tokens' not in data:
        return jsonify({'error': 'No tokens provided'}), 400
    tokens = data['tokens']
    _ = tokenizer.convert_tokens_to_string(tokenizer.convert_ids_to_tokens(tokens))
    return jsonify({'text': _})




if __name__ == '__main__':
    app.run(debug=True, port=8080)
