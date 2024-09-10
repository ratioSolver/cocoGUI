import sys
import requests

def init_db(url):
    ####################################################################################################################
    # We initialize the knowledge base with the following types and rules:
    #
    # - User type with static properties
    # - Chat type with dynamic properties
    # - Sensor type with dynamic properties
    # - rPPG Sensor type with dynamic properties
    # - WWS Sensor type with dynamic properties
    # - SWF Sensor type with dynamic properties
    # - Garmin Sensor type with dynamic properties
    # - Tablet type with dynamic properties
    # - rPPG reactive rules
    # - WWS reactive rules
    # - SWF reactive rules
    # - Garmin reactive rules
    # - Tablet reactive rules
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
                                                                          'Fall': {'type': 'integer', 'min': 0, 'max': 1},
                                                                          'me': {'type': 'boolean'},
                                                                          'text': {'type': 'string'}}})
    user_type = response.json()
    print(user_type)

    # Create the Kit type
    response = requests.post(url + '/type', json={'name': 'Kit', 'description': 'Kit type',
                                                  'static_properties': {'name': {'type': 'string'}},
                                                  'dynamic_properties': {'user': {'type': 'item', 'type_id': user_type['id']}}})
    kit_type = response.json()
    print(kit_type)

    # Create the Sensor type
    response = requests.post(url + '/type', json={'name': 'Sensor', 'description': 'Sensor type',
                                                  'static_properties': {'name': {'type': 'string'},
                                                                        'kit': {'type': 'item', 'type_id': kit_type['id']}}})
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

    # Create the Tablet type
    response = requests.post(url + '/type', json={'name': 'Tablet', 'description': 'Tablet type',
                                                  'static_properties': {'name': {'type': 'string'},
                                                                        'kit': {'type': 'item', 'type_id': kit_type['id']}},
                                                  'dynamic_properties': {'me': {'type': 'boolean'},
                                                                         'text': {'type': 'string'}}})
    tablet_type = response.json()
    print(tablet_type)

    # Create some reactive rules
    response = requests.post(url + '/reactive_rule', json={'name': 'rppg_rule', 'content': '(defrule rppg_rule (rPPG_has_HR (item_id ?rppg) (HR ?hr) (timestamp ?timestamp)) (rPPG_has_BR (item_id ?rppg) (BR ?br) (timestamp ?timestamp)) (rPPG_has_SpO2 (item_id ?rppg) (SpO2 ?spo2) (timestamp ?timestamp)) (Sensor_kit (item_id ?rppg) (kit ?kit)) (Kit_has_user (item_id ?kit) (user ?user)) => (add_data ?user (create$ HR BR SpO2) (create$ ?hr ?br ?spo2) ?timestamp))'})
    rppg_rule = response.json()
    print(rppg_rule)
    response = requests.post(url + '/reactive_rule', json={'name': 'wws_rule', 'content': '(defrule wws_rule_hr (WWS_has_HR (item_id ?wws) (HR ?hr) (timestamp ?timestamp)) (WWS_has_BR (item_id ?wws) (BR ?br) (timestamp ?timestamp)) (WWS_has_Movement (item_id ?wws) (Movement ?movement) (timestamp ?timestamp)) (WWS_has_SleepAwake (item_id ?wws) (SleepAwake ?sleep_awake) (timestamp ?timestamp)) (WWS_has_Fall (item_id ?wws) (Fall ?fall) (timestamp ?timestamp)) (Sensor_kit (item_id ?wws) (kit ?kit)) (Kit_has_user (item_id ?kit) (user ?user)) => (add_data ?user (create$ HR BR Movement SleepAwake Fall) (create$ ?hr ?br ?movement ?sleep_awake ?fall) ?timestamp))'})
    wws_rule = response.json()
    print(wws_rule)
    response = requests.post(url + '/reactive_rule', json={'name': 'swf_rule', 'content': '(defrule swf_rule (SWF_has_Fall (item_id ?swf) (Fall ?fall) (timestamp ?timestamp)) (Sensor_kit (item_id ?swf) (kit ?kit)) (Kit_has_user (item_id ?kit) (user ?user)) => (add_data ?user (create$ Fall) (create$ ?fall) ?timestamp))'})
    swf_rule = response.json()
    print(swf_rule)
    response = requests.post(url + '/reactive_rule', json={'name': 'garmin_rule', 'content': '(defrule garmin_rule (Garmin_has_HR (item_id ?garmin) (HR ?hr) (timestamp ?timestamp)) (Garmin_has_BR (item_id ?garmin) (BR ?br) (timestamp ?timestamp)) (Garmin_has_Movement (item_id ?garmin) (Movement ?movement) (timestamp ?timestamp)) (Sensor_kit (item_id ?garmin) (kit ?kit)) (Kit_has_user (item_id ?kit) (user ?user)) => (add_data ?user (create$ HR BR Movement) (create$ ?hr ?br ?movement) ?timestamp))'})
    garmin_rule = response.json()
    print(garmin_rule)
    response = requests.post(url + '/reactive_rule', json={'name': 'tablet_rule', 'content': '(defrule tablet_rule (Tablet_has_me (item_id ?tablet) (me TRUE) (timestamp ?timestamp)) (Tablet_has_text (item_id ?tablet) (text ?text) (timestamp ?timestamp)) (Tablet_kit (item_id ?tablet) (kit ?kit)) (Kit_has_user (item_id ?kit) (user ?user)) => (add_data ?user (create$ me text) (create$ TRUE ?text) ?timestamp))'})
    tablet_rule = response.json()
    print(tablet_rule)
    response = requests.post(url + '/reactive_rule', json={'name': 'user_rule_true', 'content': '(defrule user_rule_true (User_has_me (item_id ?user) (me TRUE) (timestamp ?timestamp)) (User_has_text (item_id ?user) (text ?text) (timestamp ?timestamp)) => (compute_response ?user ?text))'})
    user_rule = response.json()
    print(user_rule)
    response = requests.post(url + '/reactive_rule', json={'name': 'user_rule_false', 'content': '(defrule user_rule_false (User_has_me (item_id ?user) (me FALSE) (timestamp ?timestamp)) (User_has_text (item_id ?user) (text ?text) (timestamp ?timestamp)) (Tablet_kit (item_id ?tablet) (kit ?kit)) (Kit_has_user (item_id ?kit) (user ?user)) => (add_data ?tablet (create$ me text) (create$ FALSE ?text) ?timestamp))'})
    user_rule = response.json()
    print(user_rule)

    ####################################################################################################################
    #
    # We create some users, kits, sensors and tablets
    #
    ####################################################################################################################

    # Create some users
    response = requests.post(url + '/item', json={'type': user_type['id'], 'properties': {'name': 'Alice', 'gender': 'F'}})
    alice = response.json()
    print(alice)
    response = requests.post(url + '/item', json={'type': user_type['id'], 'properties': {'name': 'Bob', 'gender': 'M'}})
    bob = response.json()
    print(bob)

    # Create some kits
    response = requests.post(url + '/item', json={'type': kit_type['id'], 'properties': {'name': 'kit1'}})
    kit1 = response.json()
    print(kit1)
    response = requests.post(url + '/item', json={'type': kit_type['id'], 'properties': {'name': 'kit2'}})
    kit2 = response.json()
    print(kit2)

    # Create some sensors
    response = requests.post(url + '/item', json={'type': rppg_sensor_type['id'], 'properties': {'name': 'rppg1', 'kit': kit1['id']}})
    rppg1 = response.json()
    print(rppg1)
    response = requests.post(url + '/item', json={'type': wws_sensor_type['id'], 'properties': {'name': 'wws1', 'kit': kit1['id']}})
    wws1 = response.json()
    print(wws1)
    response = requests.post(url + '/item', json={'type': swf_sensor_type['id'], 'properties': {'name': 'swf1', 'kit': kit2['id']}})
    swf1 = response.json()
    print(swf1)
    response = requests.post(url + '/item', json={'type': garmin_sensor_type['id'], 'properties': {'name': 'garmin1', 'kit': kit2['id']}})
    garmin1 = response.json()
    print(garmin1)

    # Create some tablets
    response = requests.post(url + '/item', json={'type': tablet_type['id'], 'properties': {'name': 'tablet1', 'kit': kit1['id']}})
    tablet1 = response.json()
    print(tablet1)

if __name__ == '__main__':
    url = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8080'
    init_db(url)