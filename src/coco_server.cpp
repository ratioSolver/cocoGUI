#include "coco_server.hpp"
#include "mongo_db.hpp"
#include "logging.hpp"

namespace coco
{
    coco_server::coco_server() : coco_core(std::make_unique<mongo_db>()), network::server()
    {
        LOG_TRACE("OpenAPI: " + j_open_api.dump());
        LOG_TRACE("AsyncAPI: " + j_async_api.dump());

        add_route(network::Get, "^/$", std::bind(&coco_server::index, this, std::placeholders::_1));
        add_route(network::Get, "^(/assets/.+)|/.+\\.ico|/.+\\.png", std::bind(&coco_server::assets, this, std::placeholders::_1));
        add_route(network::Get, "^/open_api$", std::bind(&coco_server::open_api, this, std::placeholders::_1));
        add_route(network::Get, "^/async_api$", std::bind(&coco_server::async_api, this, std::placeholders::_1));

        add_route(network::Get, "^/types$", std::bind(&coco_server::get_types, this, std::placeholders::_1));
        add_route(network::Post, "^/types$", std::bind(&coco_server::create_type, this, std::placeholders::_1));

        add_ws_route("/coco").on_open(std::bind(&coco_server::on_ws_open, this, std::placeholders::_1)).on_message(std::bind(&coco_server::on_ws_message, this, std::placeholders::_1, std::placeholders::_2)).on_close(std::bind(&coco_server::on_ws_close, this, std::placeholders::_1)).on_error(std::bind(&coco_server::on_ws_error, this, std::placeholders::_1, std::placeholders::_2));
    }

    std::unique_ptr<network::response> coco_server::index(network::request &) { return std::make_unique<network::file_response>("client/dist/index.html"); }
    std::unique_ptr<network::response> coco_server::assets(network::request &req)
    {
        std::string target = req.get_target();
        if (target.find('?') != std::string::npos)
            target = target.substr(0, target.find('?'));
        return std::make_unique<network::file_response>("client/dist" + target);
    }
    std::unique_ptr<network::response> coco_server::open_api(network::request &) { return std::make_unique<network::json_response>(j_open_api); }
    std::unique_ptr<network::response> coco_server::async_api(network::request &) { return std::make_unique<network::json_response>(j_async_api); }

    std::unique_ptr<network::response> coco_server::get_types(network::request &)
    {
        json::json sts(json::json_type::array);
        for (auto &st : coco_core::get_types())
            sts.push_back(to_json(st));
        return std::make_unique<network::json_response>(std::move(sts));
    }
    std::unique_ptr<network::response> coco_server::create_type(network::request &req)
    {
        auto &body = static_cast<network::json_request &>(req).get_body();
        if (body.get_type() != json::json_type::object || !body.contains("name"))
            return std::make_unique<network::json_response>(json::json({{"message", "Invalid request"}}), network::status_code::bad_request);
        if (!body.contains("name") || body["name"].get_type() != json::json_type::string)
            return std::make_unique<network::json_response>(json::json({{"message", "Invalid request"}}), network::status_code::bad_request);
        std::string name = body["name"];
        std::string description = body.contains("description") ? body["description"] : "";
        std::vector<std::reference_wrapper<const type>> parents;
        if (body.contains("parents") && body["parents"].get_type() == json::json_type::array)
            for (auto &p : body["parents"].as_array())
            {
                if (p.get_type() != json::json_type::string)
                    return std::make_unique<network::json_response>(json::json({{"message", "Invalid request"}}), network::status_code::bad_request);
                try
                {
                    auto &tp = coco_core::get_type(p);
                    parents.emplace_back(tp);
                }
                catch (const std::exception &)
                {
                    return std::make_unique<network::json_response>(json::json({{"message", "Parent type not found"}}), network::status_code::not_found);
                }
            }
        std::vector<std::unique_ptr<property>> static_properties;
        if (body.contains("static_properties") && body["static_properties"].get_type() == json::json_type::array)
            for (auto &p : body["static_properties"].as_array())
            {
                auto prop = make_property(*this, p);
                static_properties.emplace_back(std::move(prop));
            }
        std::vector<std::unique_ptr<property>> dynamic_properties;
        if (body.contains("dynamic_properties") && body["dynamic_properties"].get_type() == json::json_type::array)
            for (auto &p : body["dynamic_properties"].as_array())
            {
                auto prop = make_property(*this, p);
                dynamic_properties.emplace_back(std::move(prop));
            }
        try
        {
            auto &tp = coco_core::create_type(name, description, std::move(parents), std::move(static_properties), std::move(dynamic_properties));
            return std::make_unique<network::json_response>(to_json(tp));
        }
        catch (const std::exception &e)
        {
            return std::make_unique<network::json_response>(json::json({{"message", e.what()}}), network::status_code::conflict);
        }
    }

