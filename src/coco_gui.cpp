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
            auto res = crow::response(200);
            res.add_header("Access-Control-Allow-Origin", "*");
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
        std::string msg = json::json{{"type", "new_user"}, {"user", to_json(u)}}.to_string();
        for (auto &[tkn, conn] : users)
            if (cc.get_database().get_user(tkn).get_data()["type"] == "admin")
                conn->send_text(msg);
    }
    void coco_gui::updated_user(const user &u)
    {
        std::string msg = json::json{{"type", "updated_user"}, {"user", to_json(u)}}.to_string();
        for (auto &[tkn, conn] : users)
            if (cc.get_database().get_user(tkn).get_data()["type"] == "admin")
                conn->send_text(msg);
    }
    void coco_gui::removed_user(const user &u)
    {
        std::string msg = json::json{{"type", "removed_user"}, {"user", u.get_id()}}.to_string();
        for (auto &[tkn, conn] : users)
            if (cc.get_database().get_user(tkn).get_data()["type"] == "admin")
                conn->send_text(msg);
    }

    void coco_gui::new_sensor_type(const sensor_type &st)
    {
        std::string msg = json::json{{"type", "new_sensor_type"}, {"sensor_type", to_json(st)}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }
    void coco_gui::updated_sensor_type(const sensor_type &s)
    {
        std::string msg = json::json{{"type", "updated_sensor_type"}, {"sensor_type", to_json(s)}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }
    void coco_gui::removed_sensor_type(const sensor_type &s)
    {
        std::string msg = json::json{{"type", "removed_sensor_type"}, {"sensor_type", s.get_id()}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }

    void coco_gui::new_sensor(const sensor &s)
    {
        std::string msg = json::json{{"type", "new_sensor"}, {"sensor", to_json(s)}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }
    void coco_gui::updated_sensor(const sensor &s)
    {
        std::string msg = json::json{{"type", "updated_sensor"}, {"sensor", to_json(s)}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }
    void coco_gui::removed_sensor(const sensor &s)
    {
        std::string msg = json::json{{"type", "removed_sensor"}, {"sensor", s.get_id()}}.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }

    void coco_gui::new_sensor_value(const sensor &s, const std::chrono::milliseconds::rep &time, const json::json &value)
    {
        json::json j_val{{"type", "new_sensor_value"}, {"sensor", s.get_id()}, {"value", value}};
        j_val["value"]["timestamp"] = time;
        std::string msg = j_val.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }
    void coco_gui::new_sensor_state(const sensor &s, const std::chrono::milliseconds::rep &time, const json::json &state)
    {
        json::json j_val{{"type", "new_sensor_state"}, {"sensor", s.get_id()}, {"state", state}};
        j_val["state"]["timestamp"] = time;
        std::string msg = j_val.to_string();
        for (auto &[tkn, conn] : users)
            conn->send_text(msg);
    }
} // namespace coco_gui