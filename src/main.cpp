#include "coco_gui.h"
#include "mongo_db.h"
#include "mqtt_middleware.h"

int main(int argc, char const *argv[])
{
    mongocxx::instance inst{}; // This should be done only once.

    coco::mongo_db mongodb;
    coco::coco_core cc(mongodb);

    coco::mqtt_middleware mqtt_mw(cc);

    coco::coco_gui::coco_gui gui(cc);

    return 0;
}
