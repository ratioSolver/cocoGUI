#include "coco_gui.h"
#include "mongo_db.h"
#include "mqtt_middleware.h"

int main(int argc, char const *argv[])
{
    mongocxx::instance inst{}; // This should be done only once.

    coco::mongo_db mongodb;
    coco::coco_core cc(mongodb);

    cc.add_middleware(new coco::mqtt_middleware(cc));

    cc.connect();

    cc.load_rules({"extern/coco/rules/rules.clp"});

    cc.init();

    coco::coco_gui::coco_gui gui(cc);
    auto srv_st = std::async(std::launch::async, [&]
                             { gui.start(); });
    gui.wait_for_server_start();

    return 0;
}
