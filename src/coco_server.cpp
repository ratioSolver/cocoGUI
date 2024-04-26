#include "coco_server.hpp"

namespace coco
{
    coco_server::coco_server() : network::server()
    {
        add_route(network::GET, "/", std::bind(&coco_server::index, this, std::placeholders::_1));
    }

    std::unique_ptr<network::response> coco_server::index(network::request &) { return std::make_unique<network::file_response>("index.html"); }
} // namespace coco
