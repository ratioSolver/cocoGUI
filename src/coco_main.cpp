#include <mongocxx/instance.hpp>
#include "coco_server.hpp"
#include "mongo_db.hpp"
#include "coco_api.hpp"

int main([[maybe_unused]] int argc, [[maybe_unused]] char const *argv[])
{
    mongocxx::instance inst{}; // This should be done only once.

    std::string coco_name = COCO_NAME;

    std::string server_host = SERVER_HOST;
    std::size_t server_port = SERVER_PORT;

    std::string db_host = MONGODB_HOST;
    std::string db_port = MONGODB_PORT;

#ifdef ENABLE_TRANSFORMER
    std::string transformer_host = TRANSFORMER_HOST;
    std::size_t transformer_port = TRANSFORMER_PORT;
#endif

#ifdef ENABLE_AUTH
    std::string users_db_host = MONGODB_USERS_HOST;
    std::string users_db_port = MONGODB_USERS_PORT;
#endif

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

#ifdef ENABLE_AUTH
    auto env_users_db_host = std::getenv("MONGODB_USERS_HOST");
    if (env_users_db_host)
        users_db_host = env_users_db_host;
    auto env_users_db_port = std::getenv("MONGODB_USERS_PORT");
    if (env_users_db_port)
        users_db_port = env_users_db_port;

    auto db = std::make_unique<coco::mongo_db>(json::json{{"name", coco_name}}, "mongodb://" + db_host + ":" + db_port, "mongodb://" + users_db_host + ":" + users_db_port);
#else
    auto db = std::make_unique<coco::mongo_db>(json::json{{"name", coco_name}}, "mongodb://" + db_host + ":" + db_port);
#endif

    json::json schemas;
    for (const auto &[name, schema] : coco::geometry_schema.as_object())
        schemas["components"]["schemas"][name] = schema;

#ifdef ENABLE_TRANSFORMER
    coco::coco_server server(server_host, server_port, std::move(db), std::move(schemas), transformer_host, transformer_port);
#else
    coco::coco_server server(server_host, server_port, std::move(db), std::move(schemas));
#endif
#ifdef ENABLE_SSL
    server.load_certificate("extern/coco/extern/rationet/tests/cert.pem", "extern/coco/extern/rationet/tests/key.pem");
#endif

    server.server::start();
    return 0;
}
