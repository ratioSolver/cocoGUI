#include <mongocxx/instance.hpp>
#include "coco_server.hpp"

int main([[maybe_unused]] int argc, [[maybe_unused]] char const *argv[])
{
    mongocxx::instance inst{}; // This should be done only once.

    coco::coco_server server;
    server.start();
    return 0;
}
