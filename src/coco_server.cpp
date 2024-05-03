#include "coco_server.hpp"
#include "mongo_db.hpp"
#include "logging.hpp"

namespace coco
{
    coco_server::coco_server() : coco_core(std::make_unique<mongo_db>()), network::server()
    {
        add_route(network::GET, "^/$", std::bind(&coco_server::index, this, std::placeholders::_1));
        add_route(network::GET, "^(/assets/.+)|/.+\\.ico|/.+\\.png", std::bind(&coco_server::assets, this, std::placeholders::_1));

        add_ws_route("/coco").on_open(std::bind(&coco_server::on_ws_open, this, std::placeholders::_1)).on_message(std::bind(&coco_server::on_ws_message, this, std::placeholders::_1, std::placeholders::_2)).on_close(std::bind(&coco_server::on_ws_close, this, std::placeholders::_1)).on_error(std::bind(&coco_server::on_ws_error, this, std::placeholders::_1));
    }

    std::unique_ptr<network::response> coco_server::index(network::request &) { return std::make_unique<network::file_response>("client/dist/index.html"); }
    std::unique_ptr<network::response> coco_server::assets(network::request &req)
    {
        std::string target = req.get_target();
        if (target.find('?') != std::string::npos)
            target = target.substr(0, target.find('?'));
        return std::make_unique<network::file_response>("client/dist" + target);
    }

    void coco_server::on_ws_open(network::ws_session &ws) { clients.insert(&ws); }
    void coco_server::on_ws_message(network::ws_session &ws, const std::string &msg)
    {
        auto x = json::load(msg);
        if (x.get_type() != json::json_type::object || !x.get_object().count("type"))
        {
            ws.close();
            return;
        }
    }
    void coco_server::on_ws_close(network::ws_session &ws) { clients.erase(&ws); }
    void coco_server::on_ws_error(network::ws_session &ws) { clients.erase(&ws); }
} // namespace coco
