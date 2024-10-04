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

    logger.info('Getting the Church type')
    response = session.get(url + '/type?name=Church', headers={'Authorization': 'Bearer ' + login['token']}, verify=False)
    if response.status_code != 200:
        logger.info('Cannot find the Church type')
        return
    church_type = response.json()

    logger.info('Getting the churches')
    response = session.get(url + '/items?type_name=Church', headers={'Authorization': 'Bearer ' + login['token']}, verify=False)
    if response.status_code != 200:
        logger.info('Cannot find the churches')
        return
    churches = response.json()
    logger.debug('Found %d churches', len(churches))
    if len(churches) == 0:
        logger.info('Creating churches')
        response = session.post(url + '/item', headers={'Authorization': 'Bearer ' + login['token']}, verify=False,
                                json={'type': church_type['id'], 'properties': {'name': 'Acito San Campo', 'icon': 'church.png', 'location': {'type': 'Point', 'coordinates': [16.627615, 40.653837]}}})
        response = session.post(url + '/item', headers={'Authorization': 'Bearer ' + login['token']}, verify=False,
                                json={'type': church_type['id'], 'properties': {'name': 'Asceterio di Murgia Timone o di San Lupo', 'icon': 'church.png', 'location': {'type': 'Point', 'coordinates': [16.616093, 40.665063]}}})
        response = session.post(url + '/item', headers={'Authorization': 'Bearer ' + login['token']}, verify=False,
                                json={'type': church_type['id'], 'properties': {'name': "Asceterio di Sant'Agnese o di Santa Maria dell'Arco", 'icon': 'church.png', 'location': {'type': 'Point', 'coordinates': [16.615342, 40.663883]}}})

    logger.info('Getting the CaveChurch type')
    response = session.get(url + '/type?name=CaveChurch', headers={'Authorization': 'Bearer ' + login['token']}, verify=False)
    if response.status_code != 200:
        logger.info('Cannot find the CaveChurch type')
        return
    cave_church_type = response.json()
    
    logger.info('Getting the cave churches')
    response = session.get(url + '/items?type_name=CaveChurch', headers={'Authorization': 'Bearer ' + login['token']}, verify=False)
    if response.status_code != 200:
        logger.info('Cannot find the cave churches')
        return
    cave_churches = response.json()
    logger.debug('Found %d cave churches', len(cave_churches))
    if len(cave_churches) == 0:
        logger.info('Creating cave churches')
        response = session.post(url + '/item', headers={'Authorization': 'Bearer ' + login['token']}, verify=False,
                                json={'type': cave_church_type['id'], 'properties': {'name': 'San Leonardo', 'icon': 'cave_church.png', 'location': {'type': 'Point', 'coordinates': [16.611671, 40.662238, 0.0]}}})
        response = session.post(url + '/item', headers={'Authorization': 'Bearer ' + login['token']}, verify=False,
                                json={'type': cave_church_type['id'], 'properties': {'name': 'Cappuccino Vecchio', 'icon': 'cave_church.png', 'location': {'type': 'Point', 'coordinates': [16.619395, 40.653033, 0.0]}}})

if __name__ == '__main__':
    url = sys.argv[1] if len(sys.argv) > 1 else 'https://localhost:8080'
    init_db(url)