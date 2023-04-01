#include "coco_gui.h"

namespace coco::coco_gui
{

    coco_gui::coco_gui(coco::coco_core &cc, const std::string &coco_host, const unsigned short coco_port) : coco::coco_listener(cc)
    {
    }
} // namespace coco_gui