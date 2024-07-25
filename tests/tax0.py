import requests

url = 'http://localhost:8081'

# Create the User type
response = requests.post(url + '/types', json={'name': 'User', 'description': 'User type',
                                               'static_properties': {'first_name': {'type': 'string'},
                                                                     'last_name': {'type': 'string'}}})
user_type = response.json()

# Create the Kit type
response = requests.post(url + '/types', json={'name': 'Kit', 'description': 'Kit type'})
kit_type = response.json()

# Create the Sensor type
response = requests.post(url + '/types', json={'name': 'Sensor', 'description': 'Sensor type'})
sensor_type = response.json()

# Add the Sensor type as a static property of the Kit type and the User type as a dynamic property
kit_type['static_properties'] = {'sensor': {'type': 'item', 'item_type': sensor_type['id']}}
kit_type['dynamic_properties'] = {'user': {'type': 'item', 'item_type': user_type['id']}}
response = requests.put(url + '/types/' + kit_type['id'], kit_type)

# Create a rPPG Sensor type
response = requests.post(url + '/types', json={'name': 'rPPG Sensor', 'description': 'rPPG Sensor type', 'parents': [sensor_type['id']],
                                               'dynamic_properties': {'HR': {'type': 'integer', 'min': 48, 'max': 180},
                                                                      'BR': {'type': 'integer', 'min': 7, 'max': 30},
                                                                      'SpO2': {'type': 'integer', 'min': 0, 'max': 100}}})
rppg_sensor_type = response.json()

# Create a WWS Sensor type
response = requests.post(url + '/types', json={'name': 'WWS Sensor', 'description': 'WWS Sensor type', 'parents': [sensor_type['id']],
                                               'dynamic_properties': {'HR': {'type': 'integer', 'min': 40, 'max': 220},
                                                                      'BR': {'type': 'integer', 'min': 7, 'max': 30},
                                                                      'Movement': {'type': 'symbol', 'values': ['Basso', 'Medio', 'Alto']},
                                                                      'Sleep/Awake': {'type': 'symbol', 'values': ['Awake', 'Sleep']},
                                                                      'Fall': {'type': 'integer', 'min': 0, 'max': 1}}})
wws_sensor_type = response.json()

# Create a SWF Sensor type
response = requests.post(url + '/types', json={'name': 'SWF Sensor', 'description': 'SWF Sensor type', 'parents': [sensor_type['id']],
                                               'dynamic_properties': {'Fall': {'type': 'integer', 'min': 0, 'max': 1}}})
swf_sensor_type = response.json()
