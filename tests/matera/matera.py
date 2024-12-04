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


def create_vehicular_sensors(db_session, db_url, coco_session, coco_url, token):
    response = coco_session.post(coco_url + '/type', headers={'Authorization': 'Bearer ' + token}, verify=False,
                                    json={'name': 'Sensore_veicolare', 'description': 'Sensore veicolare di Matera',
                                          'static_properties': {'Ubicazione': {'type': 'string'},
                                                                'Posizione': {'type': 'json', 'schema': {'$ref': '#/components/schemas/geometry'}}}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    sensor_type = response.json()['id']

    response = coco_session.post(coco_url + '/item', headers={'Authorization': 'Bearer ' + token}, verify=False,
                                 json={'type': sensor_type, 'properties': {'Ubicazione': 'Via Montescaglioso',
                                                                           'Posizione': {'type': 'Point', 'coordinates': [16.61627, 40.65447]}}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    sensor_montescaglioso = response.json()['id']

    response = coco_session.post(coco_url + '/item', headers={'Authorization': 'Bearer ' + token}, verify=False,
                                 json={'type': sensor_type, 'properties': {'Ubicazione': 'Strada Provinciale 10 Matera SUD',
                                                                           'Posizione': {'type': 'Point', 'coordinates': [16.61066, 40.65522]}}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    sensor_sp10 = response.json()['id']

    response = coco_session.post(coco_url + '/item', headers={'Authorization': 'Bearer ' + token}, verify=False,
                                 json={'type': sensor_type, 'properties': {'Ubicazione': 'Via Lucana',
                                                                           'Posizione': {'type': 'Point', 'coordinates': [16.60611, 40.66533]}}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    sensor_lucana = response.json()['id']

    response = coco_session.post(coco_url + '/item', headers={'Authorization': 'Bearer ' + token}, verify=False,
                                 json={'type': sensor_type, 'properties': {'Ubicazione': 'Intersezione Via Marconi - Via Fratelli Cervi',
                                                                           'Posizione': {'type': 'Point', 'coordinates': [16.59963, 40.67561]}}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    sensor_marconi = response.json()['id']
    

    response = coco_session.post(coco_url + '/item', headers={'Authorization': 'Bearer ' + token}, verify=False,
                                 json={'type': sensor_type, 'properties': {'Ubicazione': 'Via Nazionale',
                                                                           'Posizione': {'type': 'Point', 'coordinates': [16.58963, 40.67913]}}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    sensor_nazionale = response.json()['id']

    response = coco_session.post(coco_url + '/item', headers={'Authorization': 'Bearer ' + token}, verify=False,
                                 json={'type': sensor_type, 'properties': {'Ubicazione': 'Via Gravina',
                                                                           'Posizione': {'type': 'Point', 'coordinates': [16.58272, 40.68102]}}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    sensor_gravina = response.json()['id']

    response = coco_session.post(coco_url + '/item', headers={'Authorization': 'Bearer ' + token}, verify=False,
                                 json={'type': sensor_type, 'properties': {'Ubicazione': 'Intersezione Via La Martella - Via Giardinelle',
                                                                           'Posizione': {'type': 'Point', 'coordinates': [16.57702, 40.66963]}}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    sensor_martella = response.json()['id']

    response = coco_session.post(coco_url + '/item', headers={'Authorization': 'Bearer ' + token}, verify=False,
                                 json={'type': sensor_type, 'properties': {'Ubicazione': 'Via Timmari',
                                                                           'Posizione': {'type': 'Point', 'coordinates': [16.59408, 40.66108]}}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    sensor_timmari = response.json()['id']

    response = coco_session.post(coco_url + '/item', headers={'Authorization': 'Bearer ' + token}, verify=False,
                                 json={'type': sensor_type, 'properties': {'Ubicazione': 'Via Dante Alighieri',
                                                                           'Posizione': {'type': 'Point', 'coordinates': [16.59838, 40.66958]}}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    sensor_dante = response.json()['id']


def create_sit(db_session, db_url, coco_session, coco_url, token):
    response = db_session.get(get_url(db_url, 'sensors', 'sensors_list'))
    if response.status_code != 200:
        logger.error(response.json())
        return
    data = response.json()
    with open('sit.json', 'w') as f:
        json.dump(data, f)    


def create_poi(db_session, db_url, coco_session, coco_url, token):
    response = db_session.get(get_url(db_url, 'Grafo_Matera', 'Matera_POI'))
    if response.status_code != 200:
        logger.error(response.json())
        return
    data = response.json()
    with open('poi.json', 'w') as f:
        json.dump(data, f)    

    response = coco_session.post(coco_url + '/type', headers={'Authorization': 'Bearer ' + token}, verify=False,
                                 json={'name': 'POI', 'description': 'Point of Interest di Matera',
                                       'static_properties': {'Nome': {'type': 'string'},
                                                             'Tipo': {'type': 'string'},
                                                             'Apertura': {'type': 'string'},
                                                             'Chiusura': {'type': 'string'},
                                                             'Posizione': {'type': 'json', 'schema': {'$ref': '#/components/schemas/geometry'}}}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    poi_type = response.json()['id']
    for poi in data[0]['features']:
        response = coco_session.post(coco_url + '/item', headers={'Authorization': 'Bearer ' + token}, verify=False,
                                     json={'type': poi_type, 'properties': {'Nome': poi['properties']['name'],
                                                                          'Tipo': poi['properties']['poitype'],
                                                                          'Apertura': poi['properties']['opening'],
                                                                          'Chiusura': poi['properties']['closing'],
                                                                          'Posizione': {'type': 'Point', 'coordinates': [float(poi['properties']['longitude']), float(poi['properties']['latitude'])]}}})

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
    create_vehicular_sensors(db_session, db_url, coco_session, coco_url, token)
    create_sit(db_session, db_url, coco_session, coco_url, token)
    create_poi(db_session, db_url, coco_session, coco_url, token)

if __name__ == '__main__':
    db_url = sys.argv[1] if len(sys.argv) > 1 else 'https://matera-rest-api.na.icar.cnr.it'
    coco_url = sys.argv[2] if len(sys.argv) > 2 else 'http://localhost:8080'
    load_data(db_url, coco_url)