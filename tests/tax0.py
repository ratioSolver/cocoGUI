import requests

url = 'http://localhost:8081'

response = requests.post(url + '/types', json={'name': 'User', 'description': 'User type'})
user_type = response.json()

response = requests.post(url + '/types', json={'name': 'Kit', 'description': 'Kit type'})
kit_type = response.json()

response = requests.post(url + '/types', json={'name': 'Sensor', 'description': 'Sensor type'})
sensor_type = response.json()