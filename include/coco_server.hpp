#pragma once

#include "coco_core.hpp"
#include "server.hpp"

namespace coco
{
    class coco_server : public network::server
    {
    public:
        coco_server();

    private:
        std::unique_ptr<network::response> index(network::request &req);
        std::unique_ptr<network::response> assets(network::request &req);
    };
} // namespace coco