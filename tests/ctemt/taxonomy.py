import sys
import requests
import logging
import warnings
from urllib3.exceptions import InsecureRequestWarning

# Suppress InsecureRequestWarning from urllib3
warnings.filterwarnings('ignore', category=InsecureRequestWarning)

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.DEBUG)
logger.addHandler(handler)

def init_db(url):
    session = requests.Session()

    # Login
    logger.info('Logging in..')
    response = session.post(url + '/login', json={'username': 'admin', 'password': 'admin'}, verify=False)
    login = response.json()
    logger.info('Logged in!')
    logger.debug('Token: %s', login['token'])

    # Update the user type
    logger.info('Getting the User type')
    response = session.get(url + '/type?name=User', headers={'Authorization': 'Bearer ' + login['token']}, verify=False)
    user_type = response.json()
    logger.debug('User type id: %s', user_type['id'])
    if not 'name' in user_type['static_properties']:
        logger.info('Updating the User type')
        response = session.put(url + '/type/' + user_type['id'], headers={'Authorization': 'Bearer ' + login['token']}, verify=False,
                               json={'static_properties': {'role': {'type': 'integer', 'default': 2, 'min': 0, 'max': 2}, 'name': {'type': 'string'}, 'gender': {'type': 'symbol', 'values': ['M', 'F']}},
                                     'dynamic_properties': {'HR': {'type': 'integer', 'min': 40, 'max': 220}, 'online': {'type': 'boolean'}, 'me': {'type': 'boolean'}, 'text': {'type': 'string'}}})

    logger.info('Getting the Church type')
    response = session.get(url + '/type?name=Church', headers={'Authorization': 'Bearer ' + login['token']}, verify=False)
    if response.status_code == 200:
        church_type = response.json()
        logger.debug('Church type id: %s', church_type['id'])
    else:
        # Create the church type
        logger.info('Creating the Church type')
        response = session.post(url + '/type', headers={'Authorization': 'Bearer ' + login['token']}, verify=False,
                                json={'name': 'Church',
                                      'description': 'A type for churches',
                                      'static_properties': {'name': {'type': 'string'}, 'icon': {'type': 'string'}, 'location': {'type': 'json', 'schema': {'$ref': '#/components/schemas/geometry'}}}})
        church_type = response.json()
        logger.debug('Church type %s created', church_type['id'])

    logger.info('Getting the CaveChurch type')
    response = session.get(url + '/type?name=CaveChurch', headers={'Authorization': 'Bearer ' + login['token']}, verify=False)
    if response.status_code == 200:
        cave_church_type = response.json()
        logger.debug('Cave church type id: %s', cave_church_type['id'])
    else:
        # Create the cave church type
        logger.info('Creating the cave church type')
        response = session.post(url + '/type', headers={'Authorization': 'Bearer ' + login['token']}, verify=False,
                                json={'name': 'CaveChurch',
                                      'description': 'A type for cave churches',
                                      'parents': [church_type['id']]})
        cave_church_type = response.json()
        logger.debug('Cave church type %s created', cave_church_type['id'])

    logger.info('Getting the Bus type')
    response = session.get(url + '/type?name=Bus', headers={'Authorization': 'Bearer ' + login['token']}, verify=False)
    if response.status_code == 200:
        bus_type = response.json()
        logger.debug('Bus type id: %s', bus_type['id'])
    else:
        # Create the bus type
        logger.info('Creating the Bus type')
        response = session.post(url + '/type', headers={'Authorization': 'Bearer ' + login['token']}, verify=False,
                                json={'name': 'Bus',
                                      'description': 'A type for buses',
                                      'static_properties': {'name': {'type': 'string'}, 'icon': {'type': 'string'}, 'capacity': {'type': 'integer', 'min': 0, 'max': 100}},
                                      'dynamic_properties': {'position': {'type': 'json', 'schema': {'$ref': '#/components/schemas/geometry'}}}})
        bus_type = response.json()
        logger.debug('Bus type %s created', bus_type['id'])

if __name__ == '__main__':
    url = sys.argv[1] if len(sys.argv) > 1 else 'https://localhost:8080'
    init_db(url)