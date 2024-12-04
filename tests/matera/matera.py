import sys
import requests
import logging
import json
from pyproj import Transformer

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.DEBUG)
logger.addHandler(handler)

def get_url(url, db, collection):
    return url + '/search?&db=' + db + '&collection=' + collection

def create_arbusti(db_session, db_url, coco_session, coco_url, token):
    response = db_session.get(get_url(db_url, 'Arbusti', 'Arbusti'))
    if response.status_code != 200:
        logger.error(response.json())
        return
    data = response.json()
    for arbusto in data[0]['features']:
        arbusto['geometry']['coordinates'] = Transformer.from_crs('EPSG:32633', 'EPSG:4326', always_xy=True).transform(arbusto['geometry']['coordinates'][0], arbusto['geometry']['coordinates'][1])
    with open('arbusti.json', 'w') as f:
        json.dump(data, f)

    response = coco_session.post(coco_url + '/type', headers={'Authorization': 'Bearer ' + token}, verify=False,
                             json={'name': 'Arbusto', 'description': 'Arbusto di Matera',
                                   'static_properties': {'Tipologia': {'type': 'string'},
                                                         'Ubicazione': {'type': 'string'},
                                                         'Posizione': {'type': 'json', 'schema': {'$ref': '#/components/schemas/geometry'}}}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    arbusto_type = response.json()['id']
    for arbusto in data[0]['features']:
        response = coco_session.post(coco_url + '/item', headers={'Authorization': 'Bearer ' + token}, verify=False,
                                 json={'type': arbusto_type, 'properties': {'Tipologia': arbusto['properties']['TIPOLOGIA'],
                                                                                      'Ubicazione': arbusto['properties']['UBICAZIONE'],
                                                                                      'Posizione': arbusto['geometry']}})

def load_data(db_url, coco_url):
    db_session = requests.Session()
    coco_session = requests.Session()
    response = db_session.get(get_url(db_url, 'Catalogo_dati', 'Dati'))
    if response.status_code != 200:
        logger.error(response.json())
        return
    data = response.json()
    with open('catalogue.json', 'w') as f:
        json.dump(data, f)

    login_response = coco_session.post(coco_url + '/login', json={'username': 'admin', 'password': 'admin'}, verify=False)
    if login_response.status_code != 200:
        logger.error(login_response.json())
        return
    token = login_response.json()['token']

    create_arbusti(db_session, db_url, coco_session, coco_url, token)

if __name__ == '__main__':
    db_url = sys.argv[1] if len(sys.argv) > 1 else 'https://matera-rest-api.na.icar.cnr.it'
    coco_url = sys.argv[2] if len(sys.argv) > 2 else 'http://localhost:8080'
    load_data(db_url, coco_url)