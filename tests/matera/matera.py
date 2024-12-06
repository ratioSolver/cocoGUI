import sys
import requests
import logging
import json
from tqdm import tqdm
from pyproj import Transformer
from datetime import datetime
from pymongo import MongoClient

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
        if response.status_code != 200:
            logger.error(response.json())
            return

def create_ludic_tools(coco_session, coco_url, token):
    response = coco_session.post(coco_url + '/type', headers={'Authorization': 'Bearer ' + token}, verify=False,
                             json={'name': 'Attrezzatura_ludica', 'description': 'Attrezzatura ludica di Matera',
                                      'static_properties': {'Nome': {'type': 'string'},
                                                            'Ubicazione': {'type': 'string'},
                                                            'Stato': {'type': 'string'},
                                                            'Posizione': {'type': 'json', 'schema': {'$ref': '#/components/schemas/geometry'}}}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    ludic_tool_type = response.json()['id']

    with open('Attrezzature_Ludiche_PdV.geojson', 'r') as f:
        data = json.load(f)
        for ludic_tool in tqdm(data['features']):
            response = coco_session.post(coco_url + '/item', headers={'Authorization': 'Bearer ' + token}, verify=False,
                                     json={'type': ludic_tool_type, 'properties': {'Nome': ludic_tool['properties']['VIA'],
                                                                                'Ubicazione': ludic_tool['properties']['LUOGO'],
                                                                                'Stato': ludic_tool['properties']['STATOARR'],
                                                                                'Posizione': ludic_tool['geometry']}})
            if response.status_code != 200:
                logger.error(response.json())
                return


def create_TPL_stops(coco_session, coco_url, token):
    response = coco_session.post(coco_url + '/type', headers={'Authorization': 'Bearer ' + token}, verify=False,
                             json={'name': 'Fermata_TPL', 'description': 'Fermata TPL di Matera',
                                   'static_properties': {'Nome': {'type': 'string'},
                                                         'Ubicazione': {'type': 'string'},
                                                         'Posizione': {'type': 'json', 'schema': {'$ref': '#/components/schemas/geometry'}}}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    tpl_stop_type = response.json()['id']

    with open('Fermate_TPL.geojson', 'r') as f:
        data = json.load(f)
        for tpl_stop in tqdm(data['features']):
            response = coco_session.post(coco_url + '/item', headers={'Authorization': 'Bearer ' + token}, verify=False,
                                     json={'type': tpl_stop_type, 'properties': {'Nome': tpl_stop['properties']['NOME'],
                                                                            'Ubicazione': tpl_stop['properties']['INDIRIZZO'],
                                                                            'Posizione': tpl_stop['geometry']}})
            if response.status_code != 200:
                logger.error(response.json())
                return


def create_churches(coco_session, coco_url, token):
    response = coco_session.post(coco_url + '/type', headers={'Authorization': 'Bearer ' + token}, verify=False,
                             json={'name': 'Chiesa', 'description': 'Chiesa di Matera',
                                   'static_properties': {'Nome': {'type': 'string'},
                                                         'Ubicazione': {'type': 'string'},
                                                         'Link': {'type': 'string'},
                                                         'Posizione': {'type': 'json', 'schema': {'$ref': '#/components/schemas/geometry'}}}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    church_type = response.json()['id']

    with open('Chiese.geojson', 'r') as f:
        data = json.load(f)
        for church in tqdm(data['features']):
            response = coco_session.post(coco_url + '/item', headers={'Authorization': 'Bearer ' + token}, verify=False,
                                     json={'type': church_type, 'properties': {'Nome': church['properties']['name'],
                                                                            'Ubicazione': church['properties']['UBICAZIONE'],
                                                                            'Link': church['properties']['LINK_Webso'],
                                                                            'Posizione': church['geometry']}})
            if response.status_code != 200:
                logger.error(response.json())
                return

    response = coco_session.post(coco_url + '/type', headers={'Authorization': 'Bearer ' + token}, verify=False,
                             json={'name': 'Chiesa_rupestre', 'description': 'Chiesa rupestre di Matera', 'parents': [church_type],
                                   'static_properties': {'Anteprima': {'type': 'string'},
                                                         'Accessibilita': {'type': 'string'}}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    cave_church_type = response.json()['id']

    with open('Chiese_Rupestri.geojson', 'r') as f:
        data = json.load(f)
        for cave_church in tqdm(data['features']):
            response = coco_session.post(coco_url + '/item', headers={'Authorization': 'Bearer ' + token}, verify=False,
                                     json={'type': cave_church_type, 'properties': {'Nome': cave_church['properties']['Name'],
                                                                                    'Link': cave_church['properties']['Link'],
                                                                                    'Anteprima': cave_church['properties']['Anteprima'],
                                                                                    'Accessibilita': cave_church['properties']['accessibil'],
                                                                                    'Posizione': cave_church['geometry']}})
            if response.status_code != 200:
                logger.error(response.json())
                return


def create_vehicular_sensors(db_session, db_url, coco_session, coco_url, token):
    response = coco_session.post(coco_url + '/type', headers={'Authorization': 'Bearer ' + token}, verify=False,
                                    json={'name': 'Sensore_veicolare', 'description': 'Sensore veicolare di Matera',
                                          'static_properties': {'Ubicazione': {'type': 'string'},
                                                                'Posizione': {'type': 'json', 'schema': {'$ref': '#/components/schemas/geometry'}}},
                                          'dynamic_properties': {'Speed': {'type': 'float', 'min': -200, 'max': 200},
                                                                 'Length': {'type': 'float', 'min': -30, 'max': 30}}})
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

    mongo_client = MongoClient('localhost', 27017)
    db = mongo_client['CoCo']
    collection = db['item_data']

    response = db_session.get(get_url(db_url, 'Veicoli', '24B3018-Montescaglioso'))
    if response.status_code != 200:
        logger.error(response.json())
        return
    db_data = response.json()
    with open('24B3018-Montescaglioso.json', 'w') as f:
        json.dump(db_data, f)
    for db_datum in tqdm(db_data):
        datum = {}
        if (db_datum['typ'] == '001'):
            if (db_datum.get(' speed [km/h]') is not None):
                datum['Speed'] = float(db_datum[' speed [km/h]'].replace(',', '.').strip())
            elif (db_datum.get('speed [km/h]') is not None):
                datum['Speed'] = float(db_datum['speed [km/h]'].replace(',', '.').strip())
            if (db_datum.get(' length [m]') is not None):
                datum['Length'] = float(db_datum[' length [m]'].replace(',', '.').strip())
            elif (db_datum.get('length [m]') is not None):
                datum['Length'] = float(db_datum['length [m]'].replace(',', '.').strip())
            if (db_datum.get(' date and time') is not None):
                collection.insert_one({'item_id': sensor_montescaglioso, 'timestamp': datetime.strptime(db_datum[' date and time'], " %Y/%m/%d %H:%M:%S,%f").isoformat() + 'Z', 'data': datum})
            elif (db_datum.get('date and time') is not None):
                collection.insert_one({'item_id': sensor_montescaglioso, 'timestamp': datetime.strptime(db_datum['date and time'], " %Y/%m/%d %H:%M:%S,%f").isoformat() + 'Z', 'data': datum})

    response = db_session.get(get_url(db_url, 'Veicoli', '24B3017-SP10'))
    if response.status_code != 200:
        logger.error(response.json())
        return
    db_data = response.json()
    with open('24B3017-SP10.json', 'w') as f:
        json.dump(db_data, f)
    for db_datum in tqdm(db_data):
        datum = {}
        if (db_datum['typ'] == '001'):
            if (db_datum.get(' speed [km/h]') is not None):
                datum['Speed'] = float(db_datum[' speed [km/h]'].replace(',', '.').strip())
            elif (db_datum.get('speed [km/h]') is not None):
                datum['Speed'] = float(db_datum['speed [km/h]'].replace(',', '.').strip())
            if (db_datum.get(' length [m]') is not None):
                datum['Length'] = float(db_datum[' length [m]'].replace(',', '.').strip())
            elif (db_datum.get('length [m]') is not None):
                datum['Length'] = float(db_datum['length [m]'].replace(',', '.').strip())
            if (db_datum.get(' date and time') is not None):
                collection.insert_one({'item_id': sensor_sp10, 'timestamp': datetime.strptime(db_datum[' date and time'], " %Y/%m/%d %H:%M:%S,%f").isoformat() + 'Z', 'data': datum})
            elif (db_datum.get('date and time') is not None):
                collection.insert_one({'item_id': sensor_sp10, 'timestamp': datetime.strptime(db_datum['date and time'], " %Y/%m/%d %H:%M:%S,%f").isoformat() + 'Z', 'data': datum})

    # response = db_session.get(get_url(db_url, 'Veicoli', '24B3019-Lucana'))
    # if response.status_code != 200:
    #     logger.error(response.json())
    #     return
    # db_data = response.json()
    # with open('24B3019-Lucana.json', 'w') as f:
    #     json.dump(db_data, f)
    # for db_datum in tqdm(db_data):
    #     datum = {}
    #     if (db_datum['typ'] == '001'):
    #         if (db_datum.get(' speed [km/h]') is not None):
    #             datum['Speed'] = float(db_datum[' speed [km/h]'].replace(',', '.').strip())
    #         elif (db_datum.get('speed [km/h]') is not None):
    #             datum['Speed'] = float(db_datum['speed [km/h]'].replace(',', '.').strip())
    #         if (db_datum.get(' length [m]') is not None):
    #             datum['Length'] = float(db_datum[' length [m]'].replace(',', '.').strip())
    #         elif (db_datum.get('length [m]') is not None):
    #             datum['Length'] = float(db_datum['length [m]'].replace(',', '.').strip())
    #         if (db_datum.get(' date and time') is not None):
    #             collection.insert_one({'item_id': sensor_lucana, 'timestamp': datetime.strptime(db_datum[' date and time'], " %Y/%m/%d %H:%M:%S,%f").isoformat() + 'Z', 'data': datum})
    #         elif (db_datum.get('date and time') is not None):
    #             collection.insert_one({'item_id': sensor_lucana, 'timestamp': datetime.strptime(db_datum['date and time'], " %Y/%m/%d %H:%M:%S,%f").isoformat() + 'Z', 'data': datum})

    response = db_session.get(get_url(db_url, 'Veicoli', '24B3025-Marconi'))
    if response.status_code != 200:
        logger.error(response.json())
        return
    db_data = response.json()
    with open('24B3025-Marconi.json', 'w') as f:
        json.dump(db_data, f)
    for db_datum in tqdm(db_data):
        datum = {}
        if (db_datum['typ'] == '001'):
            if (db_datum.get(' speed [km/h]') is not None):
                datum['Speed'] = float(db_datum[' speed [km/h]'].replace(',', '.').strip())
            elif (db_datum.get('speed [km/h]') is not None):
                datum['Speed'] = float(db_datum['speed [km/h]'].replace(',', '.').strip())
            if (db_datum.get(' length [m]') is not None):
                datum['Length'] = float(db_datum[' length [m]'].replace(',', '.').strip())
            elif (db_datum.get('length [m]') is not None):
                datum['Length'] = float(db_datum['length [m]'].replace(',', '.').strip())
            if (db_datum.get(' date and time') is not None):
                collection.insert_one({'item_id': sensor_marconi, 'timestamp': datetime.strptime(db_datum[' date and time'], " %Y/%m/%d %H:%M:%S,%f").isoformat() + 'Z', 'data': datum})
            elif (db_datum.get('date and time') is not None):
                collection.insert_one({'item_id': sensor_marconi, 'timestamp': datetime.strptime(db_datum['date and time'], " %Y/%m/%d %H:%M:%S,%f").isoformat() + 'Z', 'data': datum})

    response = db_session.get(get_url(db_url, 'Veicoli', '24B3024-Nazionale'))
    if response.status_code != 200:
        logger.error(response.json())
        return
    db_data = response.json()
    with open('24B3024-Nazionale.json', 'w') as f:
        json.dump(db_data, f)
    for db_datum in tqdm(db_data):
        datum = {}
        if (db_datum['typ'] == '001'):
            if (db_datum.get(' speed [km/h]') is not None):
                datum['Speed'] = float(db_datum[' speed [km/h]'].replace(',', '.').strip())
            elif (db_datum.get('speed [km/h]') is not None):
                datum['Speed'] = float(db_datum['speed [km/h]'].replace(',', '.').strip())
            if (db_datum.get(' length [m]') is not None):
                datum['Length'] = float(db_datum[' length [m]'].replace(',', '.').strip())
            elif (db_datum.get('length [m]') is not None):
                datum['Length'] = float(db_datum['length [m]'].replace(',', '.').strip())
            if (db_datum.get(' date and time') is not None):
                collection.insert_one({'item_id': sensor_nazionale, 'timestamp': datetime.strptime(db_datum[' date and time'], " %Y/%m/%d %H:%M:%S,%f").isoformat() + 'Z', 'data': datum})
            elif (db_datum.get('date and time') is not None):
                collection.insert_one({'item_id': sensor_nazionale, 'timestamp': datetime.strptime(db_datum['date and time'], " %Y/%m/%d %H:%M:%S,%f").isoformat() + 'Z', 'data': datum})

    response = db_session.get(get_url(db_url, 'Veicoli', '24B3021-Gravina'))
    if response.status_code != 200:
        logger.error(response.json())
        return
    db_data = response.json()
    with open('24B3021-Gravina.json', 'w') as f:
        json.dump(db_data, f)
    for db_datum in tqdm(db_data):
        datum = {}
        if (db_datum['typ'] == '001'):
            if (db_datum.get(' speed [km/h]') is not None):
                datum['Speed'] = float(db_datum[' speed [km/h]'].replace(',', '.').strip())
            elif (db_datum.get('speed [km/h]') is not None):
                datum['Speed'] = float(db_datum['speed [km/h]'].replace(',', '.').strip())
            if (db_datum.get(' length [m]') is not None):
                datum['Length'] = float(db_datum[' length [m]'].replace(',', '.').strip())
            elif (db_datum.get('length [m]') is not None):
                datum['Length'] = float(db_datum['length [m]'].replace(',', '.').strip())
            if (db_datum.get(' date and time') is not None):
                collection.insert_one({'item_id': sensor_gravina, 'timestamp': datetime.strptime(db_datum[' date and time'], " %Y/%m/%d %H:%M:%S,%f").isoformat() + 'Z', 'data': datum})
            elif (db_datum.get('date and time') is not None):
                collection.insert_one({'item_id': sensor_gravina, 'timestamp': datetime.strptime(db_datum['date and time'], " %Y/%m/%d %H:%M:%S,%f").isoformat() + 'Z', 'data': datum})

    response = db_session.get(get_url(db_url, 'Veicoli', '24B3023-Martella'))
    if response.status_code != 200:
        logger.error(response.json())
        return
    db_data = response.json()
    with open('24B3023-Martella.json', 'w') as f:
        json.dump(db_data, f)
    for db_datum in tqdm(db_data):
        datum = {}
        if (db_datum['typ'] == '001'):
            if (db_datum.get(' speed [km/h]') is not None):
                datum['Speed'] = float(db_datum[' speed [km/h]'].replace(',', '.').strip())
            elif (db_datum.get('speed [km/h]') is not None):
                datum['Speed'] = float(db_datum['speed [km/h]'].replace(',', '.').strip())
            if (db_datum.get(' length [m]') is not None):
                datum['Length'] = float(db_datum[' length [m]'].replace(',', '.').strip())
            elif (db_datum.get('length [m]') is not None):
                datum['Length'] = float(db_datum['length [m]'].replace(',', '.').strip())
            if (db_datum.get(' date and time') is not None):
                collection.insert_one({'item_id': sensor_martella, 'timestamp': datetime.strptime(db_datum[' date and time'], " %Y/%m/%d %H:%M:%S,%f").isoformat() + 'Z', 'data': datum})
            elif (db_datum.get('date and time') is not None):
                collection.insert_one({'item_id': sensor_martella, 'timestamp': datetime.strptime(db_datum['date and time'], " %Y/%m/%d %H:%M:%S,%f").isoformat() + 'Z', 'data': datum})

    response = db_session.get(get_url(db_url, 'Veicoli', '24B3020-Timmari'))
    if response.status_code != 200:
        logger.error(response.json())
        return
    db_data = response.json()
    with open('24B3020-Timmari.json', 'w') as f:
        json.dump(db_data, f)
    for db_datum in tqdm(db_data):
        datum = {}
        if (db_datum['typ'] == '001'):
            if (db_datum.get(' speed [km/h]') is not None):
                datum['Speed'] = float(db_datum[' speed [km/h]'].replace(',', '.').strip())
            elif (db_datum.get('speed [km/h]') is not None):
                datum['Speed'] = float(db_datum['speed [km/h]'].replace(',', '.').strip())
            if (db_datum.get(' length [m]') is not None):
                datum['Length'] = float(db_datum[' length [m]'].replace(',', '.').strip())
            elif (db_datum.get('length [m]') is not None):
                datum['Length'] = float(db_datum['length [m]'].replace(',', '.').strip())
            if (db_datum.get(' date and time') is not None):
                collection.insert_one({'item_id': sensor_timmari, 'timestamp': datetime.strptime(db_datum[' date and time'], " %Y/%m/%d %H:%M:%S,%f").isoformat() + 'Z', 'data': datum})
            elif (db_datum.get('date and time') is not None):
                collection.insert_one({'item_id': sensor_timmari, 'timestamp': datetime.strptime(db_datum['date and time'], " %Y/%m/%d %H:%M:%S,%f").isoformat() + 'Z', 'data': datum})

    response = db_session.get(get_url(db_url, 'Veicoli', '24B3022-Dante'))
    if response.status_code != 200:
        logger.error(response.json())
        return
    db_data = response.json()
    with open('24B3022-Dante.json', 'w') as f:
        json.dump(db_data, f)
    for db_datum in tqdm(db_data):
        datum = {}
        if (db_datum['typ'] == '001'):
            if (db_datum.get(' speed [km/h]') is not None):
                datum['Speed'] = float(db_datum[' speed [km/h]'].replace(',', '.').strip())
            elif (db_datum.get('speed [km/h]') is not None):
                datum['Speed'] = float(db_datum['speed [km/h]'].replace(',', '.').strip())
            if (db_datum.get(' length [m]') is not None):
                datum['Length'] = float(db_datum[' length [m]'].replace(',', '.').strip())
            elif (db_datum.get('length [m]') is not None):
                datum['Length'] = float(db_datum['length [m]'].replace(',', '.').strip())
            if (db_datum.get(' date and time') is not None):
                collection.insert_one({'item_id': sensor_dante, 'timestamp': datetime.strptime(db_datum[' date and time'], " %Y/%m/%d %H:%M:%S,%f").isoformat() + 'Z', 'data': datum})
            elif (db_datum.get('date and time') is not None):
                collection.insert_one({'item_id': sensor_dante, 'timestamp': datetime.strptime(db_datum['date and time'], " %Y/%m/%d %H:%M:%S,%f").isoformat() + 'Z', 'data': datum})


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


def create_street_lights(db_session, db_url, coco_session, coco_url, token):
    response = coco_session.post(coco_url + '/type', headers={'Authorization': 'Bearer ' + token}, verify=False,
                                    json={'name': 'Lampione', 'description': 'Lampione di Matera',
                                          'static_properties': {'Ubicazione': {'type': 'string'},
                                                                'Posizione': {'type': 'json', 'schema': {'$ref': '#/components/schemas/geometry'}}},
                                          'dynamic_properties': {'Potenza': {'type': 'float', 'min': 0, 'max': 5},
                                                                 'Voltaggio': {'type': 'float', 'min': 0, 'max': 300},
                                                                 'Corrente': {'type': 'float', 'min': 0, 'max': 20},
                                                                 'Temperatura': {'type': 'float', 'min': -20, 'max': 100}}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    
    lampione_type = response.json()['id']

    response = coco_session.post(coco_url + '/item', headers={'Authorization': 'Bearer ' + token}, verify=False,
                                 json={'type': lampione_type, 'properties': {'Ubicazione': 'Via Montescaglioso',
                                                                           'Posizione': {'type': 'Point', 'coordinates': [16.61627, 40.65447]}}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    lampione_montescaglioso = response.json()['id']
    logger.info('Lampione Montescaglioso: ' + lampione_montescaglioso)

    response = coco_session.post(coco_url + '/item', headers={'Authorization': 'Bearer ' + token}, verify=False,
                                 json={'type': lampione_type, 'properties': {'Ubicazione': 'Strada Provinciale 10 Matera SUD',
                                                                           'Posizione': {'type': 'Point', 'coordinates': [16.61066, 40.65522]}}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    lampione_sp10 = response.json()['id']
    logger.info('Lampione SP10: ' + lampione_sp10)


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
    create_ludic_tools(coco_session, coco_url, token)
    create_TPL_stops(coco_session, coco_url, token)
    create_churches(coco_session, coco_url, token)
    create_vehicular_sensors(db_session, db_url, coco_session, coco_url, token)
    create_poi(db_session, db_url, coco_session, coco_url, token)
    create_street_lights(db_session, db_url, coco_session, coco_url, token)

if __name__ == '__main__':
    db_url = sys.argv[1] if len(sys.argv) > 1 else 'https://matera-rest-api.na.icar.cnr.it'
    coco_url = sys.argv[2] if len(sys.argv) > 2 else 'http://localhost:8080'
    load_data(db_url, coco_url)