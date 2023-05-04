#include "coco_gui.h"
#include "coco_db.h"
#include "coco_executor.h"
#include <iomanip>

namespace coco::coco_gui
{
    coco_gui::coco_gui(coco::coco_core &cc, const std::string &coco_host, const unsigned short coco_port) : coco::coco_listener(cc), coco_host(coco_host), coco_port(coco_port)
    {
        app.loglevel(crow::LogLevel::Warning);

        CROW_ROUTE(app, "/")
        ([]()
         { return crow::mustache::load("index.html").render(); });

        CROW_ROUTE(app, "/login").methods("POST"_method)([&cc](const crow::request &req)
                                                         {
            const std::lock_guard<std::recursive_mutex> lock(cc.get_mutex());
            auto x = json::load(req.body);
            if (!x.has("email") || !x.has("password"))
                return crow::response(400, "Login must contain email and password");
            std::string email = x["email"];
            std::string password = x["password"];
            auto user = cc.get_database().get_user(email, password);
            if (!user)
                return crow::response(401, "Invalid email or password");
            crow::response res(200);
            res.add_header("Content-Type", "application/json");
            res.body = json::json{{"status", "ok"}, {"token", user->get_id()}}.to_string();
            return res; });

        CROW_ROUTE(app, "/users")
        ([&cc]()
         {
            const std::lock_guard<std::recursive_mutex> lock(cc.get_mutex());
            crow::response res(200);
            json::json users(json::json_type::array);
            for (auto &u : cc.get_database().get_users())
                users.push_back(to_json(u.get()));
            res.add_header("Content-Type", "application/json");
            res.body = users.to_string();
            return res; });
        
        CROW_ROUTE(app, "/user").methods("POST"_method)([&cc](const crow::request &req)
                                                        {
            LOG_DEBUG("Creating new user..");
            const std::lock_guard<std::recursive_mutex> lock(cc.get_mutex());
            auto user = json::load(req.body);
            if (!user.has("email") || !user.has("password") || !user.has("first_name") || !user.has("last_name") || !user.has("roots"))
                return crow::response(400, "User must contain email, password, first_name, last_name and roots");
            std::string email = user["email"];
            std::string password = user["password"];
            std::string first_name = user["first_name"];
            std::string last_name = user["last_name"];
            std::vector<std::string> roots;
            for (size_t i = 0; i < user["roots"].size(); ++i)
                roots.push_back(user["roots"][i]);
            cc.create_user(first_name, last_name, email, password, roots, user["data"]);
            return crow::response(200); });

        CROW_ROUTE(app, "/sensor_types")
        ([&cc]()
         {
            const std::lock_guard<std::recursive_mutex> lock(cc.get_mutex());
            crow::response res(200);
            json::json sensor_types(json::json_type::array);
            for (auto &st : cc.get_database().get_sensor_types())
                sensor_types.push_back(to_json(st.get()));
            res.add_header("Content-Type", "application/json");
            res.body = sensor_types.to_string();
            return res; });

        CROW_ROUTE(app, "/sensor_type").methods("POST"_method)([&cc](const crow::request &req)
                                                               {
            LOG_DEBUG("Creating new sensor type..");
            const std::lock_guard<std::recursive_mutex> lock(cc.get_mutex());
            auto sensor_type = json::load(req.body);
            if (!sensor_type.has("name") || !sensor_type.has("description") || !sensor_type.has("parameters"))
                return crow::response(400, "Sensor type must contain name, description and parameters");
            std::string name = sensor_type["name"];
            std::string description = sensor_type["description"];
            auto parameters = sensor_type["parameters"].get_object();
            std::map<std::string, coco::parameter_type> parameters_map;
            for (auto &[name, pt] : parameters)
                switch (static_cast<int>(pt["type"]))
                {
                    case 0:
                        parameters_map[name] = coco::parameter_type::Integer;
                        break;
                    case 1:
                        parameters_map[name] = coco::parameter_type::Float;
                        break;
                    case 2:
                        parameters_map[name] = coco::parameter_type::Boolean;
                        break;
                    case 3:
                        parameters_map[name] = coco::parameter_type::Symbol;
                        break;
                    case 4:
                        parameters_map[name] = coco::parameter_type::String;
                        break;
                    default:
                        return crow::response(400, "Invalid parameter type");
                }
            cc.create_sensor_type(name, description, parameters_map);
            return crow::response(200); });
        
        CROW_ROUTE(app, "/sensor").methods("POST"_method)([&cc](const crow::request &req)
                                                          {
            LOG_DEBUG("Creating new sensor..");
            const std::lock_guard<std::recursive_mutex> lock(cc.get_mutex());
            auto x = json::load(req.body);
            if (!x.has("name") || !x.has("type"))
                return crow::response(400, "Sensor must contain name and type");
            std::string name = x["name"];
            std::string type_id = x["type"];
            if (!cc.get_database().has_sensor_type(type_id))
                return crow::response(400, "Sensor type does not exist");
            coco::location_ptr l;
            if (x.has("location"))
                l = new coco::location{static_cast<double>(x["location"]["x"]), static_cast<double>(x["location"]["y"])};
            cc.create_sensor(name, cc.get_database().get_sensor_type(type_id), std::move(l));
            return crow::response(200); });

        CROW_ROUTE(app, "/sensor/<string>").methods("POST"_method)([&cc](const crow::request &req, const std::string &id)
                                                                   {
            auto tkn = req.get_header_value("token");
            if (tkn.empty())
                return crow::response(401, "Invalid token");
            const std::lock_guard<std::recursive_mutex> lock(cc.get_mutex());
            if (!cc.get_database().has_user(tkn))
                return crow::response(401, "Invalid token");
            if (!cc.get_database().has_sensor(id))
                return crow::response(404, "The sensor does not exist.");
            auto val = json::load(req.body);
            cc.publish_sensor_value(cc.get_database().get_sensor(id), val);
            return crow::response(200); });

        CROW_ROUTE(app, "/sensor/<string>")
        ([&cc](const crow::request &req, const std::string &id)
         {
            LOG_DEBUG("Gettting sensor data..");
            const std::lock_guard<std::recursive_mutex> lock(cc.get_mutex());
            if (!cc.get_database().has_sensor(id))
                return crow::response(404, "The sensor does not exist.");

            std::chrono::system_clock::time_point to;
            if (req.url_params.get("to"))
                to = std::chrono::system_clock::from_time_t(std::stol(req.url_params.get("to")));
            else
                to = std::chrono::system_clock::now();

            std::chrono::system_clock::time_point from;
            if (req.url_params.get("from"))
                from = std::chrono::system_clock::from_time_t(std::stol(req.url_params.get("from")));
            else
                from = to - std::chrono::hours(24 * 30);

            auto from_t = std::chrono::system_clock::to_time_t(from);
            LOG_DEBUG("From: " << std::put_time(std::localtime(&from_t), "%c %Z"));

            auto to_t = std::chrono::system_clock::to_time_t(to);
            LOG_DEBUG("To: " << std::put_time(std::localtime(&to_t), "%c %Z"));

            crow::response res(200);
            res.add_header("Content-Type", "application/json");
            res.body = cc.get_database().get_sensor_values(cc.get_database().get_sensor(id), from, to).to_string();
            return res; });

        CROW_ROUTE(app, "/coco")
            .websocket()
            .onopen([&](crow::websocket::connection &conn)
                    { std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
                connections.emplace(&conn, ""); })
            .onclose([&](crow::websocket::connection &conn, const std::string &)
                     { std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
                       if (connections.count(&conn))
                       {
                           if (users.count(connections[&conn]))
                               users.erase(connections[&conn]);
                           connections.erase(&conn);

                           for (auto &[tkn, conn] : users)
                               conn->send_text(json::json{{"type", "user_disconnect"}, {"user", tkn}}.to_string());
                       } })
            .onmessage([&](crow::websocket::connection &conn, const std::string &message, bool is_binary)
                       {
                std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
                if (is_binary)
                    return;
                json::json j = json::load(message);
                if (j.get_type() != json::json_type::object || !j.get_object().count("type") || !j.get_object().count("token"))
                {
                    conn.send_text(json::json{{"type", "connect"}, {"success", false}}.to_string());
                    return;
                }

                if (j["type"] == "connect") {
                    std::string token = j["token"];
                    if(!cc.get_database().has_user(token)) {
                        conn.send_text(json::json{{"type", "connect"}, {"success", false}}.to_string());
                        return;
                    }
                    auto& usr = cc.get_database().get_user(token);
                    if (std::find_if(usr.get_roots().begin(), usr.get_roots().end(), [&cc](const std::string &root) { return root == cc.get_database().get_root(); }) == usr.get_roots().end())
                    {
                        conn.send_text(json::json{{"type", "connect"}, {"success", false}}.to_string());
                        return;
                    }

                    connections[&conn] = token;
                    users[token] = &conn;
                    conn.send_text(json::json{{"type", "connect"}, {"success", true}, {"user", to_json(usr)}}.to_string());

                    json::json j_sensor_types{{"type", "sensor_types"}};
                    json::json c_sensor_types(json::json_type::array);
                    for (const auto &st : cc.get_database().get_sensor_types())
                        c_sensor_types.push_back(to_json(st.get()));
                    j_sensor_types["sensor_types"] = std::move(c_sensor_types);
                    conn.send_text(j_sensor_types.to_string());

                    json::json j_sensors;
                    j_sensors["type"] = "sensors";
                    json::json c_sensors(json::json_type::array);
                    for (const auto &sensor : cc.get_database().get_sensors())
                        c_sensors.push_back(to_json(sensor.get()));
                    j_sensors["sensors"] = std::move(c_sensors);
                    conn.send_text(j_sensors.to_string());

                    json::json j_solvers;
                    j_solvers["type"] = "solvers";
                    json::json c_solvers(json::json_type::array);
                    for (const auto &cc_exec : cc.get_executors())
                        c_solvers.push_back({{"id", get_id(*cc_exec)},
                                             {"name", cc_exec->get_executor().get_name()},
                                             {"state", ratio::executor::to_string(cc_exec->get_executor().get_state())}});
                    j_solvers["solvers"] = std::move(c_solvers);
                    conn.send_text(j_solvers.to_string());

                    for (const auto& cc_exec: cc.get_executors()) {
                        json::json j_sc{{"type", "state_changed"},
                                        {"solver_id", get_id(*cc_exec)},
                                        {"state", to_json(cc_exec->get_executor().get_solver())},
                                        {"timelines", to_timelines(cc_exec->get_executor().get_solver())},
                                        {"time", ratio::to_json(cc_exec->get_executor().get_current_time())}};
                        json::json j_executing(json::json_type::array);
                        for (const auto &atm : cc_exec->get_executor().get_executing())
                            j_executing.push_back(get_id(*atm));
                        j_sc["executing"] = std::move(j_executing);
                        conn.send_text(j_sc.to_string());

                        json::json j_gr = to_graph(*cc_exec);
                        j_gr["type"] = "graph";
                        j_gr["solver_id"] = get_id(*cc_exec);
                        conn.send_text(j_gr.to_string());
                    }

                    if (usr.get_data()["type"] == "admin") {
                        json::json j_users;
                        j_users["type"] = "users";
                        json::json c_users(json::json_type::array);
                        for (const auto &user : cc.get_database().get_users())
                        {
                            json::json j_u = to_json(user.get());
                            if (users.count(user.get().get_id()))
                                j_u["connected"] = true;
                            c_users.push_back(std::move(j_u));
                        }
                        j_users["users"] = std::move(c_users);
                        conn.send_text(j_users.to_string());
                    }

                    for (auto &[tkn, conn] : users)
                        if (tkn != token)
                            conn->send_text(json::json{{"type", "user_connected"}, {"user", usr.get_id()}}.to_string());
                } });
    }

