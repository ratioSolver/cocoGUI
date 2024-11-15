import sys
import requests
import logging
import warnings
from urllib3.exceptions import InsecureRequestWarning
from faker import Faker
import random

# Suppress InsecureRequestWarning from urllib3
warnings.filterwarnings('ignore', category=InsecureRequestWarning)

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.DEBUG)
logger.addHandler(handler)

fake = Faker('it_IT')

def init_db(url):
    session = requests.Session()

    login_response = session.post(url + '/login', json={'username': 'admin', 'password': 'admin'}, verify=False)
    if login_response.status_code != 200:
        logger.error(login_response.json())
        return
    token = login_response.json()['token']
    
    # Create the city area type
    response = requests.post(url + '/type', headers={'Authorization': 'Bearer ' + token}, verify=False,
                             json={'name': 'CityArea', 'description': 'A city area',
                                   'static_properties': {'name': {'type': 'string'},
                                                         'rough_path': {'type': 'boolean'},
                                                         'area': {'type': 'json', 'schema': {'$ref': '#/components/schemas/geometry'}}},
                                   'dynamic_properties': {'pollution': {'type': 'symbol', 'values': ['Low', 'Medium', 'High']},
                                                          'crowding': {'type': 'integer', 'min': 0, 'max': 20},
                                                          'noise_pollution': {'type': 'integer', 'min': 0, 'max': 100}}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    area_type = response.json()

    # Update the user type
    logger.info('Getting the User type')
    response = session.get(url + '/type?name=User', headers={'Authorization': 'Bearer ' + token}, verify=False)
    if response.status_code != 200:
        logger.error(response.json())
        return
    user_type = response.json()
    logger.debug('User type id: %s', user_type['id'])
    logger.info('Updating the User type')
    response = session.put(url + '/type/' + user_type['id'], headers={'Authorization': 'Bearer ' + token}, verify=False,
                           json={'static_properties': {'role': {'type': 'integer', 'default': 2, 'min': 0, 'max': 2},
                                                       'name': {'type': 'string'}},
                                 'dynamic_properties': {'area': {'type': 'item', 'type_id': area_type['id']},
                                                        'heath_status': {'type': 'symbol', 'values': ['Low', 'Medium', 'High']},
                                                        'physical_distress': {'type': 'symbol', 'values': ['Low', 'Medium', 'High']},
                                                        'physical_distress_triggering_factors': {'type': 'symbol', 'multiple': True, 'values': ['pollution', 'crowding', 'noise_pollution', 'breath_rate', 'hypotension_rate']},
                                                        'mental_distress': {'type': 'symbol', 'values': ['Low', 'Medium', 'High']},
                                                        'anxiety': {'type': 'symbol', 'values': ['Low', 'Medium', 'High']}}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    user_type = response.json()

    # Create the questionnaire type
    response = requests.post(url + '/type', headers={'Authorization': 'Bearer ' + token}, verify=False,
                             json={'name': 'Questionnaire', 'description': 'A questionnaire',
                                   'static_properties': {'user': {'type': 'item', 'type_id': user_type['id']},
                                                         'comorbidity': {'type': 'integer', 'min': 0, 'max': 5}}})
    if response.status_code != 200:
        logger.error(response.json())
        return

    # Create the sensor type
    response = requests.post(url + '/type', headers={'Authorization': 'Bearer ' + token}, verify=False,
                             json={'name': 'Sensor', 'description': 'A sensor',
                                   'dynamic_properties': {'user': {'type': 'item', 'type_id': user_type['id']}}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    sensor_type = response.json()

    # Create the breath sensor type
    response = requests.post(url + '/type', headers={'Authorization': 'Bearer ' + token}, verify=False,
                             json={'name': 'BreathSensor', 'description': 'A breath sensor', 'parents': [sensor_type['id']],
                                   'dynamic_properties': {'breath_rate': {'type': 'integer', 'min': 0, 'max': 50}}})
    if response.status_code != 200:
        logger.error(response.json())
        return

    # Create the heart rate sensor type
    response = requests.post(url + '/type', headers={'Authorization': 'Bearer ' + token}, verify=False,
                             json={'name': 'HypotensionSensor', 'description': 'A hypotension sensor', 'parents': [sensor_type['id']],
                                   'dynamic_properties': {'hypotension_rate': {'type': 'integer', 'min': 0, 'max': 200}}})
    if response.status_code != 200:
        logger.error(response.json())
        return

    # Create the rules
    with open('physical_distress_rule.clp', 'r') as file:
        data = file.read()
    logger.info('Creating the physical distress rule')
    logger.debug('Rule content: %s', data)
    response = requests.post(url + '/reactive_rule', headers={'Authorization': 'Bearer ' + token}, verify=False, json={'name': 'physical_distress_rule', 'content': data})
    if response.status_code != 200:
        logger.error(response.json())
        return

    # Create some areas
    response = requests.post(url + '/item', headers={'Authorization': 'Bearer ' + token}, verify=False,
                             json={'type': area_type['id'], 'properties': {'name': 'Parco Belvedere', 'rough_path': True, 'area': { "type": "Polygon", "coordinates": [ [ [ 8.891968081548349, 44.420925557767191 ], [ 8.891995209786821, 44.420907956269978 ], [ 8.89204850148305, 44.42089180199681 ], [ 8.892098111544856, 44.420896620437283 ], [ 8.892135319451892, 44.420951121860917 ], [ 8.892192857415207, 44.420948385525264 ], [ 8.892223282710454, 44.420866219927191 ], [ 8.892274396608681, 44.420804780042928 ], [ 8.892339857917481, 44.42079682957894 ], [ 8.892381088636157, 44.420986284790153 ], [ 8.892465265798656, 44.421047402440927 ], [ 8.892524214755408, 44.42102882256745 ], [ 8.892838820718438, 44.421065309841367 ], [ 8.893015956485796, 44.421194754793262 ], [ 8.893097625619735, 44.421254024071395 ], [ 8.893179294918685, 44.421313293290687 ], [ 8.893263476915267, 44.421372474779822 ], [ 8.893274291372011, 44.421380074169754 ], [ 8.893278168019805, 44.421382796610438 ], [ 8.8932807649699, 44.421384635589632 ], [ 8.893284189999745, 44.421387024507936 ], [ 8.893286887329985, 44.421388926599796 ], [ 8.893291930686409, 44.421392496384634 ], [ 8.893294803653015, 44.421394524678327 ], [ 8.893297049414526, 44.421396066239879 ], [ 8.893301678986815, 44.421399221513596 ], [ 8.893332692002488, 44.421421109059523 ], [ 8.89334793544249, 44.421431656465323 ], [ 8.893387983290108, 44.421431333864724 ], [ 8.893427716812481, 44.421410484864047 ], [ 8.893439171632362, 44.421404472797825 ], [ 8.893467450306616, 44.421389635849422 ], [ 8.893498491508815, 44.421382282698417 ], [ 8.893516077434214, 44.421382659253702 ], [ 8.893541054852886, 44.42139402597747 ], [ 8.893592356630645, 44.421435936358414 ], [ 8.893643658481684, 44.421477846716073 ], [ 8.893730606513911, 44.421536085162501 ], [ 8.893793370279331, 44.421561261180493 ], [ 8.8938719758013, 44.421578889687325 ], [ 8.894083622218945, 44.421590880271786 ], [ 8.894145018564553, 44.421608222499991 ], [ 8.894224196494502, 44.421656730459794 ], [ 8.894277162312896, 44.421681897108307 ], [ 8.894315337009084, 44.421689404767399 ], [ 8.894334804064982, 44.421691583477021 ], [ 8.894356158499164, 44.421692053427051 ], [ 8.894373747938102, 44.421690539292534 ], [ 8.894390712532458, 44.42168722404142 ], [ 8.894408186591443, 44.421680038111553 ], [ 8.89442182991492, 44.421672488519945 ], [ 8.894428935924786, 44.421667768706662 ], [ 8.89443195476392, 44.421665565851328 ], [ 8.894437490452917, 44.421660889594847 ], [ 8.89443975890873, 44.421656840495892 ], [ 8.894439767359476, 44.421652159114551 ], [ 8.894584378849112, 44.421360246428996 ], [ 8.894138856369999, 44.421334445521602 ], [ 8.894147231456014, 44.42121849889179 ], [ 8.89409988028412, 44.4212146737366 ], [ 8.894065698304065, 44.421222294209194 ], [ 8.893995143649493, 44.42126796211587 ], [ 8.893962780680088, 44.42124227436431 ], [ 8.893882919389784, 44.421293875297131 ], [ 8.893870091296853, 44.42130214579857 ], [ 8.893678297752324, 44.421149731672593 ], [ 8.893692005818972, 44.421141101907217 ], [ 8.893580242607586, 44.421051781016018 ], [ 8.893584677726528, 44.421030628881063 ], [ 8.89352082389224, 44.420983575232377 ], [ 8.893520913556753, 44.42093433069715 ], [ 8.893498068227222, 44.420924946550436 ], [ 8.89347601514706, 44.420894406859546 ], [ 8.893459737698612, 44.420865403023221 ], [ 8.893474710267487, 44.420852183103612 ], [ 8.893355103857026, 44.420793463737041 ], [ 8.893359845595786, 44.420741972889338 ], [ 8.893375513867351, 44.420691662621344 ], [ 8.893387968656134, 44.420681411236963 ], [ 8.893536885202064, 44.420648330715991 ], [ 8.893593450794745, 44.420627497392452 ], [ 8.89364924774798, 44.420614855755467 ], [ 8.893930624854296, 44.420582978692622 ], [ 8.893972651810712, 44.420578516501038 ], [ 8.893631217858058, 44.420513378785614 ], [ 8.893381549059063, 44.420481905987856 ], [ 8.893315758362702, 44.420464109094837 ], [ 8.893240750867795, 44.42047196114126 ], [ 8.89302541358132, 44.4204885039997 ], [ 8.892776680332991, 44.420563622410526 ], [ 8.892555844138117, 44.420632914869522 ], [ 8.892326303716962, 44.42072182449688 ], [ 8.892116233664263, 44.42087863226395 ], [ 8.892059965066229, 44.420874257652976 ], [ 8.892051947275254, 44.420862483558665 ], [ 8.891964672892451, 44.420846349018611 ], [ 8.891968081548349, 44.420925557767191 ] ] ] }}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    response = requests.post(url + '/item', headers={'Authorization': 'Bearer ' + token}, verify=False,
                             json={'type': area_type['id'], 'properties': {'name': 'Villa Piaggio', 'rough_path': True, 'area': { "type": "Polygon", "coordinates": [ [ [ 8.932175893852509, 44.417232961007677 ], [ 8.930882586363772, 44.417151607896905 ], [ 8.930842996870101, 44.417170579467985 ], [ 8.930797739660907, 44.41720242140525 ], [ 8.93059194809342, 44.417238486693854 ], [ 8.930599029296307, 44.417272872247423 ], [ 8.930605176148339, 44.417300766298659 ], [ 8.930632861624678, 44.417437326822139 ], [ 8.930672251834936, 44.417628711782299 ], [ 8.930696776221593, 44.417708994614934 ], [ 8.930731199603125, 44.41780979157425 ], [ 8.930806965175767, 44.417791112152692 ], [ 8.930808244329423, 44.417771667147342 ], [ 8.930851208351887, 44.417767372008221 ], [ 8.930873561642311, 44.417771976970869 ], [ 8.93095595855098, 44.417828347805226 ], [ 8.930990278840136, 44.417857393281075 ], [ 8.931086415693571, 44.417926232067728 ], [ 8.931243535620334, 44.418049663905094 ], [ 8.931359994959294, 44.418141651631771 ], [ 8.931497436696944, 44.418229510655109 ], [ 8.931505726971039, 44.418229605678242 ], [ 8.931512014637697, 44.418223577673629 ], [ 8.931555774877023, 44.418076086165669 ], [ 8.931582876551305, 44.417994862322317 ], [ 8.931599981523114, 44.417976237075294 ], [ 8.931642327700873, 44.417963298696499 ], [ 8.931857095449416, 44.417954686066146 ], [ 8.932301566628855, 44.417936865312299 ], [ 8.932437358784782, 44.417931364459541 ], [ 8.932317847813158, 44.41787016516831 ], [ 8.932290321766272, 44.417776700977363 ], [ 8.932290673278308, 44.4177010606873 ], [ 8.932304773224978, 44.41755470354699 ], [ 8.9323060444653, 44.41754165042083 ], [ 8.932300999778821, 44.417450810392289 ], [ 8.932286302451617, 44.417451611877482 ], [ 8.932285834887635, 44.417421542653209 ], [ 8.932331556959053, 44.417421569885867 ], [ 8.932327835929929, 44.417380785537055 ], [ 8.932312133949388, 44.417381406373792 ], [ 8.93231173968775, 44.417396440611974 ], [ 8.932214514804914, 44.417398723361181 ], [ 8.93215172495724, 44.417385632009989 ], [ 8.932148579475445, 44.417390131471358 ], [ 8.932125597552043, 44.417386066543202 ], [ 8.932126630662681, 44.417383393364702 ], [ 8.932156971844297, 44.417302270339285 ], [ 8.932175893852509, 44.417232961007677 ] ] ] }}})
    if response.status_code != 200:
        logger.error(response.json())
        return
    response = requests.post(url + '/item', headers={'Authorization': 'Bearer ' + token}, verify=False,
                             json={'type': area_type['id'], 'properties': {'name': 'Giardini Piazza Martinez', 'rough_path': True, 'area': { "type": "Polygon", "coordinates": [ [ [ 8.956830760582658, 44.40750221625796 ], [ 8.956889030970405, 44.407506109598117 ], [ 8.957306760040138, 44.407478539445925 ], [ 8.957336527370023, 44.407474769525507 ], [ 8.957366672978676, 44.407468929119986 ], [ 8.957400215736666, 44.407454537424194 ], [ 8.957416174271822, 44.407442569839148 ], [ 8.957428239614846, 44.407430510762353 ], [ 8.957437041027866, 44.407416559892525 ], [ 8.957441950239909, 44.407401167129159 ], [ 8.957444600958935, 44.407382892655193 ], [ 8.957362682245146, 44.406744480770307 ], [ 8.957353664157949, 44.406711437484752 ], [ 8.95732029583322, 44.406659749450078 ], [ 8.957305360670587, 44.406646509861581 ], [ 8.9571523018184, 44.406603239152787 ], [ 8.956813197063413, 44.406629938463858 ], [ 8.956793225985219, 44.406633621956757 ], [ 8.956768730094771, 44.406642255202726 ], [ 8.9567214862087, 44.406673386497346 ], [ 8.956702245351551, 44.406691492571248 ], [ 8.956686169909679, 44.40670875359833 ], [ 8.956675226476119, 44.406732066396394 ], [ 8.956670441165853, 44.406749529795903 ], [ 8.956666659345652, 44.406768614064042 ], [ 8.956665343383214, 44.406781856525619 ], [ 8.956664761266682, 44.406787789079225 ], [ 8.956665623095221, 44.406811016362532 ], [ 8.956745183091783, 44.407419268813769 ], [ 8.956752559676092, 44.407446999927274 ], [ 8.956759958853109, 44.407461227007495 ], [ 8.956774390207491, 44.407476537092883 ], [ 8.956797864503512, 44.407491130408545 ], [ 8.956830760582658, 44.40750221625796 ] ] ] }}})
    if response.status_code != 200:
        logger.error(response.json())
        return

    # Create some users
    first_name = fake.first_name()
    last_name = fake.last_name()
    response = session.post(url + '/user', headers={'Authorization': 'Bearer ' + token}, verify=False,
                            json={'username': 'raise', 'password': 'raise', 'personal_data': {'first_name': first_name, 'last_name': last_name}, 'data': {'role': 1, 'name': first_name}})
    for i in range(10):
        profile = fake.simple_profile()
        username = profile['username'] + str(i)
        password = fake.password()
        first_name = ''
        if bool(random.getrandbits(1)):
            first_name = fake.first_name_female()
        else:
            first_name = fake.first_name_male()
        last_name = fake.last_name()

        response = session.post(url + '/user', headers={'Authorization': 'Bearer ' + token}, verify=False,
                                json={'username': username, 'password': password, 'personal_data': {'first_name': first_name, 'last_name': last_name}, 'data': {'name': first_name}})
        if response.status_code != 200:
            logger.error(response.json())
            return

if __name__ == '__main__':
    url = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8080'
    init_db(url)