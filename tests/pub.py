import sys
import requests

def publish_rppg(url, br, hr, spo2):
    session = requests.Session()

    # Get the type of the rPPG data
    rppg_type = session.get(url + '/type?name=rPPG')
    print(rppg_type.json())
    type_id = rppg_type.json()['id']

    # Get the rPPG sensors
    rppgs = session.get(url + '/items?type_id=' + str(type_id))
    print(rppgs.json())

    # Publish data to the first sensor
    response = session.post(url + '/data/' + str(rppgs.json()[0]['id']), json={'BR': br, 'HR': hr, 'SpO2': spo2}, headers={'Connection': 'close'})
    print(response.status_code)

if __name__ == '__main__':
    url = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8080'
    publish_rppg(url, 15, 60, 98)