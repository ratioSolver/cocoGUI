#include "coco_server.hpp"
#include "mongo_db.hpp"
#include "logging.hpp"

namespace coco
{
    coco_server::coco_server() : coco_core(std::make_unique<mongo_db>()), network::server()
    {
        LOG_DEBUG(j_open_api);
        LOG_DEBUG(j_async_api);

        add_route(network::Get, "^/$", std::bind(&coco_server::index, this, std::placeholders::_1));
        add_route(network::Get, "^(/assets/.+)|/.+\\.ico|/.+\\.png", std::bind(&coco_server::assets, this, std::placeholders::_1));
        add_route(network::Get, "^/open_api$", std::bind(&coco_server::open_api, this, std::placeholders::_1));
        add_route(network::Get, "^/async_api$", std::bind(&coco_server::async_api, this, std::placeholders::_1));

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

    std::unique_ptr<network::response> coco_server::types(network::request &)
    {
        json::json sts(json::json_type::array);
        for (auto &st : get_types())
            sts.push_back(to_json(st));
        return std::make_unique<network::json_response>(std::move(sts));
    }
    std::unique_ptr<network::response> coco_server::items(network::request &)
    {
        json::json ss(json::json_type::array);
        for (auto &s : get_items())
            ss.push_back(to_json(s));
        return std::make_unique<network::json_response>(std::move(ss));
    }

    void coco_server::on_ws_open(network::ws_session &ws)
    {
        clients.insert(&ws);
        LOG_DEBUG("Connected clients: " + std::to_string(clients.size()));

        // we send the types
        json::json j_types{{"type", "types"}};
        json::json c_types(json::json_type::array);
        for (const auto &st : get_types())
            c_types.push_back(to_json(st.get()));
        j_types["types"] = std::move(c_types);
        ws.send(j_types.dump());

        // we send the items
        json::json j_items{{"type", "items"}};
        json::json c_items(json::json_type::array);
        for (const auto &s : get_items())
            c_items.push_back(to_json(s.get()));
        j_items["items"] = std::move(c_items);
        ws.send(j_items.dump());

        // we send the reactive rules
        json::json j_reactive_rules{{"type", "reactive_rules"}};
        json::json c_reactive_rules(json::json_type::array);
        for (const auto &r : get_reactive_rules())
            c_reactive_rules.push_back(to_json(r.get()));
        j_reactive_rules["rules"] = std::move(c_reactive_rules);
        ws.send(j_reactive_rules.dump());

        // we send the deliberative rules
        json::json j_deliberative_rules{{"type", "deliberative_rules"}};
        json::json c_deliberative_rules(json::json_type::array);
        for (const auto &r : get_deliberative_rules())
            c_deliberative_rules.push_back(to_json(r.get()));
        j_deliberative_rules["rules"] = std::move(c_deliberative_rules);
        ws.send(j_deliberative_rules.dump());

        // we send the solvers
        json::json j_solvers{{"type", "solvers"}};
        json::json c_solvers(json::json_type::array);
        for (const auto &cc_exec : get_solvers())
            c_solvers.push_back(to_json(cc_exec.get()));
        j_solvers["solvers"] = std::move(c_solvers);
        ws.send(j_solvers.dump());

        // we send the executors
        for (const auto &cc_exec : get_solvers())
        {
            ws.send(make_state_message(cc_exec.get()).dump());
            ws.send(make_graph_message(cc_exec.get().get_solver().get_graph()).dump());
        }
    }
    void coco_server::on_ws_message(network::ws_session &ws, const std::string &msg)
    {
        auto x = json::load(msg);
        if (x.get_type() != json::json_type::object || !x.contains("type"))
        {
            ws.close();
            return;
        }
    }
    void coco_server::on_ws_close(network::ws_session &ws)
    {
        clients.erase(&ws);
        LOG_DEBUG("Connected clients: " + std::to_string(clients.size()));
    }
    void coco_server::on_ws_error(network::ws_session &ws, const boost::system::error_code &)
    {
        clients.erase(&ws);
        LOG_DEBUG("Connected clients: " + std::to_string(clients.size()));
    }

    void coco_server::new_solver(const coco_executor &exec)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_executor_message(exec));
    }
    void coco_server::deleted_solver(const uintptr_t id)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(ratio::executor::make_deleted_executor_message(id));
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
        broadcast(make_state_message(exec));
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
        broadcast(make_state_changed_message(exec));
    }

    void coco_server::tick(const coco_executor &exec, const utils::rational &)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_tick_message(exec));
    }
} // namespace coco
