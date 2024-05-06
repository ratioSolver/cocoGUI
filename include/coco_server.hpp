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

        void on_ws_open(network::ws_session &ws);
        void on_ws_message(network::ws_session &ws, const std::string &msg);
        void on_ws_close(network::ws_session &ws);
        void on_ws_error(network::ws_session &ws);

        void new_solver(const coco_executor &exec) override;
        void deleted_solver(const uintptr_t id) override;

    private:
        void broadcast(const json::json &msg)
        {
            for (auto client : clients)
                client->send(msg.to_string());
        }

    private:
        json::json j_components{{"schemas",
                                 {{"sensor_type", {{"type", "object"}, {"properties", {{"id", {{"type", "string"}}}, {"name", {{"type", "string"}}}, {"description", {{"type", "string"}}}}}}},
                                  {"sensor", {{"type", "object"}, {"properties", {{"id", {{"type", "string"}}}, {"type", {{"type", "string"}}}, {"name", {{"type", "string"}}}, {"description", {{"type", "string"}}}}}}},
                                  {"solver", {{"type", "object"}, {"properties", {{"id", {{"type", "string"}}}, {"name", {{"type", "string"}}}, {"state", {{"type", "string"}, {"enum", {"reasoning", "adapting", "idle", "executing", "finished", "failed"}}}}}}}}}}};
        json::json j_open_api{
            {"openapi", "3.0.0"},
            {"info", {{"title", "Coco API"}, {"version", "1.0"}}},
            {"servers", json::to_array({{"url", "http://" SERVER_HOST ":" + std::to_string(SERVER_PORT)}})},
            {"paths",
             {{"/", {{"get", {{"summary", "Index"}, {"description", "Index page"}, {"responses", {{"200", {{"description", "Index page"}}}}}}}}},
              {"/assets/{file}", {{"get", {{"summary", "Assets"}, {"description", "Assets"}, {"parameters", json::to_array({{{"name", "file"}, {"in", "path"}, {"required", true}, {"schema", {{"type", "string"}}}}})}, {"responses", {{"200", {{"description", "Index page"}}}}}}}}},
              {"/open_api", {{"get", {{"summary", "Open API"}, {"description", "Open API"}, {"responses", {{"200", {{"description", "Index page"}}}}}}}}},
              {"/async_api", {{"get", {{"summary", "Async API"}, {"description", "Async API"}, {"responses", {{"200", {{"description", "Index page"}}}}}}}}}}},
            {"components", j_components}};
        json::json j_async_api{
            {"asyncapi", "3.0.0"},
            {"info", {{"title", "Coco API"}, {"version", "1.0"}}},
            {"servers", {"coco", {{"host", SERVER_HOST ":" + std::to_string(SERVER_PORT)}, {"pathname", "/coco"}, {"protocol", "ws"}}}},
            {"channels", {{"coco", {{"address", "/"}}}}},
            {"components", j_components}};
        std::unordered_set<network::ws_session *> clients;
    };
} // namespace coco