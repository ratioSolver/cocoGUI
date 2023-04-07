#include "coco_gui.h"
#include "coco_db.h"
#include "coco_executor.h"

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
            auto x = crow::json::load(req.body);
            if (!x.has("email") || !x.has("password"))
                return crow::response(400, "Login must contain email and password");
            auto email = x["email"].s();
            auto password = x["password"].s();
            auto user = cc.get_database().get_user(email, password);
            if (!user)
                return crow::response(401, "Invalid email or password");
            auto res = crow::response(200);
            json::json login{{"status", "ok"}, {"token", user->get_id()}};
            res.body = login.to_string();
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
                    {
                        json::json j_st{{"id", st.get().get_id()},
                                        {"name", st.get().get_name()},
                                        {"description", st.get().get_description()}};
                        json::json c_st_params(json::json_type::array);
                        for (const auto &param : st.get().get_parameters())
                            c_st_params.push_back({{"name", param.first},
                                               {"type", static_cast<long>(param.second)}});
                        j_st["parameters"] = std::move(c_st_params);
                        c_sensor_types.push_back(std::move(j_st));
                    }
                    j_sensor_types["sensor_types"] = std::move(c_sensor_types);
                    conn.send_text(j_sensor_types.to_string());

                    json::json j_sensors;
                    j_sensors["type"] = "sensors";
                    json::json c_sensors(json::json_type::array);
                    for (const auto &sensor : cc.get_database().get_sensors())
                    {
                        json::json j_s{{"id", sensor.get().get_id()},
                                       {"name", sensor.get().get_name()},
                                       {"sensor_type", sensor.get().get_type().get_id()}};
                        if (sensor.get().has_location())
                            j_s["location"] = {{"y", sensor.get().get_location().y}, {"x", sensor.get().get_location().x}};
                        if (sensor.get().has_value()) {
                            j_s["value"] = json::load(sensor.get().get_value().to_string());
                            j_s["value"]["timestamp"] = sensor.get().get_last_update();
                        }
                        c_sensors.push_back(std::move(j_s));
                    }
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
                    conn.send_text(c_solvers.to_string());

                    for (const auto& cc_exec: cc.get_executors()) {
                        json::json j_sc = to_state(*cc_exec);
                        j_sc["type"] = "state_changed";
                        j_sc["solver_id"] = get_id(*cc_exec);
                        json::json j_executing(json::json_type::array);
                        for (const auto &atm : cc_exec->get_executor().get_executing())
                            j_executing.push_back(get_id(*atm));
                        j_sc["executing"] = std::move(j_executing);
                        conn.send_text(j_sc.to_string());

                        json::json j_gr = to_graph(*cc_exec);
                        j_gr["type"] = "graph_changed";
                        j_gr["solver_id"] = get_id(*cc_exec);
                        conn.send_text(j_gr.to_string());
                    }

                    if (usr.get_data()["type"] == "admin") {
                        json::json j_users;
                        j_users["type"] = "users";
                        json::json c_users(json::json_type::array);
                        for (const auto &user : cc.get_database().get_users())
                        {
                            json::json j_u{{"id", user.get().get_id()},
                                           {"email", user.get().get_email()},
                                           {"first_name", user.get().get_first_name()},
                                           {"last_name", user.get().get_last_name()},
                                           {"type", user.get().get_data()["type"]}};
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
} // namespace coco_gui