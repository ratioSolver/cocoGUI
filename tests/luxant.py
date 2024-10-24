import sys
import requests
import random
import time

def init_db(url):
    session = requests.Session()

    # Create the type 
    response = session.post(url + '/type', json={'name': 'Lampione', 'description': 'A type for churches',
                                                  'static_properties': {'name': {'type': 'string'}, 'geometry': {'type': 'json', 'schema': {'$ref': '#/components/schemas/geometry'}}},
                                                  'dynamic_properties': {'status': {'type': 'boolean'}, 'intensity': {'type': 'integer'}}})
    tipo_lampione = response.json()
    print(tipo_lampione)

    # Create the church instances
    response = session.post(url + '/item', json={'type': tipo_lampione['id'], 'properties': {'name': 'ACITO SAN CAMPO', 'geometry': {'type': 'Point', 'coordinates': [16.627615, 40.653837]}}})
    church1 = response.json()
    print(church1)

def pub_lamp(url):
    session = requests.Session()

    response = session.get(url + '/items?type_name=Lampione')
    lampioni = response.json()
    print(lampioni)

    while True:
        for lampione in lampioni:
            status = random.choice([True, False])
            intensity = random.randint(0, 100)
            response = session.post(url + '/data/' + str(lampione['id']), json={'status': status, 'intensity': intensity})
            print(response.status_code)
            time.sleep(10)


if __name__ == '__main__':
    url = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8080'
    pub_lamp(url)