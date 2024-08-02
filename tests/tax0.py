import sys
import requests

def init_db(url):
    ####################################################################################################################
    # We initialize the knowledge base with the following types and rules:
    #
    # - User type with static properties
    # - Kit type with dynamic properties
    # - Sensor type with dynamic properties
    # - rPPG Sensor type with dynamic properties
    # - WWS Sensor type with dynamic properties
    # - SWF Sensor type with dynamic properties
    # - Garmin Sensor type with dynamic properties
    # - rPPG reactive rules
    # - WWS reactive rules
    # - SWF reactive rules
    # - Garmin reactive rules
    #
    ####################################################################################################################

    # Create the User type
    response = requests.post(url + '/type', json={'name': 'User', 'description': 'User type',
                                                  'static_properties': {'name': {'type': 'string'},
                                                                        'gender': {'type': 'symbol', 'values': ['M', 'F']}},
                                                   'dynamic_properties': {'HR': {'type': 'integer', 'min': 40, 'max': 220},
                                                                          'BR': {'type': 'integer', 'min': 7, 'max': 30},
                                                                          'SpO2': {'type': 'integer', 'min': 0, 'max': 100},
                                                                          'Movement': {'type': 'symbol', 'values': ['Basso', 'Medio', 'Alto']},
                                                                          'SleepAwake': {'type': 'symbol', 'values': ['Awake', 'Sleep']},
                                                                          'Fall': {'type': 'integer', 'min': 0, 'max': 1}}})
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
                                                                         'SleepAwake': {'type': 'symbol', 'values': ['Awake', 'Sleep']},
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

    # Create some reactive rules
    response = requests.post(url + '/reactive_rule', json={'name': 'rppg_rule_hr', 'content': '(defrule rppg_rule_hr (rPPG_has_HR (item_id ?item_id) (HR ?hr) (timestamp ?timestamp)) (Sensor_kit (item_id ?item_id) (kit ?kit)) (Kit_has_user (item_id ?kit) (user ?user)) => (add_data ?user (create$ HR) (create$ ?hr) ?timestamp))'})
    rppg_rule = response.json()
    print(rppg_rule)
    response = requests.post(url + '/reactive_rule', json={'name': 'rppg_rule_br', 'content': '(defrule rppg_rule_br (rPPG_has_BR (item_id ?item_id) (BR ?br) (timestamp ?timestamp)) (Sensor_kit (item_id ?item_id) (kit ?kit)) (Kit_has_user (item_id ?kit) (user ?user)) => (add_data ?user (create$ BR) (create$ ?br) ?timestamp))'})
    rppg_rule = response.json()
    print(rppg_rule)
    response = requests.post(url + '/reactive_rule', json={'name': 'rppg_rule_spo2', 'content': '(defrule rppg_rule_spo2 (rPPG_has_SpO2 (item_id ?item_id) (SpO2 ?spo2) (timestamp ?timestamp)) (Sensor_kit (item_id ?item_id) (kit ?kit)) (Kit_has_user (item_id ?kit) (user ?user)) => (add_data ?user (create$ SpO2) (create$ ?spo2) ?timestamp))'})
    rppg_rule = response.json()
    print(rppg_rule)
    response = requests.post(url + '/reactive_rule', json={'name': 'wws_rule_hr', 'content': '(defrule wws_rule_hr (WWS_has_HR (item_id ?item_id) (HR ?hr) (timestamp ?timestamp)) (Sensor_kit (item_id ?item_id) (kit ?kit)) (Kit_has_user (item_id ?kit) (user ?user)) => (add_data ?user (create$ HR) (create$ ?hr) ?timestamp))'})
    wws_rule = response.json()
    print(wws_rule)
    response = requests.post(url + '/reactive_rule', json={'name': 'wws_rule_br', 'content': '(defrule wws_rule_br (WWS_has_BR (item_id ?item_id) (BR ?br) (timestamp ?timestamp)) (Sensor_kit (item_id ?item_id) (kit ?kit)) (Kit_has_user (item_id ?kit) (user ?user)) => (add_data ?user (create$ BR) (create$ ?br) ?timestamp))'})
    wws_rule = response.json()
    print(wws_rule)
    response = requests.post(url + '/reactive_rule', json={'name': 'wws_rule_movement', 'content': '(defrule wws_rule_movement (WWS_has_Movement (item_id ?item_id) (Movement ?movement) (timestamp ?timestamp)) (Sensor_kit (item_id ?item_id) (kit ?kit)) (Kit_has_user (item_id ?kit) (user ?user)) => (add_data ?user (create$ Movement) (create$ ?movement) ?timestamp))'})
    wws_rule = response.json()
    print(wws_rule)
    response = requests.post(url + '/reactive_rule', json={'name': 'wws_rule_sleep_awake', 'content': '(defrule wws_rule_sleep_awake (WWS_has_SleepAwake (item_id ?item_id) (SleepAwake ?sleep_awake) (timestamp ?timestamp)) (Sensor_kit (item_id ?item_id) (kit ?kit)) (Kit_has_user (item_id ?kit) (user ?user)) => (add_data ?user (create$ SleepAwake) (create$ ?sleep_awake) ?timestamp))'})
    wws_rule = response.json()
    print(wws_rule)
    response = requests.post(url + '/reactive_rule', json={'name': 'wws_rule_fall', 'content': '(defrule wws_rule_fall (WWS_has_Fall (item_id ?item_id) (Fall ?fall) (timestamp ?timestamp)) (Sensor_kit (item_id ?item_id) (kit ?kit)) (Kit_has_user (item_id ?kit) (user ?user)) => (add_data ?user (create$ Fall) (create$ ?fall) ?timestamp))'})
    wws_rule = response.json()
    print(wws_rule)
    response = requests.post(url + '/reactive_rule', json={'name': 'swf_rule_fall', 'content': '(defrule swf_rule_fall (SWF_has_Fall (item_id ?item_id) (Fall ?fall) (timestamp ?timestamp)) (Sensor_kit (item_id ?item_id) (kit ?kit)) (Kit_has_user (item_id ?kit) (user ?user)) => (add_data ?user (create$ Fall) (create$ ?fall) ?timestamp))'})
    swf_rule = response.json()
    print(swf_rule)
    response = requests.post(url + '/reactive_rule', json={'name': 'garmin_rule_hr', 'content': '(defrule garmin_rule_hr (Garmin_has_HR (item_id ?item_id) (HR ?hr) (timestamp ?timestamp)) (Sensor_kit (item_id ?item_id) (kit ?kit)) (Kit_has_user (item_id ?kit) (user ?user)) => (add_data ?user (create$ HR) (create$ ?hr) ?timestamp))'})
    garmin_rule = response.json()
    print(garmin_rule)
    response = requests.post(url + '/reactive_rule', json={'name': 'garmin_rule_br', 'content': '(defrule garmin_rule_br (Garmin_has_BR (item_id ?item_id) (BR ?br) (timestamp ?timestamp)) (Sensor_kit (item_id ?item_id) (kit ?kit)) (Kit_has_user (item_id ?kit) (user ?user)) => (add_data ?user (create$ BR) (create$ ?br) ?timestamp))'})
    garmin_rule = response.json()
    print(garmin_rule)
    response = requests.post(url + '/reactive_rule', json={'name': 'garmin_rule_movement', 'content': '(defrule garmin_rule_movement (Garmin_has_Movement (item_id ?item_id) (Movement ?movement) (timestamp ?timestamp)) (Sensor_kit (item_id ?item_id) (kit ?kit)) (Kit_has_user (item_id ?kit) (user ?user)) => (add_data ?user (create$ Movement) (create$ ?movement) ?timestamp))'})
    garmin_rule = response.json()
    print(garmin_rule)

    ####################################################################################################################
    #
    # We create some users, kits and sensors
    #
    ####################################################################################################################

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