    std::unique_ptr<network::response> coco_server::get_items(network::request &)
    {
        json::json ss(json::json_type::array);
        for (auto &s : coco_core::get_items())
            ss.push_back(to_json(s));
        return std::make_unique<network::json_response>(std::move(ss));
    }
    std::unique_ptr<network::response> coco_server::create_item(network::request &req)
    {
        auto &body = static_cast<network::json_request &>(req).get_body();
        if (body.get_type() != json::json_type::object || !body.contains("type") || !body.contains("name"))
            return std::make_unique<network::json_response>(json::json({{"message", "Invalid request"}}), network::status_code::bad_request);
        if (body["type"].get_type() != json::json_type::string || body["name"].get_type() != json::json_type::string)
            return std::make_unique<network::json_response>(json::json({{"message", "Invalid request"}}), network::status_code::bad_request);
        std::string type = body["type"];
        std::string name = body["name"];
        coco::type *tp;
        try
        {
            tp = &coco_core::get_type(type);
        }
        catch (const std::exception &)
        {
            return std::make_unique<network::json_response>(json::json({{"message", "Type not found"}}), network::status_code::not_found);
        }
        try
        {
            auto &s = coco_core::create_item(*tp, name, body.contains("properties") ? body["properties"] : json::json());
            return std::make_unique<network::json_response>(to_json(s));
        }
        catch (const std::exception &e)
        {
            return std::make_unique<network::json_response>(json::json({{"message", e.what()}}), network::status_code::conflict);
        }
    }

    void coco_server::on_ws_open(network::ws_session &ws)
    {
        LOG_TRACE("New connection from " << ws.remote_endpoint());
        std::lock_guard<std::recursive_mutex> _(mtx);
        clients.insert(&ws);
        LOG_DEBUG("Connected clients: " + std::to_string(clients.size()));

        // we send the taxonomy
        ws.send(make_taxonomy_message(*this).dump());

        // we send the items
        ws.send(make_items_message(*this).dump());

        // we send the reactive rules
        ws.send(make_reactive_rules_message(*this).dump());

        // we send the deliberative rules
        ws.send(make_deliberative_rules_message(*this).dump());

        // we send the solvers
        ws.send(make_solvers_message(*this).dump());

        // we send the executors
        for (const auto &cc_exec : get_solvers())
        {
            ws.send(make_solver_state_message(cc_exec.get()).dump());
            ws.send(make_solver_graph_message(cc_exec.get().get_solver().get_graph()).dump());
        }
    }
    void coco_server::on_ws_message(network::ws_session &ws, const std::string &msg)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        auto x = json::load(msg);
        if (x.get_type() != json::json_type::object || !x.contains("type"))
        {
            ws.close();
            return;
        }
    }
    void coco_server::on_ws_close(network::ws_session &ws)
    {
        LOG_TRACE("Connection closed with " << ws.remote_endpoint());
        std::lock_guard<std::recursive_mutex> _(mtx);
        clients.erase(&ws);
        LOG_DEBUG("Connected clients: " + std::to_string(clients.size()));
    }
    void coco_server::on_ws_error(network::ws_session &ws, const boost::system::error_code &)
    {
        LOG_TRACE("Connection error with " << ws.remote_endpoint());
        std::lock_guard<std::recursive_mutex> _(mtx);
        clients.erase(&ws);
        LOG_DEBUG("Connected clients: " + std::to_string(clients.size()));
    }

    void coco_server::new_solver(const coco_executor &exec)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_new_solver_message(exec));
    }
    void coco_server::deleted_solver(const uintptr_t id)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(ratio::executor::make_deleted_solver_message(id));
    }

    void coco_server::new_reactive_rule(const rule &r)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_reactive_rule_message(r));
    }
    void coco_server::new_deliberative_rule(const rule &r)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_deliberative_rule_message(r));
    }

    void coco_server::state_changed(const coco_executor &exec)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_solver_state_message(exec));
    }

    void coco_server::flaw_created(const coco_executor &, const ratio::flaw &f)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_flaw_created_message(f));
    }
    void coco_server::flaw_state_changed(const coco_executor &, const ratio::flaw &f)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_flaw_state_changed_message(f));
    }
    void coco_server::flaw_cost_changed(const coco_executor &, const ratio::flaw &f)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_flaw_cost_changed_message(f));
    }
    void coco_server::flaw_position_changed(const coco_executor &, const ratio::flaw &f)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_flaw_position_changed_message(f));
    }
    void coco_server::current_flaw(const coco_executor &, const ratio::flaw &f)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_current_flaw_message(f));
    }

    void coco_server::resolver_created(const coco_executor &, const ratio::resolver &r)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_resolver_created_message(r));
    }
    void coco_server::resolver_state_changed(const coco_executor &, const ratio::resolver &r)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_resolver_state_changed_message(r));
    }
    void coco_server::current_resolver(const coco_executor &, const ratio::resolver &r)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_current_resolver_message(r));
    }

    void coco_server::causal_link_added(const coco_executor &, const ratio::flaw &f, const ratio::resolver &r)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_causal_link_added_message(f, r));
    }

    void coco_server::executor_state_changed(const coco_executor &exec, ratio::executor::executor_state)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_solver_execution_state_changed_message(exec));
    }

    void coco_server::tick(const coco_executor &exec, const utils::rational &)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_tick_message(exec));
    }
} // namespace coco
