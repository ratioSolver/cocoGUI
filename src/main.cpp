#include "coco_server.hpp"

int main([[maybe_unused]] int argc, [[maybe_unused]] char const *argv[])
{
    coco::coco_server server;
    server.start();
    return 0;
}
