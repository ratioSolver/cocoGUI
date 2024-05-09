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

    std::unique_ptr<network::response> coco_server::sensor_types(network::request &)
    {
        json::json sts(json::json_type::array);
        for (auto &st : get_sensor_types())
            sts.push_back(to_json(st));
        return std::make_unique<network::json_response>(std::move(sts));
    }
    std::unique_ptr<network::response> coco_server::sensors(network::request &)
    {
        json::json ss(json::json_type::array);
        for (auto &s : get_sensors())
            ss.push_back(to_json(s));
        return std::make_unique<network::json_response>(std::move(ss));
    }

    void coco_server::on_ws_open(network::ws_session &ws)
    {
        clients.insert(&ws);

        // we send the sensor types
        json::json j_sensor_types{{"type", "sensor_types"}};
        json::json c_sensor_types(json::json_type::array);
        for (const auto &st : get_sensor_types())
            c_sensor_types.push_back(to_json(st.get()));
        j_sensor_types["sensor_types"] = std::move(c_sensor_types);
        ws.send(j_sensor_types.dump());

        // we send the sensors
        json::json j_sensors{{"type", "sensors"}};
        json::json c_sensors(json::json_type::array);
        for (const auto &s : get_sensors())
            c_sensors.push_back(to_json(s.get()));
        j_sensors["sensors"] = std::move(c_sensors);
        ws.send(j_sensors.dump());

        // we send the solvers
        json::json j_solvers{{"type", "solvers"}};
        json::json c_solvers(json::json_type::array);
        for (const auto &cc_exec : get_solvers())
            c_solvers.push_back(to_json(cc_exec.get()));
        j_solvers["solvers"] = std::move(c_solvers);
        ws.send(j_solvers.dump());
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
    void coco_server::on_ws_close(network::ws_session &ws) { clients.erase(&ws); }
    void coco_server::on_ws_error(network::ws_session &ws, const boost::system::error_code &) { clients.erase(&ws); }

    void coco_server::new_solver(const coco_executor &exec)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(new_executor_message(exec));
    }
    void coco_server::deleted_solver(const uintptr_t id)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(ratio::executor::deleted_executor_message(id));
    }

    void coco_server::state_changed(const coco_executor &exec)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(ratio::executor::state_message(exec));
    }

    void coco_server::executor_state_changed(const coco_executor &exec, ratio::executor::executor_state)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(ratio::executor::state_changed_message(exec));
    }

    void coco_server::tick(const coco_executor &exec, const utils::rational &)
    {
        std::lock_guard<std::recursive_mutex> _(mtx);
        broadcast(ratio::executor::tick_message(exec));
    }
} // namespace coco
