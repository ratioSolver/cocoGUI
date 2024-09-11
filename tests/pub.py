import requests

session = requests.Session()

# Get the type of the rPPG data
rppg_type = session.get('http://localhost:8080/type?name=rPPG')
print(rppg_type.json())
type_id = rppg_type.json()['id']

# Get the rPPG sensors
rppgs = session.get('http://localhost:8080/items?type_id=' + str(type_id))
print(rppgs.json())

# Publish data to the first sensor
response = session.post('http://localhost:8080/data/' + str(rppgs.json()[0]['id']), json={'BR': 27, 'HR': 56, 'SpO2': 95}, headers={'Connection': 'close'})
print(response.status_code)
