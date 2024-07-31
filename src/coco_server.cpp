#include "coco_server.hpp"
#include "mongo_db.hpp"
#include "coco_api.hpp"
#include "logging.hpp"

namespace coco
{
    coco_server::coco_server() : coco_core(std::make_unique<mongo_db>()), network::server()
    {
        LOG_TRACE("OpenAPI: " + build_open_api().dump());
        LOG_TRACE("AsyncAPI: " + build_async_api().dump());

        add_route(network::Get, "^/$", std::bind(&coco_server::index, this, std::placeholders::_1));
        add_route(network::Get, "^(/assets/.+)|/.+\\.ico|/.+\\.png", std::bind(&coco_server::assets, this, std::placeholders::_1));
        add_route(network::Get, "^/open_api$", std::bind(&coco_server::open_api, this, std::placeholders::_1));
        add_route(network::Get, "^/async_api$", std::bind(&coco_server::async_api, this, std::placeholders::_1));

        add_route(network::Get, "^/types$", std::bind(&coco_server::get_types, this, std::placeholders::_1));
        add_route(network::Post, "^/type$", std::bind(&coco_server::create_type, this, std::placeholders::_1));
        add_route(network::Put, "^/type/.*$", std::bind(&coco_server::update_type, this, std::placeholders::_1));
        add_route(network::Delete, "^/type/.*$", std::bind(&coco_server::delete_type, this, std::placeholders::_1));

        add_route(network::Get, "^/items(\\?.*)?$", std::bind(&coco_server::get_items, this, std::placeholders::_1));
        add_route(network::Post, "^/item$", std::bind(&coco_server::create_item, this, std::placeholders::_1));
        add_route(network::Put, "^/item/.*$", std::bind(&coco_server::update_item, this, std::placeholders::_1));
        add_route(network::Delete, "^/item/.*$", std::bind(&coco_server::delete_item, this, std::placeholders::_1));

        add_route(network::Get, "^/data/.*$", std::bind(&coco_server::get_data, this, std::placeholders::_1));
        add_route(network::Post, "^/data/.*$", std::bind(&coco_server::add_data, this, std::placeholders::_1));

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
    std::unique_ptr<network::response> coco_server::open_api(network::request &) { return std::make_unique<network::json_response>(build_open_api()); }
    std::unique_ptr<network::response> coco_server::async_api(network::request &) { return std::make_unique<network::json_response>(build_async_api()); }

    std::unique_ptr<network::response> coco_server::get_types(network::request &)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        json::json sts(json::json_type::array);
        for (auto &st : coco_core::get_types())
            sts.push_back(to_json(st));
        return std::make_unique<network::json_response>(std::move(sts));
    }
    std::unique_ptr<network::response> coco_server::create_type(network::request &req)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        auto &body = static_cast<network::json_request &>(req).get_body();
        if (body.get_type() != json::json_type::object || !body.contains("name") || body["name"].get_type() != json::json_type::string)
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
        if (body.contains("static_properties"))
        {
            if (body["static_properties"].get_type() != json::json_type::object)
                return std::make_unique<network::json_response>(json::json({{"message", "Invalid request"}}), network::status_code::bad_request);
            for (auto &p : body["static_properties"].as_object())
            {
                if (p.second.get_type() != json::json_type::object)
                    return std::make_unique<network::json_response>(json::json({{"message", "Invalid request"}}), network::status_code::bad_request);
                auto prop = make_property(*this, p.first, p.second);
                static_properties.emplace_back(std::move(prop));
            }
        }
        std::vector<std::unique_ptr<property>> dynamic_properties;
        if (body.contains("dynamic_properties"))
        {
            if (body["dynamic_properties"].get_type() != json::json_type::object)
                return std::make_unique<network::json_response>(json::json({{"message", "Invalid request"}}), network::status_code::bad_request);
            for (auto &p : body["dynamic_properties"].as_object())
            {
                if (p.second.get_type() != json::json_type::object)
                    return std::make_unique<network::json_response>(json::json({{"message", "Invalid request"}}), network::status_code::bad_request);
                auto prop = make_property(*this, p.first, p.second);
                dynamic_properties.emplace_back(std::move(prop));
            }
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
    std::unique_ptr<network::response> coco_server::update_type(network::request &req)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        std::string id = req.get_target().substr(7);
        type *tp;
        try
        {
            tp = &coco_core::get_type(id);
        }
        catch (const std::exception &)
        {
            return std::make_unique<network::json_response>(json::json({{"message", "Type not found"}}), network::status_code::not_found);
        }
        auto &body = static_cast<network::json_request &>(req).get_body();
        if (body.contains("name"))
        {
            if (body["name"].get_type() != json::json_type::string)
                return std::make_unique<network::json_response>(json::json({{"message", "Invalid request"}}), network::status_code::bad_request);
            set_type_name(*tp, body["name"]);
        }
        if (body.contains("description"))
        {
            if (body["description"].get_type() != json::json_type::string)
                return std::make_unique<network::json_response>(json::json({{"message", "Invalid request"}}), network::status_code::bad_request);
            set_type_description(*tp, body["description"]);
        }
        if (body.contains("parents"))
        {
            if (body["parents"].get_type() != json::json_type::array)
                return std::make_unique<network::json_response>(json::json({{"message", "Invalid request"}}), network::status_code::bad_request);
            for (auto &p : tp->get_parents())
                remove_parent(*tp, p.second.get());
            for (auto &p : body["parents"].as_array())
            {
                if (p.get_type() != json::json_type::string)
                    return std::make_unique<network::json_response>(json::json({{"message", "Invalid request"}}), network::status_code::bad_request);
                try
                {
                    auto &parent = coco_core::get_type(p);
                    add_parent(*tp, parent);
                }
                catch (const std::exception &)
                {
                    return std::make_unique<network::json_response>(json::json({{"message", "Parent type not found"}}), network::status_code::not_found);
                }
            }
        }
        if (body.contains("static_properties"))
        {
            if (body["static_properties"].get_type() != json::json_type::object)
                return std::make_unique<network::json_response>(json::json({{"message", "Invalid request"}}), network::status_code::bad_request);
            for (auto &p : tp->get_static_properties())
                remove_static_property(*tp, *p.second);
            for (auto &p : body["static_properties"].as_object())
            {
                if (p.second.get_type() != json::json_type::object)
                    return std::make_unique<network::json_response>(json::json({{"message", "Invalid request"}}), network::status_code::bad_request);
                auto prop = make_property(*this, p.first, p.second);
                add_static_property(*tp, std::move(prop));
            }
        }
        if (body.contains("dynamic_properties"))
        {
            if (body["dynamic_properties"].get_type() != json::json_type::object)
                return std::make_unique<network::json_response>(json::json({{"message", "Invalid request"}}), network::status_code::bad_request);
            for (auto &p : tp->get_dynamic_properties())
                remove_dynamic_property(*tp, *p.second);
            for (auto &p : body["dynamic_properties"].as_object())
            {
                if (p.second.get_type() != json::json_type::object)
                    return std::make_unique<network::json_response>(json::json({{"message", "Invalid request"}}), network::status_code::bad_request);
                auto prop = make_property(*this, p.first, p.second);
                add_dynamic_property(*tp, std::move(prop));
            }
        }
        return std::make_unique<network::json_response>(to_json(*tp));
    }
    std::unique_ptr<network::response> coco_server::delete_type(network::request &req)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        auto &body = static_cast<network::json_request &>(req).get_body();
        if (body.get_type() != json::json_type::object || !body.contains("id") || body["id"].get_type() != json::json_type::string)
            return std::make_unique<network::json_response>(json::json({{"message", "Invalid request"}}), network::status_code::bad_request);
        std::string id = body["id"];
        type *tp;
        try
        {
            tp = &coco_core::get_type(id);
        }
        catch (const std::exception &)
        {
            return std::make_unique<network::json_response>(json::json({{"message", "Type not found"}}), network::status_code::not_found);
        }
        coco_core::delete_type(*tp);
        return std::make_unique<network::response>();
    }

    std::unique_ptr<network::response> coco_server::get_items(network::request &req)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        json::json ss(json::json_type::array);
        if (req.get_target().find('?') != std::string::npos)
        {
            auto params = network::parse_query(req.get_target().substr(req.get_target().find('?') + 1));
            if (!params.count("type_id"))
                return std::make_unique<network::json_response>(json::json({{"message", "Invalid request"}}), network::status_code::bad_request);
            type *tp;
            try
            {
                tp = &coco_core::get_type(params.at("type_id"));
            }
            catch (const std::exception &)
            {
                return std::make_unique<network::json_response>(json::json({{"message", "Type not found"}}), network::status_code::not_found);
            }
            for (auto &s : coco_core::get_items_by_type(*tp))
                ss.push_back(to_json(s));
        }
        else
            for (auto &s : coco_core::get_items())
                ss.push_back(to_json(s));
        return std::make_unique<network::json_response>(std::move(ss));
    }
    std::unique_ptr<network::response> coco_server::create_item(network::request &req)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        auto &body = static_cast<network::json_request &>(req).get_body();
        if (body.get_type() != json::json_type::object || !body.contains("type") || body["type"].get_type() != json::json_type::string || !body.contains("name") || body["name"].get_type() != json::json_type::string)
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
    std::unique_ptr<network::response> coco_server::update_item(network::request &req)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        std::string id = req.get_target().substr(7);
        item *s;
        try
        {
            s = &coco_core::get_item(id);
        }
        catch (const std::exception &)
        {
            return std::make_unique<network::json_response>(json::json({{"message", "Item not found"}}), network::status_code::not_found);
        }
        auto &body = static_cast<network::json_request &>(req).get_body();
        if (body.contains("name"))
        {
            if (body["name"].get_type() != json::json_type::string)
                return std::make_unique<network::json_response>(json::json({{"message", "Invalid request"}}), network::status_code::bad_request);
            set_item_name(*s, body["name"]);
        }
        if (body.contains("properties"))
        {
            if (body["properties"].get_type() != json::json_type::object)
                return std::make_unique<network::json_response>(json::json({{"message", "Invalid request"}}), network::status_code::bad_request);
            set_item_properties(*s, body["properties"]);
        }
        return std::make_unique<network::json_response>(to_json(*s));
    }
    std::unique_ptr<network::response> coco_server::delete_item(network::request &req)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        auto &body = static_cast<network::json_request &>(req).get_body();
        if (body.get_type() != json::json_type::object || !body.contains("id") || body["id"].get_type() != json::json_type::string)
            return std::make_unique<network::json_response>(json::json({{"message", "Invalid request"}}), network::status_code::bad_request);
        std::string id = body["id"];
        item *s;
        try
        {
            s = &coco_core::get_item(id);
        }
        catch (const std::exception &)
        {
            return std::make_unique<network::json_response>(json::json({{"message", "Item not found"}}), network::status_code::not_found);
        }
        coco_core::delete_item(*s);
        return std::make_unique<network::response>();
    }

    std::unique_ptr<network::response> coco_server::get_data(network::request &req)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        std::string id = req.get_target().substr(6);
        std::map<std::string, std::string> params;
        if (id.find('?') != std::string::npos)
        {
            params = network::parse_query(id.substr(id.find('?') + 1));
            id = id.substr(0, id.find('?'));
        }
        item *s;
        try
        {
            s = &coco_core::get_item(id);
        }
        catch (const std::exception &)
        {
            return std::make_unique<network::json_response>(json::json({{"message", "Item not found"}}), network::status_code::not_found);
        }
        std::chrono::system_clock::time_point to = params.count("to") ? std::chrono::system_clock::time_point(std::chrono::milliseconds{std::stol(params.at("to"))}) : std::chrono::system_clock::time_point();
        std::chrono::system_clock::time_point from = params.count("from") ? std::chrono::system_clock::time_point(std::chrono::milliseconds{std::stol(params.at("from"))}) : to - std::chrono::hours{24 * 30};
        return std::make_unique<network::json_response>(coco_core::get_data(*s, from, to));
    }
    std::unique_ptr<network::response> coco_server::add_data(network::request &req)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        std::string id = req.get_target().substr(6);
        item *s;
        try
        {
            s = &coco_core::get_item(id);
        }
        catch (const std::exception &)
        {
            return std::make_unique<network::json_response>(json::json({{"message", "Item not found"}}), network::status_code::not_found);
        }
        auto &body = static_cast<network::json_request &>(req).get_body();
        if (body.get_type() != json::json_type::object)
            return std::make_unique<network::json_response>(json::json({{"message", "Invalid request"}}), network::status_code::bad_request);
        coco_core::add_data(*s, body);
        return std::make_unique<network::response>();
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

    void coco_server::new_type(const type &tp)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_new_type_message(tp));
    }
    void coco_server::updated_type(const type &tp)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_updated_type_message(tp));
    }
    void coco_server::deleted_type(const std::string &tp_id)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_deleted_type_message(tp_id));
    }

    void coco_server::new_item(const item &itm)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_new_item_message(itm));
    }
    void coco_server::updated_item(const item &itm)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_updated_item_message(itm));
    }
    void coco_server::deleted_item(const std::string &itm_id)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_deleted_item_message(itm_id));
    }

    void coco_server::new_data(const item &itm, const json::json &data, const std::chrono::system_clock::time_point &timestamp)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(make_new_data_message(itm, data, timestamp));
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

    [[nodiscard]] json::json build_schemas() noexcept
    {
        json::json components;
        for (const auto &s : coco_schemas.as_object())
            components[s.first] = s.second;
        for (const auto &s : ratio::solver_schemas.as_object())
            components[s.first] = s.second;
        for (const auto &s : ratio::executor::executor_schemas.as_object())
            components[s.first] = s.second;
        return components;
    }
    [[nodiscard]] json::json build_messages() noexcept
    {
        json::json messages;
        for (const auto &m : coco_messages.as_object())
            messages[m.first] = m.second;
        for (const auto &m : ratio::solver_messages.as_object())
            messages[m.first] = m.second;
        for (const auto &m : ratio::executor::executor_messages.as_object())
            messages[m.first] = m.second;
        return messages;
    }
    [[nodiscard]] json::json build_paths() noexcept
    {
        json::json paths{{"/",
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
                              {{"200", {{"description", "Successful response with AsyncAPI Specification document"}}}}}}}}}};
        for (const auto &p : coco_paths.as_object())
            paths[p.first] = p.second;
        return paths;
    }
    [[nodiscard]] json::json build_open_api() noexcept
    {
        json::json open_api{
            {"openapi", "3.1.0"},
            {"info",
             {{"title", "CoCo API"},
              {"description", "The combined deduCtiOn and abduCtiOn (CoCo) API"},
              {"version", "1.0"}}},
            {"components", {"schemas", build_schemas()}},
            {"paths", build_paths()},
            {"servers", std::vector<json::json>{{"url", "http://" SERVER_HOST ":" + std::to_string(SERVER_PORT)}}}};
        return open_api;
    }
    [[nodiscard]] json::json build_async_api() noexcept
    {
        json::json async_api{
            {"asyncapi", "3.0.0"},
            {"info",
             {{"title", "CoCo API"},
              {"description", "The combined deduCtiOn and abduCtiOn (CoCo) WebSocket API"},
              {"version", "1.0"}}},
            {"servers", {"coco", {{"host", SERVER_HOST ":" + std::to_string(SERVER_PORT)}, {"pathname", "/coco"}, {"protocol", "ws"}}}},
            {"channels", {{"coco", {{"address", "/"}}}}},
            {"components",
             {{"messages", build_messages()},
              {"schemas", build_schemas()}}}};
        return async_api;
    }
} // namespace coco
