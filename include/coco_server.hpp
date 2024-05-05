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

    private:
        json::json j_open_api{{"openapi", "3.1.0"},
                              {"info", {{"title", "Coco API"}, {"version", "1.0"}}}};
        json::json j_async_api{{"asyncapi", "3.0.0"},
                               {"info", {{"title", "Coco API"}, {"version", "1.0"}}}};
        std::unordered_set<network::ws_session *> clients;
    };
} // namespace coco