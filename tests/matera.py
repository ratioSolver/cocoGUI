import sys
import requests

def init_db(url):
    session = requests.Session()

    # Create the church type 
    response = session.post(url + '/type', json={'name': 'Church', 'description': 'A type for churches',
                                                  'static_properties': {'name': {'type': 'string'}, 'geometry': {'type': 'json', 'schema': {'$ref': '#/components/schemas/geometry'}}}})
    church_type = response.json()
    print(church_type)

    # Create the cave church type
    response = session.post(url + '/type', json={'name': 'CaveChurch', 'description': 'A type for cave churches', 'parents': [church_type['id']]})
    cave_church_type = response.json()
    print(cave_church_type)

    # Create the church instances
    response = session.post(url + '/item', json={'type': church_type['id'], 'properties': {'name': 'ACITO SAN CAMPO', 'geometry': {'type': 'Point', 'coordinates': [16.627615, 40.653837]}}})
    church1 = response.json()
    print(church1)

    response = session.post(url + '/item', json={'type': church_type['id'], 'properties': {'name': 'ASCETERIO DI MURGIA TIMONE O ASCETERIO DI SAN LUPO', 'geometry': {'type': 'Point', 'coordinates': [16.616093, 40.665063]}}})
    church2 = response.json()
    print(church2)

    response = session.post(url + '/item', json={'type': church_type['id'], 'properties': {'name': 'ASCETERIO DI SANT AGNESE O ASCETERIO DI SANTA MARIA DELL ARCO', 'geometry': {'type': 'Point', 'coordinates': [16.615342, 40.663883]}}})
    church3 = response.json()
    print(church3)

    response = session.post(url + '/item', json={'type': church_type['id'], 'properties': {'name': 'ASCETERIO SAN CAMPO', 'geometry': {'type': 'Point', 'coordinates': [16.638414, 40.652976]}}})
    church4 = response.json()
    print(church4)

    response = session.post(url + '/item', json={'type': church_type['id'], 'properties': {'name': 'CAPPUCCINO NUOVO', 'geometry': {'type': 'Point', 'coordinates': [16.61961, 40.653039]}}})
    church5 = response.json()
    print(church5)

    # Create the cave church instances
    response = session.post(url + '/item', json={'type': cave_church_type['id'], 'properties': {'name': 'San Leonardo', 'geometry': {'type': 'Point', 'coordinates': [16.611671, 40.662238]}}})
    cave_church1 = response.json()
    print(cave_church1)

    response = session.post(url + '/item', json={'type': cave_church_type['id'], 'properties': {'name': 'Cripta di Porta Empia o San Giacomo', 'geometry': {'type': 'Point', 'coordinates': [16.612691, 40.666032]}}})
    cave_church2 = response.json()
    print(cave_church2)

    response = session.post(url + '/item', json={'type': cave_church_type['id'], 'properties': {'name': 'Cappuccino Vecchio', 'geometry': {'type': 'Point', 'coordinates': [16.619395, 40.653033]}}})
    cave_church3 = response.json()
    print(cave_church3)

    response = session.post(url + '/item', json={'type': cave_church_type['id'], 'properties': {'name': 'Santa Cesarea', 'geometry': {'type': 'Point', 'coordinates': [16.609187, 40.669572]}}})
    cave_church4 = response.json()
    print(cave_church4)

    response = session.post(url + '/item', json={'type': cave_church_type['id'], 'properties': {'name': 'San Giovanni in Monterrone', 'geometry': {'type': 'Point', 'coordinates': [16.612207, 40.663947]}}})
    cave_church5 = response.json()
    print(cave_church5)

if __name__ == '__main__':
    url = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8080'
    init_db(url)