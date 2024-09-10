import requests

response = requests.post('http://localhost:8080/data/66e05127a9eb5bf9b1023e54', json={'BR': 25, 'HR': 55, 'SpO2': 95}, headers={'Connection': 'close'})
print(response.status_code)
