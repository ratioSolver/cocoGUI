#pragma once

#include "coco_core.hpp"
#include "server.hpp"

namespace coco
{
    class coco_server : public network::server
    {
    public:
        coco_server();
    };
} // namespace coco