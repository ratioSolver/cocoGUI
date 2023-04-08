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
    void new_user(const user &u);
    void updated_user(const user &u);
    void removed_user(const user &u);

    void new_sensor_type(const sensor_type &s);
    void updated_sensor_type(const sensor_type &s);
    void removed_sensor_type(const sensor_type &s);

    void new_sensor(const sensor &s);
    void updated_sensor(const sensor &s);
    void removed_sensor(const sensor &s);

    void new_sensor_value(const sensor &s, const std::chrono::milliseconds::rep &time, const json::json &value);
    void new_sensor_state(const sensor &s, const std::chrono::milliseconds::rep &time, const json::json &state);

    void new_solver(const coco_executor &exec);
    void removed_solver(const coco_executor &exec);

    void state_changed(const coco_executor &exec);

    void flaw_created(const coco_executor &exec, const ratio::flaw &f);
    void flaw_state_changed(const coco_executor &exec, const ratio::flaw &f);
    void flaw_cost_changed(const coco_executor &exec, const ratio::flaw &f);
    void flaw_position_changed(const coco_executor &exec, const ratio::flaw &f);
    void current_flaw(const coco_executor &exec, const ratio::flaw &f);

    void resolver_created(const coco_executor &exec, const ratio::resolver &r);
    void resolver_state_changed(const coco_executor &exec, const ratio::resolver &r);
    void current_resolver(const coco_executor &exec, const ratio::resolver &r);

    void causal_link_added(const coco_executor &exec, const ratio::flaw &f, const ratio::resolver &r);

    void executor_state_changed(const coco_executor &exec, ratio::executor::executor_state state);

    void tick(const coco_executor &exec, const utils::rational &time);

    void start(const coco_executor &exec, const std::unordered_set<ratio::atom *> &atoms);
    void end(const coco_executor &exec, const std::unordered_set<ratio::atom *> &atoms);

  private:
    const std::string coco_host;
    const unsigned short coco_port;
    crow::SimpleApp app;
    std::unordered_map<crow::websocket::connection *, std::string> connections;
    std::unordered_map<std::string, crow::websocket::connection *> users;
  };
} // namespace coco_gui