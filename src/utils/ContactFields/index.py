import toml
import re

def load_toml_data(file_path):
    """ Load and parse the TOML file. """
    with open(file_path, 'r') as file:
        return toml.load(file)

def match_form_fields(toml_data, form_elements):
    """ Match form fields with values from TOML data. """
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

# Example usage
toml_data = load_toml_data('.config.toml')
form_elements = [{'name': 'first_name'}, {'name': 'email_address'}, {'name': 'message'}]  # Replace with actual form elements
result = match_form_fields(toml_data, form_elements)

if isinstance(result, dict):
    print("Matched fields:", result)
else:
    print(result)
