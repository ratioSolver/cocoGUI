#pragma once

#include "coco_listener.h"
#include "crow_all.h"

namespace coco::coco_gui
{

  class coco_gui : public coco::coco_listener
  {
  public:
    coco_gui(coco::coco_core &cc, const std::string &coco_host = COCO_HOST, const unsigned short coco_port = COCO_PORT);
  };
} // namespace coco_gui