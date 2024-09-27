#include <mongocxx/instance.hpp>
#include "coco_server.hpp"
#include "mongo_db.hpp"

int main([[maybe_unused]] int argc, [[maybe_unused]] char const *argv[])
{
    mongocxx::instance inst{}; // This should be done only once.

    std::string coco_name = COCO_NAME;

    std::string server_host = SERVER_HOST;
    std::size_t server_port = SERVER_PORT;

    std::string db_host = MONGODB_HOST;
    std::string db_port = MONGODB_PORT;

    std::string transformer_host = TRANSFORMER_HOST;
    std::size_t transformer_port = TRANSFORMER_PORT;

    auto env_coco_name = std::getenv("COCO_NAME");
    if (env_coco_name)
        coco_name = env_coco_name;

    auto env_server_host = std::getenv("SERVER_HOST");
    if (env_server_host)
        server_host = env_server_host;
    auto env_server_port = std::getenv("SERVER_PORT");
    if (env_server_port)
        server_port = std::stoi(env_server_port);

    auto env_db_host = std::getenv("MONGODB_HOST");
    if (env_db_host)
        db_host = env_db_host;
    auto env_db_port = std::getenv("MONGODB_PORT");
    if (env_db_port)
        db_port = env_db_port;

#ifdef ENABLE_TRANSFORMER
    auto env_transformer_host = std::getenv("TRANSFORMER_HOST");
    if (env_transformer_host)
        transformer_host = env_transformer_host;
    auto env_transformer_port = std::getenv("TRANSFORMER_PORT");
    if (env_transformer_port)
        transformer_port = std::stoi(env_transformer_port);
#endif

#ifdef ENABLE_TRANSFORMER
    coco::coco_server server(server_host, server_port, std::make_unique<coco::mongo_db>(json::json{{"name", coco_name}}, "mongodb://" + db_host + ":" + db_port), transformer_host, transformer_port);
#else
    coco::coco_server server(server_host, server_port, std::make_unique<coco::mongo_db>(json::json{{"name", coco_name}}, "mongodb://" + db_host + ":" + db_port));
#endif
#ifdef ENABLE_SSL
    server.load_certificate("extern/coco/extern/rationet/tests/cert.pem", "extern/coco/extern/rationet/tests/key.pem");
#endif

    server.server::start();
    return 0;
}
