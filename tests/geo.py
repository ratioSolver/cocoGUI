import sys
import requests

def init_db(url):
    session = requests.Session()

    # Create the infrastructure type 
    response = session.post(url + '/type', json={'name': 'Infrastructure', 'description': 'A type for infrastructure',
                                                  'static_properties': {'name': {'type': 'string'}, 'geometry': {'type': 'json', 'schema': {'$ref': '#/components/schemas/geometry'}}}})
    infrastructure_type = response.json()
    print(infrastructure_type)

    # Create the bus type
    response = session.post(url + '/type', json={'name': 'Bus', 'description': 'A type for buses',
                                                  'static_properties': {'name': {'type': 'string'}},
                                                  'dynamic_properties': {'geometry': {'type': 'json', 'schema': {'$ref': '#/components/schemas/geometry'}}}})
    bus_type = response.json()
    print(bus_type)

    # Create some infrastructures
    response = session.post(url + '/item', json={'type': infrastructure_type['id'], 'properties': {'name': "Fontana dell'Aquila", 'geometry': {'type': 'Point', 'coordinates': [11.1215698, 46.0677293]}}})
    print(response.json())

    response = session.post(url + '/item', json={'type': infrastructure_type['id'], 'properties': {'name': 'Via Rodolfo Belenzani', 'geometry': {'type': 'LineString', 'coordinates': [
           [11.1214686,46.0677385],[11.121466,46.0677511],[11.1213806,46.0681452],
           [11.1213548,46.0682642],[11.1213115,46.0684385],[11.1212897,46.0685261],
           [11.1212678,46.0686443]
        ]}}})
    print(response.json())

    response = session.post(url + '/item', json={'type': infrastructure_type['id'], 'properties': {'name': 'Piazza Duomo', 'geometry': {'type': 'Polygon', 'coordinates': [
          [
            [11.1209262, 46.0676632],[11.1209201, 46.0676444],[11.1209473, 46.0675811],
            [11.1210082, 46.0674396],[11.1209909, 46.0674359],[11.1209669, 46.0674306],
            [11.120973, 46.067375],[11.1209798, 46.067318],[11.1209906, 46.067313],
            [11.1210021, 46.0673079],[11.1210102, 46.0672175],[11.1210154, 46.0670829],
            [11.1209979, 46.0670731],[11.1209861, 46.0670671],[11.121003, 46.0670034],
            [11.1210228, 46.0670051],[11.1210484, 46.0670073],[11.1216367, 46.0670503],
            [11.1216304, 46.0670981],[11.1217471, 46.0671064],[11.1218604, 46.0671144],
            [11.1218662, 46.0670763],[11.1218916, 46.0670783],[11.1218655, 46.0672963],
            [11.1218347, 46.0675014],[11.1218793, 46.0675034],[11.1219202, 46.0675053],
            [11.121918, 46.067554],[11.1220355, 46.0675565],[11.1220264, 46.067619],
            [11.1220237, 46.0676378],[11.1219858, 46.0676408],[11.121853, 46.0676517],
            [11.1217408, 46.0676621],[11.1215635, 46.0677421],[11.1214686, 46.0677385],
            [11.1213621, 46.0677348],[11.121226, 46.067723],[11.1210982, 46.067711],
            [11.1210937, 46.0677159],[11.1209933, 46.0677017],[11.1209337, 46.0676859],
            [11.1209262, 46.0676632]
          ]
        ]}}})
    print(response.json())

    # Create some buses
    response = session.post(url + '/item', json={'type': bus_type['id'], 'properties': {'name': 'Bus 1'}})
    print(response.json())

    response = session.post(url + '/item', json={'type': bus_type['id'], 'properties': {'name': 'Bus 2'}})
    print(response.json())

if __name__ == '__main__':
    url = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8080'
    init_db(url)