#include "coco_server.hpp"

namespace coco
{
    coco_server::coco_server() : network::server()
    {
        add_route(network::GET, "^/$", std::bind(&coco_server::index, this, std::placeholders::_1));
        add_route(network::GET, "^(/assets/.+)|/.+\\.ico|/.+\\.png", std::bind(&coco_server::assets, this, std::placeholders::_1));
    }

    std::unique_ptr<network::response> coco_server::index(network::request &) { return std::make_unique<network::file_response>("client/dist/index.html"); }
    std::unique_ptr<network::response> coco_server::assets(network::request &req)
    {
        std::string target = req.get_target();
        if (target.find('?') != std::string::npos)
            target = target.substr(0, target.find('?'));
        return std::make_unique<network::file_response>("client/dist" + target);
    }
} // namespace coco
