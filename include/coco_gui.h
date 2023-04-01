#pragma once

#include "coco_listener.h"
#include "crow_all.h"

namespace coco::coco_gui
{

  class coco_gui : public coco::coco_listener
  {
  public:
    coco_gui(coco::coco_core &cc, const std::string &coco_host = COCO_HOST, const unsigned short coco_port = COCO_PORT);

    void start();
    void wait_for_server_start();
    void stop();

  private:
    const std::string coco_host;
    const unsigned short coco_port;
    crow::SimpleApp app;
    std::unordered_map<crow::websocket::connection *, std::string> connections;
    std::unordered_map<std::string, crow::websocket::connection *> users;
  };
} // namespace coco_gui