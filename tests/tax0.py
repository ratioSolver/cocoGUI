import sys
import requests

def init_db(url):
    # Create the User type
    response = requests.post(url + '/type', json={'name': 'User', 'description': 'User type',
                                                  'static_properties': {'name': {'type': 'string'},
                                                                        'gender': {'type': 'symbol', 'values': ['M', 'F']}}})
    user_type = response.json()
    print(user_type)

    # Create the Kit type
    response = requests.post(url + '/type', json={'name': 'Kit', 'description': 'Kit type',
                                                  'dynamic_properties': {'user': {'type': 'item', 'type_id': user_type['id']}}})
    kit_type = response.json()
    print(kit_type)

    # Create the Sensor type
    response = requests.post(url + '/type', json={'name': 'Sensor', 'description': 'Sensor type',
                                                  'static_properties': {'kit': {'type': 'item', 'type_id': kit_type['id']}}})
    sensor_type = response.json()
    print(sensor_type)

    # Create a rPPG Sensor type
    response = requests.post(url + '/type', json={'name': 'rPPG', 'description': 'rPPG Sensor type', 'parents': [sensor_type['id']],
                                                  'dynamic_properties': {'HR': {'type': 'integer', 'min': 48, 'max': 180},
                                                                         'BR': {'type': 'integer', 'min': 7, 'max': 30},
                                                                         'SpO2': {'type': 'integer', 'min': 0, 'max': 100}}})
    rppg_sensor_type = response.json()
    print(rppg_sensor_type)

    # Create a WWS Sensor type
    response = requests.post(url + '/type', json={'name': 'WWS', 'description': 'WWS Sensor type', 'parents': [sensor_type['id']],
                                                  'dynamic_properties': {'HR': {'type': 'integer', 'min': 40, 'max': 220},
                                                                         'BR': {'type': 'integer', 'min': 7, 'max': 30},
                                                                         'Movement': {'type': 'symbol', 'values': ['Basso', 'Medio', 'Alto']},
                                                                         'Sleep/Awake': {'type': 'symbol', 'values': ['Awake', 'Sleep']},
                                                                         'Fall': {'type': 'integer', 'min': 0, 'max': 1}}})
    wws_sensor_type = response.json()
    print(wws_sensor_type)

    # Create a SWF Sensor type
    response = requests.post(url + '/type', json={'name': 'SWF', 'description': 'SWF Sensor type', 'parents': [sensor_type['id']],
                                                  'dynamic_properties': {'Fall': {'type': 'integer', 'min': 0, 'max': 1}}})
    swf_sensor_type = response.json()
    print(swf_sensor_type)

    # Create a Garmin Sensor type
    response = requests.post(url + '/type', json={'name': 'Garmin', 'description': 'Garmin Sensor type', 'parents': [sensor_type['id']],
                                                  'dynamic_properties': {'HR': {'type': 'integer', 'min': 40, 'max': 220},
                                                                         'BR': {'type': 'integer', 'min': 7, 'max': 30},
                                                                         'Movement': {'type': 'symbol', 'values': ['Basso', 'Medio', 'Alto']}}})
    garmin_sensor_type = response.json()
    print(garmin_sensor_type)

    # Create some users
    response = requests.post(url + '/item', json={'type': user_type['id'], 'name': 'alice@ageit.it', 'properties': {'name': 'Alice', 'gender': 'F'}})
    alice = response.json()
    print(alice)
    response = requests.post(url + '/item', json={'type': user_type['id'], 'name': 'bob@ageit.it', 'properties': {'name': 'Bob', 'gender': 'M'}})
    bob = response.json()
    print(bob)

    # Create some kits
    response = requests.post(url + '/item', json={'type': kit_type['id'], 'name': 'kit1'})
    kit1 = response.json()
    print(kit1)
    response = requests.post(url + '/item', json={'type': kit_type['id'], 'name': 'kit2'})
    kit2 = response.json()
    print(kit2)

    # Create some sensors
    response = requests.post(url + '/item', json={'type': rppg_sensor_type['id'], 'name': 'rppg1', 'properties': {'kit': kit1['id']}})
    rppg1 = response.json()
    print(rppg1)
    response = requests.post(url + '/item', json={'type': wws_sensor_type['id'], 'name': 'wws1', 'properties': {'kit': kit1['id']}})
    wws1 = response.json()
    print(wws1)
    response = requests.post(url + '/item', json={'type': swf_sensor_type['id'], 'name': 'swf1', 'properties': {'kit': kit2['id']}})
    swf1 = response.json()
    print(swf1)
    response = requests.post(url + '/item', json={'type': garmin_sensor_type['id'], 'name': 'garmin1', 'properties': {'kit': kit2['id']}})
    garmin1 = response.json()
    print(garmin1)


if __name__ == '__main__':
    url = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8081'
    init_db(url)