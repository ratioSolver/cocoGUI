#pragma once

#include "server.h"
#include "coco_listener.h"

namespace coco::coco_gui
{
  class coco_gui : public network::server, public coco::coco_listener
  {
  public:
    coco_gui(coco::coco_core &cc, const std::string &coco_host = COCO_HOST, const unsigned short coco_port = COCO_PORT);

  private:
    void login(network::request &req, network::response &res);

    bool authorize(network::request &req, network::response &res, bool admin = false);

    void get_users(network::request &req, network::response &res);
    void create_user(network::request &req, network::response &res);
    void update_user(network::request &req, network::response &res);
    void delete_user(network::request &req, network::response &res);

    void get_sensor_types(network::request &req, network::response &res);
    void create_sensor_type(network::request &req, network::response &res);

    void get_sensors(network::request &req, network::response &res);
    void create_sensor(network::request &req, network::response &res);

    void get_sensor_values(network::request &req, network::response &res);
    void publish_sensor_value(network::request &req, network::response &res);

  private:
    void on_ws_open(network::websocket_session &ws);
    void on_ws_message(network::websocket_session &ws, const std::string &msg);
    void on_ws_error(network::websocket_session &ws, const boost::system::error_code &ec);

  private:
    void new_user(const user &u) override;
    void updated_user(const user &u) override;
    void removed_user(const user &u) override;

    void new_sensor_type(const sensor_type &s) override;
    void updated_sensor_type(const sensor_type &s) override;
    void removed_sensor_type(const sensor_type &s) override;

    void new_sensor(const sensor &s) override;
    void updated_sensor(const sensor &s) override;
    void removed_sensor(const sensor &s) override;

    void new_sensor_value(const sensor &s, const std::chrono::system_clock::time_point &time, const json::json &value) override;
    void new_sensor_state(const sensor &s, const std::chrono::system_clock::time_point &time, const json::json &state) override;

    void new_solver(const coco_executor &exec) override;
    void removed_solver(const coco_executor &exec) override;

    void state_changed(const coco_executor &exec) override;

    void flaw_created(const coco_executor &exec, const ratio::flaw &f) override;
    void flaw_state_changed(const coco_executor &exec, const ratio::flaw &f) override;
    void flaw_cost_changed(const coco_executor &exec, const ratio::flaw &f) override;
    void flaw_position_changed(const coco_executor &exec, const ratio::flaw &f) override;
    void current_flaw(const coco_executor &exec, const ratio::flaw &f) override;

    void resolver_created(const coco_executor &exec, const ratio::resolver &r) override;
    void resolver_state_changed(const coco_executor &exec, const ratio::resolver &r) override;
    void current_resolver(const coco_executor &exec, const ratio::resolver &r) override;

    void causal_link_added(const coco_executor &exec, const ratio::flaw &f, const ratio::resolver &r) override;

    void executor_state_changed(const coco_executor &exec, ratio::executor::executor_state state) override;

    void tick(const coco_executor &exec, const utils::rational &time) override;

    void start(const coco_executor &exec, const std::unordered_set<ratio::atom *> &atoms) override;
    void end(const coco_executor &exec, const std::unordered_set<ratio::atom *> &atoms) override;

  private:
    void broadcast(const std::string &&msg, bool to_all = true);

  private:
    std::unordered_map<network::websocket_session *, std::string> ws_to_user;
    std::unordered_map<std::string, network::websocket_session *> user_to_ws;
  };
} // namespace coco_gui