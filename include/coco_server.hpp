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

        std::unique_ptr<network::response> types(network::request &req);
        std::unique_ptr<network::response> items(network::request &req);

        void on_ws_open(network::ws_session &ws);
        void on_ws_message(network::ws_session &ws, const std::string &msg);
        void on_ws_close(network::ws_session &ws);
        void on_ws_error(network::ws_session &ws, const boost::system::error_code &);

        void new_solver(const coco_executor &exec) override;
        void deleted_solver(const uintptr_t id) override;

        void state_changed(const coco_executor &exec) override;

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
        json::json j_components{{"schemas",
                                 {{"parameter", parameter_schema["parameter"]},
                                  {"integer_parameter", integer_parameter_schema["integer_parameter"]},
                                  {"real_parameter", real_parameter_schema["real_parameter"]},
                                  {"boolean_parameter", boolean_parameter_schema["boolean_parameter"]},
                                  {"symbol_parameter", symbol_parameter_schema["symbol_parameter"]},
                                  {"string_parameter", string_parameter_schema["string_parameter"]},
                                  {"array_parameter", array_parameter_schema["array_parameter"]},
                                  {"coco_type", coco_type_schema["coco_type"]},
                                  {"coco_item", coco_item_schema["coco_item"]},
                                  {"rational", ratio::rational_schema["rational"]},
                                  {"inf_rational", ratio::inf_rational_schema["inf_rational"]},
                                  {"value", ratio::value_schema["value"]},
                                  {"bool_value", ratio::bool_value_schema["bool_value"]},
                                  {"int_value", ratio::int_value_schema["int_value"]},
                                  {"real_value", ratio::real_value_schema["real_value"]},
                                  {"time_value", ratio::time_value_schema["time_value"]},
                                  {"string_value", ratio::string_value_schema["string_value"]},
                                  {"enum_value", ratio::enum_value_schema["enum_value"]},
                                  {"object_value", ratio::object_value_schema["object_value"]},
                                  {"item", ratio::item_schema["item"]},
                                  {"atom", ratio::atom_schema["atom"]},
                                  {"solver_state", ratio::solver_state_schema["solver_state"]},
                                  {"solver_timeline", ratio::solver_timeline_schema["solver_timeline"]},
                                  {"flaw", ratio::flaw_schema["flaw"]},
                                  {"resolver", ratio::resolver_schema["resolver"]},
                                  {"solver_graph", ratio::solver_graph_schema["solver_graph"]},
                                  {"agent_timeline", ratio::agent_timeline_schema["agent_timeline"]},
                                  {"state_variable_timeline_value", ratio::state_variable_timeline_value_schema["state_variable_timeline_value"]},
                                  {"state_variable_timeline", ratio::state_variable_timeline_schema["state_variable_timeline"]},
                                  {"reusable_resource_timeline_value", ratio::reusable_resource_timeline_value_schema["reusable_resource_timeline_value"]},
                                  {"reusable_resource_timeline", ratio::reusable_resource_timeline_schema["reusable_resource_timeline"]},
                                  {"consumable_resource_timeline_value", ratio::consumable_resource_timeline_value_schema["consumable_resource_timeline_value"]},
                                  {"consumable_resource_timeline", ratio::consumable_resource_timeline_schema["consumable_resource_timeline"]},
                                  {"executor", ratio::executor::executor_schema["executor"]}}}};
        json::json j_open_api{
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
              {"/types",
               {{"get",
                 {{"summary", "Retrieve all the CoCo types"},
                  {"description", "Endpoint to fetch all the managed types"},
                  {"responses",
                   {{"200",
                     {{"description", "Successful response with the stored types"},
                      {"content", {{"application/json", {{"schema", {{"type", "array"}, {"items", {{"$ref", "#/components/schemas/coco_type"}}}}}}}}}}}}}}}}},
              {"/items",
               {{"get",
                 {{"summary", "Retrieve all the CoCo items"},
                  {"description", "Endpoint to fetch all the managed items"},
                  {"responses",
                   {{"200",
                     {{"description", "Successful response with the stored items"},
                      {"content", {{"application/json", {{"schema", {{"type", "array"}, {"items", {{"$ref", "#/components/schemas/coco_item"}}}}}}}}}}}}}}}}}}},
            {"components", j_components}};
        json::json j_async_api{
            {"asyncapi", "3.0.0"},
            {"info", {{"title", "CoCo API"}, {"description", "The combined deduCtiOn and abduCtiOn (CoCo) WebSocket API"}, {"version", "1.0"}}},
            {"servers", {"coco", {{"host", SERVER_HOST ":" + std::to_string(SERVER_PORT)}, {"pathname", "/coco"}, {"protocol", "ws"}}}},
            {"channels", {{"coco", {{"address", "/"}}}}},
            {"components", j_components}};
        std::unordered_set<network::ws_session *> clients;
    };
} // namespace coco