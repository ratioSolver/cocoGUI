#include "coco_gui.h"
#include "mongo_db.h"
#include "mqtt_middleware.h"

int main(int argc, char const *argv[])
{
    std::vector<std::string> rules;
    // we parse the command line arguments..
    for (int i = 1; i < argc - 1; i++)
        if (std::string(argv[i]) == "-rules")
        {
            i++;
            rules.clear();
            while (i < argc && argv[i][0] != '-')
                rules.push_back(argv[i++]);
        }

    mongocxx::instance inst{}; // This should be done only once.

    coco::mongo_db mongodb;
    coco::coco_core cc(mongodb);

    cc.add_middleware(new coco::mqtt_middleware(cc));

    cc.connect();

    cc.load_rules(rules);

    cc.init();

    coco::coco_gui::coco_gui gui(cc);
    gui.network::server::start();

    return 0;
}
