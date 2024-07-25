#pragma once

#include "coco_db.hpp"
#include "coco_core.hpp"
#include "server.hpp"
#include "graph.hpp"
#include "agent.hpp"
#include "state_variable.hpp"
#include "reusable_resource.hpp"
#include "consumable_resource.hpp"

namespace coco
{
  class coco_server : public coco::coco_core, private network::server
  {
  public:
    coco_server();

    void start() { network::server::start(); }

  private:
    std::unique_ptr<network::response> index(network::request &req);
    std::unique_ptr<network::response> assets(network::request &req);
    std::unique_ptr<network::response> open_api(network::request &req);
    std::unique_ptr<network::response> async_api(network::request &req);

    std::unique_ptr<network::response> get_types(network::request &req);
    std::unique_ptr<network::response> create_type(network::request &req);
    std::unique_ptr<network::response> update_type(network::request &req);
    std::unique_ptr<network::response> delete_type(network::request &req);

    std::unique_ptr<network::response> get_items(network::request &req);
    std::unique_ptr<network::response> create_item(network::request &req);

    void on_ws_open(network::ws_session &ws);
    void on_ws_message(network::ws_session &ws, const std::string &msg);
    void on_ws_close(network::ws_session &ws);
    void on_ws_error(network::ws_session &ws, const boost::system::error_code &);

    void new_solver(const coco_executor &exec) override;
    void deleted_solver(const uintptr_t id) override;

    void new_reactive_rule(const rule &r) override;
    void new_deliberative_rule(const rule &r) override;

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

  private:
    void broadcast(const json::json &msg)
    {
      auto msg_str = msg.dump();
      for (auto client : clients)
        client->send(msg_str);
    }

  private:
    std::unordered_set<network::ws_session *> clients;
  };

  const json::json j_schemas{
      property_schema,
      integer_property_schema,
      float_property_schema,
      string_property_schema,
      symbol_property_schema,
      item_property_schema,
      json_property_schema,
      coco_type_schema,
      coco_item_schema,
      data_schema,
      coco_rule_schema,
      ratio::rational_schema,
      ratio::inf_rational_schema,
      ratio::value_schema,
      ratio::bool_value_schema,
      ratio::int_value_schema,
      ratio::real_value_schema,
      ratio::time_value_schema,
      ratio::string_value_schema,
      ratio::enum_value_schema,
      ratio::item_value_schema,
      ratio::item_schema,
      ratio::atom_schema,
      ratio::solver_state_schema,
      ratio::timeline_schema,
      ratio::solver_timeline_schema,
      ratio::flaw_schema,
      ratio::resolver_schema,
      ratio::solver_graph_schema,
      ratio::agent_timeline_schema,
      ratio::state_variable_timeline_value_schema,
      ratio::state_variable_timeline_schema,
      ratio::reusable_resource_timeline_value_schema,
      ratio::reusable_resource_timeline_schema,
      ratio::consumable_resource_timeline_value_schema,
      ratio::consumable_resource_timeline_schema,
      ratio::executor::solver_schema,
      error_schema};
  const json::json j_messages{
      taxonomy_message,
      reactive_rules_message,
      deliberative_rules_message,
      solvers_message,
      new_type_message,
      updated_type_message,
      deleted_type_message,
      new_item_message,
      updated_item_message,
      deleted_item_message,
      ratio::solver_graph_message,
      ratio::flaw_created_message,
      ratio::flaw_state_changed_message,
      ratio::flaw_cost_changed_message,
      ratio::flaw_position_changed_message,
      ratio::current_flaw_message,
      ratio::resolver_created_message,
      ratio::resolver_state_changed_message,
      ratio::current_resolver_message,
      ratio::causal_link_added_message,
      ratio::executor::new_solver_message,
      ratio::executor::solver_execution_state_changed_message,
      ratio::executor::tick_message,
      ratio::executor::solver_state_message};
  const json::json j_open_api{
      {"openapi", "3.0.0"},
      {"info",
       {{"title", "CoCo API"},
        {"description", "The combined deduCtiOn and abduCtiOn (CoCo) API"},
        {"version", "1.0"}}},
      {"servers", std::vector<json::json>{{"url", "http://" SERVER_HOST ":" + std::to_string(SERVER_PORT)}}},
      {"paths",
       {{"/",
         {{"get",
           {{"summary", "Index"},
            {"description", "Index page"},
            {"responses",
             {{"200", {{"description", "Index page"}}}}}}}}},
        {"/assets/{file}",
         {{"get",
           {{"summary", "Assets"},
            {"description", "Assets"},
            {"parameters", std::vector<json::json>{{{"name", "file"}, {"in", "path"}, {"required", true}, {"schema", {{"type", "string"}}}}}},
            {"responses",
             {{"200", {{"description", "Index page"}}}}}}}}},
        {"/open_api",
         {{"get",
           {{"summary", "Retrieve OpenAPI Specification"},
            {"description", "Endpoint to fetch the OpenAPI Specification document"},
            {"responses",
             {{"200", {{"description", "Successful response with OpenAPI Specification document"}}}}}}}}},
        {"/async_api",
         {{"get",
           {{"summary", "Retrieve AsyncAPI Specification"},
            {"description", "Endpoint to fetch the AsyncAPI Specification document"},
            {"responses",
             {{"200", {{"description", "Successful response with AsyncAPI Specification document"}}}}}}}}},
        types_path,
        types_id_path,
        items_path,
        items_id_path,
        data_path,
        reactive_rules_path,
        reactive_rules_id_path,
        deliberative_rules_path,
        deliberative_rules_id_path}},
      {"components", {"schemas", j_schemas}}};
  const json::json j_async_api{
      {"asyncapi", "3.0.0"},
      {"info", {{"title", "CoCo API"}, {"description", "The combined deduCtiOn and abduCtiOn (CoCo) WebSocket API"}, {"version", "1.0"}}},
      {"servers", {"coco", {{"host", SERVER_HOST ":" + std::to_string(SERVER_PORT)}, {"pathname", "/coco"}, {"protocol", "ws"}}}},
      {"channels", {{"coco", {{"address", "/"}}}}},
      {"components", {{"messages", j_messages}, {"schemas", j_schemas}}}};
} // namespace coco