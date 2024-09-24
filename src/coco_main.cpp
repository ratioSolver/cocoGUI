#include <mongocxx/instance.hpp>
#include "coco_server.hpp"

int main([[maybe_unused]] int argc, [[maybe_unused]] char const *argv[])
{
    mongocxx::instance inst{}; // This should be done only once.

    coco::coco_server server;
#ifdef ENABLE_SSL
    server.load_certificate("extern/coco/extern/rationet/tests/cert.pem", "extern/coco/extern/rationet/tests/key.pem");
#endif

    server.server::start();
    return 0;
}
