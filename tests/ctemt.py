import sys
import requests
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

def init_db(url):
    session = requests.Session()

    # Login
    logger.info('Logging in')
    response = session.post(url + '/login', json={'username': 'admin', 'password': 'admin'}, verify=False)
    login = response.json()
    logger.info('Logged in')
    logger.debug('Token: %s', login['token'])

    # Update the user type
    logger.info('Getting the User type')
    response = session.get(url + '/type?name=User', headers={'Authorization': 'Bearer ' + login['token']}, verify=False)
    user_type = response.json()
    logger.debug('User type id: %s', user_type['id'])
    response = session.put(url + '/type/' + user_type['id'], headers={'Authorization': 'Bearer ' + login['token']}, verify=False,
                           json={'static_properties': {'role': {'type': 'integer', 'default': 2, 'min': 0, 'max': 2}, 'name': {'type': 'string'}, 'gender': {'type': 'symbol', 'values': ['M', 'F']}},
                                 'dynamic_properties': {'HR': {'type': 'integer', 'min': 40, 'max': 220}, 'me': {'type': 'boolean'}, 'text': {'type': 'string'}}})

    # Create the church type
    logger.info('Creating the church type')
    response = session.post(url + '/type', headers={'Authorization': 'Bearer ' + login['token']}, verify=False,
                            json={'name': 'Church',
                                  'description': 'A type for churches',
                                  'properties': {'icon': 'church.png'},
                                  'static_properties': {'name': {'type': 'string'}, 'position': {'type': 'json', 'schema': {'$ref': '#/components/schemas/geometry'}}}})
    church_type = response.json()
    logger.debug('Church type %s created', church_type['id'])

    # Create the cave church type
    logger.info('Creating the cave church type')
    response = session.post(url + '/type', headers={'Authorization': 'Bearer ' + login['token']}, verify=False,
                            json={'name': 'CaveChurch',
                                  'description': 'A type for cave churches',
                                  'parents': [church_type['id']],
                                  'properties': {'icon': 'cavechurch.png'}})
    cave_church_type = response.json()
    logger.debug('Cave church type %s created', cave_church_type['id'])

if __name__ == '__main__':
    url = sys.argv[1] if len(sys.argv) > 1 else 'https://localhost:8080'
    init_db(url)