#pragma once

#include "coco_db.hpp"
#include "coco_core.hpp"
#include "server.hpp"

namespace coco
{
    class coco_server : public coco::coco_core, private network::server
    {
    public:
        coco_server();

        void start() { network::server::start(); }

    private:
        std::unique_ptr<network::response> index(network::request &req);
        std::unique_ptr<network::response> assets(network::request &req);
        std::unique_ptr<network::response> open_api(network::request &req);
        std::unique_ptr<network::response> async_api(network::request &req);

        std::unique_ptr<network::response> sensor_types(network::request &req);
        std::unique_ptr<network::response> sensors(network::request &req);

        void on_ws_open(network::ws_session &ws);
        void on_ws_message(network::ws_session &ws, const std::string &msg);
        void on_ws_close(network::ws_session &ws);
        void on_ws_error(network::ws_session &ws, const boost::system::error_code &);

        void new_solver(const coco_executor &exec) override;
        void deleted_solver(const uintptr_t id) override;

    private:
        void broadcast(const json::json &msg)
        {
            auto msg_str = msg.to_string();
            for (auto client : clients)
                client->send(msg_str);
        }

    private:
        json::json j_components{{"schemas",
                                 {{"sensor_type", {{"type", "object"}, {"properties", {{"id", {{"type", "string"}}}, {"name", {{"type", "string"}}}, {"description", {{"type", "string"}}}}}}},
                                  {"sensor", {{"type", "object"}, {"properties", {{"id", {{"type", "string"}}}, {"type", {{"type", "string"}}}, {"name", {{"type", "string"}}}, {"description", {{"type", "string"}}}}}}},
                                  {"solver", {{"type", "object"}, {"properties", {{"id", {{"type", "string"}}}, {"name", {{"type", "string"}}}, {"state", {{"type", "string"}, {"enum", {"reasoning", "adapting", "idle", "executing", "finished", "failed"}}}}}}}}}}};
        json::json j_open_api{
            {"openapi", "3.0.0"},
            {"info", {{"title", "CoCo API"}, {"description", "The combined deduCtiOn and abduCtiOn (CoCo) API"}, {"version", "1.0"}}},
            {"servers", json::to_array({{"url", "http://" SERVER_HOST ":" + std::to_string(SERVER_PORT)}})},
            {"paths",
             {{"/", {{"get", {{"summary", "Index"}, {"description", "Index page"}, {"responses", {{"200", {{"description", "Index page"}}}}}}}}},
              {"/assets/{file}", {{"get", {{"summary", "Assets"}, {"description", "Assets"}, {"parameters", json::to_array({{{"name", "file"}, {"in", "path"}, {"required", true}, {"schema", {{"type", "string"}}}}})}, {"responses", {{"200", {{"description", "Index page"}}}}}}}}},
              {"/open_api", {{"get", {{"summary", "Retrieve OpenAPI Specification"}, {"description", "Endpoint to fetch the OpenAPI Specification document"}, {"responses", {{"200", {{"description", "Successful response with OpenAPI Specification document"}}}}}}}}},
              {"/async_api", {{"get", {{"summary", "Retrieve AsyncAPI Specification"}, {"description", "Endpoint to fetch the AsyncAPI Specification document"}, {"responses", {{"200", {{"description", "Successful response with AsyncAPI Specification document"}}}}}}}}},
              {"/sensor_types", {{"get", {{"summary", "Retrieve CoCo sensor types"}, {"description", "Endpoint to fetch all the managed sensor types"}, {"responses", {{"200", {{"description", "Successful response with the stored sensor types"}, {"content", {{"application/json", {{"schema", {{"type", "array"}, {"items", {{"$ref", "#/components/schemas/sensor_type"}}}}}}}}}}}}}}}}},
              {"/sensors", {{"get", {{"summary", "Retrieve CoCo sensors"}, {"description", "Endpoint to fetch all the managed sensors"}, {"responses", {{"200", {{"description", "Successful response with the stored sensors"}, {"content", {{"application/json", {{"schema", {{"type", "array"}, {"items", {{"$ref", "#/components/schemas/sensor"}}}}}}}}}}}}}}}}}}},
            {"components", j_components}};
        json::json j_async_api{
            {"asyncapi", "3.0.0"},
            {"info", {{"title", "CoCo API"}, {"description", "The combined deduCtiOn and abduCtiOn (CoCo) WebSocket API"}, {"version", "1.0"}}},
            {"servers", {"coco", {{"host", SERVER_HOST ":" + std::to_string(SERVER_PORT)}, {"pathname", "/coco"}, {"protocol", "ws"}}}},
            {"channels", {{"coco", {{"address", "/"}}}}},
            {"components", j_components}};
        std::unordered_set<network::ws_session *> clients;
    };
} // namespace coco