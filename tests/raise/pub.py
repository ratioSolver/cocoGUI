import sys
import requests
import logging
import warnings
from urllib3.exceptions import InsecureRequestWarning
from faker import Faker
import random
import time

# Suppress InsecureRequestWarning from urllib3
warnings.filterwarnings('ignore', category=InsecureRequestWarning)

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.DEBUG)
logger.addHandler(handler)

fake = Faker('it_IT')

items = {}

def get_token(session, url, username, password):
    login_response = session.post(url + '/login', json={'username': username, 'password': password}, verify=False)
    if login_response.status_code != 200:
        logger.error(login_response.json())
        return
    logger.info('Logged in as %s', username)
    return login_response.json()['token']

def get_type_by_name(session, url, token, type_name):
    response = session.get(url + '/type?name=' + type_name, headers={'Authorization': 'Bearer ' + token}, verify=False)
    if response.status_code != 200:
        logger.error(response.json())
        return
    return response.json()

def get_type_by_id(session, url, token, type_id):
    response = session.get(url + '/type/' + type_id, headers={'Authorization': 'Bearer ' + token}, verify=False)
    if response.status_code != 200:
        logger.error(response.json())
        return
    return response.json()

def get_items(session, url, token, type_id):
    if type_id in items:
        return items[type_id]
    response = session.get(url + '/items?type_id=' + type_id, headers={'Authorization': 'Bearer ' + token}, verify=False)
    if response.status_code != 200:
        logger.error(response.json())
        return
    items[type_id] = response.json()
    return items[type_id]

def get_dynamic_properties(session, url, token, type_id):
    dynamic_properties = {}
    tp = get_type_by_id(session, url, token, type_id)
    for key, value in tp['dynamic_properties'].items():
        dynamic_properties[key] = value
    if 'parents' in tp:
        for parent in tp['parents']:
            parent_dynamic_properties = get_dynamic_properties(session, url, token, parent)
            dynamic_properties.update(parent_dynamic_properties)
    return dynamic_properties

def get_random_value(session, url, token, dynamic_properties):
    v = {}
    for key, value in dynamic_properties.items():
        if value['type'] == 'boolean':
            v[key] = random.choice([True, False])
        elif value['type'] == 'integer':
            min_value = -1000 if 'min' not in value else value['min']
            max_value = 1000 if 'max' not in value else value['max']
            v[key] = random.randint(min_value, max_value)
        elif value['type'] == 'real':
            min_value = -1000 if 'min' not in value else value['min']
            max_value = 1000 if 'max' not in value else value['max']
            v[key] = random.uniform(min_value, max_value)
        elif value['type'] == 'symbol':
            v[key] = random.choice(value['values'])
        elif value['type'] == 'string':
            v[key] = fake.text()
        elif value['type'] == 'item':
            items = get_items(session, url, token, value['type_id'])
            v[key] = random.choice(items)['id']
    logger.debug(v)
    return v

def start_publishing(url, type_name, interval=.1):
    session = requests.Session()
    token = get_token(session, url, 'admin', 'admin')
    tp = get_type_by_name(session, url, token, type_name)
    dynamic_properties = get_dynamic_properties(session, url, token, tp['id'])
    items = get_items(session, url, token, tp['id'])
    while True:
        for item in items:
            value = get_random_value(session, url, token, dynamic_properties)
            response = session.post(url + '/data/' + item['id'], headers={'Authorization': 'Bearer ' + token}, verify=False, json=value)
            if response.status_code != 204:
                logger.error(response.json())
                return
        time.sleep(interval)

if __name__ == '__main__':
    argumentList = sys.argv[1:]
    url = 'http://localhost:8080'
    type_name = 'CityArea'
    interval = 5
    argumentList = sys.argv[1:]
    for i in range(len(argumentList)):
        if argumentList[i] == '-host':
            url = argumentList[i + 1]
        if argumentList[i] == '-type':
            type_name = argumentList[i + 1]
    start_publishing(url, type_name, interval)