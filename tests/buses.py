import sys
import requests
import random
import time

def drive_buses(url):
    session = requests.Session()

    # Get the buses
    response = session.get(url + '/items?type_name=Bus')
    buses = response.json()
    print(buses)

    lat = 46.0677293
    lon = 11.1215698
    range_offset = 0.01
    bus_moves = 0.0001
    bus_locations = {}
    for bus in buses:
        bus_locations[bus['id']] = {'lat': random.uniform(lat - range_offset, lat + range_offset), 'lon': random.uniform(lon - range_offset, lon + range_offset)}

    # Drive the buses
    while True:
        for bus_id, location in bus_locations.items():
            location = {'lat': location['lat'] + random.uniform(-bus_moves, bus_moves), 'lon': location['lon'] + random.uniform(-bus_moves, bus_moves)}
            response = session.post(url + '/data/' + str(bus_id), json={'geometry': {'type': 'Point', 'coordinates': [location['lon'], location['lat']]}})
            print(response.status_code)
            time.sleep(10)

if __name__ == '__main__':
    url = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8080'
    drive_buses(url)