    void coco_gui::start()
    {
        LOG("Starting " + cc.get_database().get_root() + " CoCo Web Server on http://" + coco_host + ':' + std::to_string(coco_port) + "..");
        app.bindaddr(coco_host).port(coco_port).run();
    }

    void coco_gui::wait_for_server_start()
    {
        app.wait_for_server_start();
        LOG(cc.get_database().get_root() + " CoCo Web Server started..");
    }

    void coco_gui::stop()
    {
        LOG("Stopping " + cc.get_database().get_root() + " CoCo Web Server..");
        app.stop();
    }

    void coco_gui::new_user(const user &u)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        std::string msg = json::json{{"type", "new_user"}, {"user", to_json(u)}}.to_string();
        for (auto &[tkn, conn] : users)
            if (cc.get_database().get_user(tkn).get_data()["type"] == "admin")
                conn->send_text(msg);
    }
    void coco_gui::updated_user(const user &u)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        std::string msg = json::json{{"type", "updated_user"}, {"user", to_json(u)}}.to_string();
        for (auto &[tkn, conn] : users)
            if (cc.get_database().get_user(tkn).get_data()["type"] == "admin")
                conn->send_text(msg);
    }
    void coco_gui::removed_user(const user &u)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        std::string msg = json::json{{"type", "removed_user"}, {"user", u.get_id()}}.to_string();
        for (auto &[tkn, conn] : users)
            if (cc.get_database().get_user(tkn).get_data()["type"] == "admin")
                conn->send_text(msg);
    }

    void coco_gui::new_sensor_type(const sensor_type &st)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        std::string msg = json::json{{"type", "new_sensor_type"}, {"sensor_type", to_json(st)}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }
    void coco_gui::updated_sensor_type(const sensor_type &s)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        std::string msg = json::json{{"type", "updated_sensor_type"}, {"sensor_type", to_json(s)}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }
    void coco_gui::removed_sensor_type(const sensor_type &s)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        std::string msg = json::json{{"type", "removed_sensor_type"}, {"sensor_type", s.get_id()}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }

    void coco_gui::new_sensor(const sensor &s)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        std::string msg = json::json{{"type", "new_sensor"}, {"sensor", to_json(s)}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }
    void coco_gui::updated_sensor(const sensor &s)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        std::string msg = json::json{{"type", "updated_sensor"}, {"sensor", to_json(s)}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }
    void coco_gui::removed_sensor(const sensor &s)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        std::string msg = json::json{{"type", "removed_sensor"}, {"sensor", s.get_id()}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }

    void coco_gui::new_sensor_value(const sensor &s, const std::chrono::system_clock::time_point &time, const json::json &value)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        std::string msg = json::json{{"type", "new_sensor_value"}, {"sensor", s.get_id()}, {"timestamp", std::chrono::system_clock::to_time_t(time)}, {"value", value}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }
    void coco_gui::new_sensor_state(const sensor &s, const std::chrono::system_clock::time_point &time, const json::json &state)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        std::string msg = json::json{{"type", "new_sensor_state"}, {"sensor", s.get_id()}, {"timestamp", std::chrono::system_clock::to_time_t(time)}, {"state", state}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }

    void coco_gui::new_solver(const coco_executor &exec)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        std::string msg = json::json{{"type", "new_solver"}, {"solver", get_id(exec)}, {"name", exec.get_executor().get_name()}, {"state", ratio::executor::to_string(exec.get_executor().get_state())}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }
    void coco_gui::removed_solver(const coco_executor &exec)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        std::string msg = json::json{{"type", "removed_solver"}, {"solver", get_id(exec)}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }

    void coco_gui::state_changed(const coco_executor &exec)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        json::json j_sc{{"type", "state_changed"},
                        {"solver_id", get_id(exec)},
                        {"state", to_json(exec.get_executor().get_solver())},
                        {"timelines", to_timelines(exec.get_executor().get_solver())},
                        {"time", ratio::to_json(exec.get_executor().get_current_time())}};
        json::json j_executing(json::json_type::array);
        for (const auto &atm : exec.get_executor().get_executing())
            j_executing.push_back(get_id(*atm));
        j_sc["executing"] = std::move(j_executing);
        std::string msg = j_sc.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }

    void coco_gui::flaw_created(const coco_executor &exec, const ratio::flaw &f)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        json::json j_msg = to_json(f);
        j_msg["type"] = "flaw_created";
        j_msg["solver_id"] = get_id(exec);
        std::string msg = j_msg.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }
    void coco_gui::flaw_state_changed(const coco_executor &exec, const ratio::flaw &f)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        std::string msg = json::json{{"type", "flaw_state_changed"}, {"solver_id", get_id(exec)}, {"id", get_id(f)}, {"state", f.get_solver().get_sat_core().value(f.get_phi())}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }
    void coco_gui::flaw_cost_changed(const coco_executor &exec, const ratio::flaw &f)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        std::string msg = json::json{{"type", "flaw_cost_changed"}, {"solver_id", get_id(exec)}, {"id", get_id(f)}, {"cost", ratio::to_json(f.get_estimated_cost())}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }
    void coco_gui::flaw_position_changed(const coco_executor &exec, const ratio::flaw &f)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        std::string msg = json::json{{"type", "flaw_position_changed"}, {"solver_id", get_id(exec)}, {"id", get_id(f)}, {"pos", ratio::to_json(f.get_solver().get_idl_theory().bounds(f.get_position()))}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }
    void coco_gui::current_flaw(const coco_executor &exec, const ratio::flaw &f)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        std::string msg = json::json{{"type", "current_flaw"}, {"solver_id", get_id(exec)}, {"id", get_id(f)}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }

    void coco_gui::resolver_created(const coco_executor &exec, const ratio::resolver &r)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        json::json j_msg = to_json(r);
        j_msg["type"] = "resolver_created";
        j_msg["solver_id"] = get_id(exec);
        std::string msg = j_msg.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }
    void coco_gui::resolver_state_changed(const coco_executor &exec, const ratio::resolver &r)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        std::string msg = json::json{{"type", "resolver_state_changed"}, {"solver_id", get_id(exec)}, {"id", get_id(r)}, {"state", r.get_solver().get_sat_core().value(r.get_rho())}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }
    void coco_gui::current_resolver(const coco_executor &exec, const ratio::resolver &r)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        std::string msg = json::json{{"type", "current_resolver"}, {"solver_id", get_id(exec)}, {"id", get_id(r)}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }

    void coco_gui::causal_link_added(const coco_executor &exec, const ratio::flaw &f, const ratio::resolver &r)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        std::string msg = json::json{{"type", "causal_link_added"}, {"solver_id", get_id(exec)}, {"flaw_id", get_id(f)}, {"resolver_id", get_id(r)}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }

    void coco_gui::executor_state_changed(const coco_executor &exec, ratio::executor::executor_state state)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        std::string msg = json::json{{"type", "executor_state_changed"}, {"solver_id", get_id(exec)}, {"state", ratio::executor::to_string(state)}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }

    void coco_gui::tick(const coco_executor &exec, const utils::rational &time)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        std::string msg = json::json{{"type", "tick"}, {"solver_id", get_id(exec)}, {"time", ratio::to_json(time)}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }

    void coco_gui::start(const coco_executor &exec, const std::unordered_set<ratio::atom *> &atoms)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        json::json starting(json::json_type::array);
        for (const auto &atm : atoms)
            starting.push_back(get_id(*atm));
        std::string msg = json::json{{"type", "start"}, {"solver_id", get_id(exec)}, {"start", std::move(starting)}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }
    void coco_gui::end(const coco_executor &exec, const std::unordered_set<ratio::atom *> &atoms)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        json::json ending(json::json_type::array);
        for (const auto &atm : atoms)
            ending.push_back(get_id(*atm));
        std::string msg = json::json{{"type", "end"}, {"solver_id", get_id(exec)}, {"end", std::move(ending)}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }
} // namespace coco_gui