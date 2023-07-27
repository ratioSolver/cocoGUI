#include "coco_gui.h"
#include "coco_db.h"
#include "coco_executor.h"
#include <iomanip>

namespace coco::coco_gui
{
    coco_gui::coco_gui(coco::coco_core &cc, const std::string &coco_host, const unsigned short coco_port) : network::server(coco_host, coco_port), coco::coco_listener(cc)
    {
        LOG_DEBUG("Creating coco_gui..");
        add_file_route("^/$", "client/dist/index.html");
        add_file_route("^/favicon.ico$", "client/dist");
        add_file_route("^/assets/.*$", "client/dist");

        add_route(boost::beast::http::verb::post, "^/login$", std::bind(&coco_gui::login, this, std::placeholders::_1, std::placeholders::_2));
        add_route(boost::beast::http::verb::get, "^/users$", std::bind(&coco_gui::get_users, this, std::placeholders::_1, std::placeholders::_2));
        add_route(boost::beast::http::verb::post, "^/user$", std::bind(&coco_gui::create_user, this, std::placeholders::_1, std::placeholders::_2));
        add_route(boost::beast::http::verb::put, "^/user/.*$", std::bind(&coco_gui::update_user, this, std::placeholders::_1, std::placeholders::_2));
        add_route(boost::beast::http::verb::delete_, "^/user/.*$", std::bind(&coco_gui::delete_user, this, std::placeholders::_1, std::placeholders::_2));
        add_route(boost::beast::http::verb::get, "^/sensor_types$", std::bind(&coco_gui::get_sensor_types, this, std::placeholders::_1, std::placeholders::_2));
        add_route(boost::beast::http::verb::post, "^/sensor_type$", std::bind(&coco_gui::create_sensor_type, this, std::placeholders::_1, std::placeholders::_2));
        add_route(boost::beast::http::verb::get, "^/sensors$", std::bind(&coco_gui::get_sensors, this, std::placeholders::_1, std::placeholders::_2));
        add_route(boost::beast::http::verb::post, "^/sensor$", std::bind(&coco_gui::create_sensor, this, std::placeholders::_1, std::placeholders::_2));
        add_route(boost::beast::http::verb::get, "^/sensor/.*$", std::bind(&coco_gui::get_sensor_values, this, std::placeholders::_1, std::placeholders::_2));
        add_route(boost::beast::http::verb::post, "^/sensor/.*$", std::bind(&coco_gui::publish_sensor_value, this, std::placeholders::_1, std::placeholders::_2));

        add_ws_route("/coco")
            .on_open(std::bind(&coco_gui::on_ws_open, this, std::placeholders::_1))
            .on_message(std::bind(&coco_gui::on_ws_message, this, std::placeholders::_1, std::placeholders::_2))
            .on_error(std::bind(&coco_gui::on_ws_error, this, std::placeholders::_1, std::placeholders::_2));
    }

    void coco_gui::login(network::request &req, network::response &res)
    {
        const std::lock_guard<std::recursive_mutex> lock(cc.get_mutex());
        auto x = json::load(boost::beast::buffers_to_string(req.body().data()));
        if (!x.has("email") || !x.has("password"))
        {
            res.result(boost::beast::http::status::bad_request);
            res.set(boost::beast::http::field::content_type, "application/json");
            res.body() = json::json{{"success", false}, {"message", "Login must contain email and password"}}.to_string();
            return;
        }

        std::string email = x["email"];
        std::string password = x["password"];
        auto user = cc.get_database().get_user(email, password);
        if (!user)
        {
            res.result(boost::beast::http::status::unauthorized);
            res.set(boost::beast::http::field::content_type, "application/json");
            res.body() = json::json{{"success", false}, {"message", "Invalid email or password"}}.to_string();
            return;
        }

        res.set(boost::beast::http::field::content_type, "application/json");
        res.body() = json::json{{"success", true}, {"token", user->get_id()}}.to_string();
    }

    bool coco_gui::authorize(network::request &req, network::response &res, bool admin)
    {
        if (!req.count("token"))
        {
            res.result(boost::beast::http::status::bad_request);
            res.set(boost::beast::http::field::content_type, "application/json");
            res.body() = json::json{{"success", false}, {"message", "Token must be provided"}}.to_string();
            return false;
        }
        else if (!cc.get_database().has_user(req["token"].to_string()))
        {
            res.result(boost::beast::http::status::unauthorized);
            res.set(boost::beast::http::field::content_type, "application/json");
            res.body() = json::json{{"success", false}, {"message", "Invalid token"}}.to_string();
            return false;
        }
        else if (admin && cc.get_database().get_user(req["token"].to_string()).get_data()["type"] != "admin")
        {
            res.result(boost::beast::http::status::forbidden);
            res.set(boost::beast::http::field::content_type, "application/json");
            res.body() = json::json{{"success", false}, {"message", "Only admin can get users"}}.to_string();
            return false;
        }
        else
            return true;
    }

    void coco_gui::get_users(network::request &req, network::response &res)
    {
        const std::lock_guard<std::recursive_mutex> lock(cc.get_mutex());
        if (!authorize(req, res, true))
            return;

        res.set(boost::beast::http::field::content_type, "application/json");
        json::json j_users;
        j_users["type"] = "users";
        json::json c_users(json::json_type::array);
        for (const auto &user : cc.get_database().get_users())
        {
            json::json j_u = to_json(user.get());
            if (user_to_ws.count(user.get().get_id()))
                j_u["connected"] = true;
            c_users.push_back(std::move(j_u));
        }
        j_users["users"] = std::move(c_users);
        res.body() = j_users.to_string();
    }
    void coco_gui::create_user(network::request &req, network::response &res)
    {
        const std::lock_guard<std::recursive_mutex> lock(cc.get_mutex());
        if (!authorize(req, res, true))
            return;

        auto x = json::load(boost::beast::buffers_to_string(req.body().data()));
        if (!x.has("email") || !x.has("password") || !x.has("roots"))
        {
            res.result(boost::beast::http::status::bad_request);
            res.set(boost::beast::http::field::content_type, "application/json");
            res.body() = json::json{{"success", false}, {"message", "Email, password and roots must be provided"}}.to_string();
            return;
        }

        std::string email = x["email"];
        std::string password = x["password"];
        std::string first_name = x["first_name"];
        std::string last_name = x["last_name"];
        std::vector<std::string> roots;
        for (size_t i = 0; i < x["roots"].size(); ++i)
            roots.push_back(x["roots"][i]);
        if (cc.get_database().has_user(email))
        {
            res.result(boost::beast::http::status::conflict);
            res.set(boost::beast::http::field::content_type, "application/json");
            res.body() = json::json{{"success", false}, {"message", "User already exists"}}.to_string();
            return;
        }

        cc.create_user(email, password, first_name, last_name, roots, x["data"]);
    }
    void coco_gui::update_user(network::request &req, network::response &res)
    {
        const std::lock_guard<std::recursive_mutex> lock(cc.get_mutex());
        if (!authorize(req, res, true))
            return;

        std::string user_id = req.target().to_string().substr(6);
        if (!cc.get_database().has_user(user_id))
        {
            res.result(boost::beast::http::status::not_found);
            res.set(boost::beast::http::field::content_type, "application/json");
            res.body() = json::json{{"success", false}, {"message", "User not found"}}.to_string();
            return;
        }

        auto x = json::load(boost::beast::buffers_to_string(req.body().data()));
        if (x.has("email"))
            cc.get_database().set_user_email(user_id, x["email"]);
        if (x.has("password"))
            cc.get_database().set_user_password(user_id, x["password"]);
        if (x.has("first_name"))
            cc.get_database().set_user_first_name(user_id, x["first_name"]);
        if (x.has("last_name"))
            cc.get_database().set_user_last_name(user_id, x["last_name"]);
        if (x.has("roots"))
        {
            std::vector<std::string> roots;
            for (size_t i = 0; i < x["roots"].size(); ++i)
                roots.push_back(x["roots"][i]);
            cc.get_database().set_user_roots(user_id, roots);
        }
        if (x.has("data"))
            cc.get_database().set_user_data(user_id, x["data"]);
    }
    void coco_gui::delete_user(network::request &req, network::response &res)
    {
        const std::lock_guard<std::recursive_mutex> lock(cc.get_mutex());
        if (!authorize(req, res, true))
            return;

        std::string user_id = req.target().to_string().substr(6);
        if (!cc.get_database().has_user(user_id))
        {
            res.result(boost::beast::http::status::not_found);
            res.set(boost::beast::http::field::content_type, "application/json");
            res.body() = json::json{{"success", false}, {"message", "User not found"}}.to_string();
            return;
        }

        cc.get_database().delete_user(user_id);
    }

    void coco_gui::get_sensor_types(network::request &req, network::response &res)
    {
        const std::lock_guard<std::recursive_mutex> lock(cc.get_mutex());
        if (!authorize(req, res))
            return;

        res.set(boost::beast::http::field::content_type, "application/json");
        json::json j_sensor_types;
        j_sensor_types["type"] = "sensor_types";
        json::json c_sensor_types(json::json_type::array);
        for (const auto &sensor_type : cc.get_database().get_sensor_types())
            c_sensor_types.push_back(to_json(sensor_type.get()));
        j_sensor_types["sensor_types"] = std::move(c_sensor_types);
        res.body() = j_sensor_types.to_string();
    }
    void coco_gui::create_sensor_type(network::request &req, network::response &res)
    {
        const std::lock_guard<std::recursive_mutex> lock(cc.get_mutex());
        if (!authorize(req, res, true))
            return;

        auto x = json::load(boost::beast::buffers_to_string(req.body().data()));
        if (!x.has("name") || !x.has("description") || !x.has("parameters"))
        {
            res.result(boost::beast::http::status::bad_request);
            res.set(boost::beast::http::field::content_type, "application/json");
            res.body() = json::json{{"success", false}, {"message", "Name, description and parameters must be provided"}}.to_string();
            return;
        }

        std::string name = x["name"];
        std::string description = x["description"];
        json::json parameters = x["parameters"];
        std::map<std::string, coco::parameter_type> parameters_map;
        for (auto &[name, pt] : parameters.get_object())
            switch (static_cast<int>(pt))
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
                res.result(boost::beast::http::status::bad_request);
                res.set(boost::beast::http::field::content_type, "application/json");
                res.body() = json::json{{"success", false}, {"message", "Invalid parameter type"}}.to_string();
                return;
            }

        if (cc.get_database().has_sensor_type(name))
        {
            res.result(boost::beast::http::status::conflict);
            res.set(boost::beast::http::field::content_type, "application/json");
            res.body() = json::json{{"success", false}, {"message", "Sensor type already exists"}}.to_string();
            return;
        }

        cc.create_sensor_type(name, description, parameters_map);
    }

    void coco_gui::get_sensors(network::request &req, network::response &res)
    {
        const std::lock_guard<std::recursive_mutex> lock(cc.get_mutex());
        if (!authorize(req, res))
            return;

        res.set(boost::beast::http::field::content_type, "application/json");
        json::json j_sensors;
        j_sensors["type"] = "sensors";
        json::json c_sensors(json::json_type::array);
        for (const auto &sensor : cc.get_database().get_sensors())
            c_sensors.push_back(to_json(sensor.get()));
        j_sensors["sensors"] = std::move(c_sensors);
        res.body() = j_sensors.to_string();
    }
    void coco_gui::create_sensor(network::request &req, network::response &res)
    {
        const std::lock_guard<std::recursive_mutex> lock(cc.get_mutex());
        if (!authorize(req, res, true))
            return;

        auto x = json::load(boost::beast::buffers_to_string(req.body().data()));
        if (!x.has("name") || !x.has("type"))
        {
            res.result(boost::beast::http::status::bad_request);
            res.set(boost::beast::http::field::content_type, "application/json");
            res.body() = json::json{{"success", false}, {"message", "Name and type must be provided"}}.to_string();
            return;
        }

        std::string name = x["name"];
        std::string type = x["type"];
        if (!cc.get_database().has_sensor_type(type))
        {
            res.result(boost::beast::http::status::not_found);
            res.set(boost::beast::http::field::content_type, "application/json");
            res.body() = json::json{{"success", false}, {"message", "Sensor type not found"}}.to_string();
            return;
        }

        if (cc.get_database().has_sensor(name))
        {
            res.result(boost::beast::http::status::conflict);
            res.set(boost::beast::http::field::content_type, "application/json");
            res.body() = json::json{{"success", false}, {"message", "Sensor already exists"}}.to_string();
            return;
        }

        coco::location_ptr l;
        if (x.has("location"))
            l = new coco::location{static_cast<double>(x["location"]["x"]), static_cast<double>(x["location"]["y"])};

        cc.create_sensor(name, cc.get_database().get_sensor_type(type), std::move(l));
    }

    void coco_gui::get_sensor_values(network::request &req, network::response &res)
    {
        const std::lock_guard<std::recursive_mutex> lock(cc.get_mutex());
        if (!authorize(req, res))
            return;

        std::size_t query_start = req.target().find('?', 8);
        std::string sensor_id = query_start == std::string::npos ? req.target().substr(8).to_string() : req.target().substr(8, query_start - 8).to_string();
        if (!cc.get_database().has_sensor(sensor_id))
        {
            res.result(boost::beast::http::status::not_found);
            res.set(boost::beast::http::field::content_type, "application/json");
            res.body() = json::json{{"success", false}, {"message", "Sensor not found"}}.to_string();
            return;
        }
        std::map<std::string, std::string> fields;
        if (query_start != std::string::npos)
        {
            std::string query = req.target().substr(query_start + 1).to_string();
            std::regex r("([^=&?]+)=([^=&?]+)");
            std::smatch m;
            while (std::regex_search(query, m, r))
            {
                fields[m[1].str()] = m[2].str();
                query = m.suffix().str();
            }
        }

        std::chrono::system_clock::time_point to;
        if (fields.count("to"))
            to = std::chrono::system_clock::time_point{std::chrono::milliseconds{std::stoll(fields["to"])}};
        else
            to = std::chrono::system_clock::now();

        std::chrono::system_clock::time_point from;
        if (fields.count("from"))
            from = std::chrono::system_clock::time_point{std::chrono::milliseconds{std::stoll(fields["from"])}};
        else
            from = to - std::chrono::hours{24 * 30};

#ifdef VERBOSE_LOG
        auto from_t = std::chrono::system_clock::to_time_t(from);
        auto to_t = std::chrono::system_clock::to_time_t(to);

        LOG_DEBUG("From: " << std::put_time(std::localtime(&from_t), "%c %Z"));
        LOG_DEBUG("To: " << std::put_time(std::localtime(&to_t), "%c %Z"));
#endif

        res.set(boost::beast::http::field::content_type, "application/json");
        res.body() = cc.get_database().get_sensor_values(cc.get_database().get_sensor(sensor_id), from, to).to_string();
    }

    void coco_gui::publish_sensor_value(network::request &req, network::response &res)
    {
        const std::lock_guard<std::recursive_mutex> lock(cc.get_mutex());
        if (!authorize(req, res, true))
            return;

        std::string sensor_id = req.target().to_string().substr(8);
        if (!cc.get_database().has_sensor(sensor_id))
        {
            res.result(boost::beast::http::status::not_found);
            res.set(boost::beast::http::field::content_type, "application/json");
            res.body() = json::json{{"success", false}, {"message", "Sensor not found"}}.to_string();
            return;
        }

        cc.publish_sensor_value(cc.get_database().get_sensor(sensor_id), json::load(boost::beast::buffers_to_string(req.body().data())));
    }

    void coco_gui::on_ws_open(network::websocket_session &ws)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        ws_to_user[&ws] = "";
    }

    void coco_gui::on_ws_message(network::websocket_session &ws, const std::string &msg)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        auto x = json::load(msg);
        if (x.get_type() != json::json_type::object || !x.get_object().count("type") || !x.get_object().count("token"))
        {
            ws.close(boost::beast::websocket::close_code::bad_payload);
            return;
        }

        if (x["type"] == "login")
        {
            std::string token = x["token"];
            if (!cc.get_database().has_user(token))
            {
                ws.send(json::json{{"type", "login"}, {"success", false}}.to_string());
                return;
            }

            auto &usr = cc.get_database().get_user(token);
            if (std::find_if(usr.get_roots().begin(), usr.get_roots().end(), [this](const std::string &root)
                             { return root == cc.get_database().get_root(); }) == usr.get_roots().end())
            {
                ws.close(boost::beast::websocket::close_code::bad_payload);
                return;
            }

            ws_to_user[&ws] = usr.get_id();
            user_to_ws[usr.get_id()] = &ws;

            broadcast(json::json{{"type", "user_connected"}, {"user", ws_to_user[&ws]}}.to_string(), false);
            ws.send(json::json{{"type", "login"}, {"success", true}, {"user", to_json(usr)}}.to_string());

            // we send the sensor types
            json::json j_sensor_types{{"type", "sensor_types"}};
            json::json c_sensor_types(json::json_type::array);
            for (const auto &st : cc.get_database().get_sensor_types())
                c_sensor_types.push_back(to_json(st.get()));
            j_sensor_types["sensor_types"] = std::move(c_sensor_types);
            ws.send(j_sensor_types.to_string());

            // we send the sensors
            json::json j_sensors{{"type", "sensors"}};
            json::json c_sensors(json::json_type::array);
            for (const auto &s : cc.get_database().get_sensors())
                c_sensors.push_back(to_json(s.get()));
            j_sensors["sensors"] = std::move(c_sensors);
            ws.send(j_sensors.to_string());

            // we send the solvers
            json::json j_solvers{{"type", "solvers"}};
            json::json c_solvers(json::json_type::array);
            for (const auto &cc_exec : cc.get_executors())
                c_solvers.push_back({{"id", get_id(cc_exec->get_executor().get_solver())}, {"name", cc_exec->get_executor().get_name()}, {"state", ratio::executor::to_string(cc_exec->get_executor().get_state())}});
            j_solvers["solvers"] = std::move(c_solvers);
            ws.send(j_solvers.to_string());

            for (const auto &cc_exec : cc.get_executors())
            {
                json::json j_sc = solver_state_changed_message(cc_exec->get_executor().get_solver());
                j_sc["time"] = ratio::to_json(cc_exec->get_executor().get_current_time());
                json::json j_executing(json::json_type::array);
                for (const auto &atm : cc_exec->get_executor().get_executing())
                    j_executing.push_back(get_id(*atm));
                j_sc["executing"] = std::move(j_executing);
                ws.send(j_sc.to_string());

                json::json j_gr = to_graph(*cc_exec);
                j_gr["type"] = "graph";
                j_gr["solver_id"] = get_id(cc_exec->get_executor().get_solver());
                ws.send(j_gr.to_string());
            }

            if (usr.get_data()["type"] == "admin")
            {
                json::json j_users{{"type", "users"}};
                json::json c_users(json::json_type::array);
                for (const auto &u : cc.get_database().get_users())
                {
                    json::json j_u = to_json(u.get());
                    if (user_to_ws.count(u.get().get_id()))
                        j_u["connected"] = true;
                    c_users.push_back(std::move(j_u));
                }
                j_users["users"] = std::move(c_users);
                ws.send(j_users.to_string());
            }

            broadcast(json::json{{"type", "user_connected"}, {"user", usr.get_id()}}.to_string(), false);
        }
    }

    void coco_gui::on_ws_error(network::websocket_session &ws, const boost::system::error_code &)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        if (ws_to_user.count(&ws))
        {
            if (user_to_ws.count(ws_to_user[&ws]))
                user_to_ws.erase(ws_to_user[&ws]);
            ws_to_user.erase(&ws);
        }
        broadcast(json::json{{"type", "user_disconnected"}, {"user", ws_to_user[&ws]}}.to_string(), false);
    }

    void coco_gui::new_user(const user &u)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(json::json{{"type", "new_user"}, {"user", to_json(u)}}.to_string(), false);
    }
    void coco_gui::updated_user(const user &u)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(json::json{{"type", "updated_user"}, {"user", to_json(u)}}.to_string(), false);
    }
    void coco_gui::removed_user(const user &u)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(json::json{{"type", "removed_user"}, {"user", u.get_id()}}.to_string(), false);
    }

    void coco_gui::new_sensor_type(const sensor_type &st)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(json::json{{"type", "new_sensor_type"}, {"sensor_type", to_json(st)}}.to_string());
    }
    void coco_gui::updated_sensor_type(const sensor_type &s)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(json::json{{"type", "updated_sensor_type"}, {"sensor_type", to_json(s)}}.to_string());
    }
    void coco_gui::removed_sensor_type(const sensor_type &s)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(json::json{{"type", "removed_sensor_type"}, {"sensor_type", s.get_id()}}.to_string());
    }

    void coco_gui::new_sensor(const sensor &s)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(json::json{{"type", "new_sensor"}, {"sensor", to_json(s)}}.to_string());
    }
    void coco_gui::updated_sensor(const sensor &s)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(json::json{{"type", "updated_sensor"}, {"sensor", to_json(s)}}.to_string());
    }
    void coco_gui::removed_sensor(const sensor &s)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(json::json{{"type", "removed_sensor"}, {"sensor", s.get_id()}}.to_string());
    }

    void coco_gui::new_sensor_value(const sensor &s, const std::chrono::system_clock::time_point &time, const json::json &value)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(json::json{{"type", "new_sensor_value"}, {"sensor", s.get_id()}, {"timestamp", std::chrono::system_clock::to_time_t(time)}, {"value", value}}.to_string());
    }
    void coco_gui::new_sensor_state(const sensor &s, const std::chrono::system_clock::time_point &time, const json::json &state)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(json::json{{"type", "new_sensor_state"}, {"sensor", s.get_id()}, {"timestamp", std::chrono::system_clock::to_time_t(time)}, {"state", state}}.to_string());
    }

    void coco_gui::new_solver(const coco_executor &exec)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(solver_created_message(exec.get_executor()).to_string());
    }
    void coco_gui::removed_solver(const coco_executor &exec)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(solver_destroyed_message(exec.get_executor()).to_string());
    }

    void coco_gui::state_changed(const coco_executor &exec)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        json::json j_sc = solver_state_changed_message(exec.get_executor().get_solver());
        j_sc["time"] = ratio::to_json(exec.get_executor().get_current_time());
        json::json j_executing(json::json_type::array);
        for (const auto &atm : exec.get_executor().get_executing())
            j_executing.push_back(get_id(*atm));
        j_sc["executing"] = std::move(j_executing);
        broadcast(j_sc.to_string());
    }

    void coco_gui::flaw_created(const coco_executor &, const ratio::flaw &f)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(flaw_created_message(f).to_string());
    }
    void coco_gui::flaw_state_changed(const coco_executor &, const ratio::flaw &f)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(flaw_state_changed_message(f).to_string());
    }
    void coco_gui::flaw_cost_changed(const coco_executor &, const ratio::flaw &f)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(flaw_cost_changed_message(f).to_string());
    }
    void coco_gui::flaw_position_changed(const coco_executor &, const ratio::flaw &f)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(flaw_position_changed_message(f).to_string());
    }
    void coco_gui::current_flaw(const coco_executor &, const ratio::flaw &f)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(current_flaw_message(f).to_string());
    }

    void coco_gui::resolver_created(const coco_executor &, const ratio::resolver &r)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(resolver_created_message(r).to_string());
    }
    void coco_gui::resolver_state_changed(const coco_executor &, const ratio::resolver &r)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(resolver_state_changed_message(r).to_string());
    }
    void coco_gui::current_resolver(const coco_executor &, const ratio::resolver &r)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(current_resolver_message(r).to_string());
    }

    void coco_gui::causal_link_added(const coco_executor &, const ratio::flaw &f, const ratio::resolver &r)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(causal_link_added_message(f, r).to_string());
    }

    void coco_gui::executor_state_changed(const coco_executor &exec, ratio::executor::executor_state)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(executor_state_changed_message(exec.get_executor()).to_string());
    }

    void coco_gui::tick(const coco_executor &exec, const utils::rational &time)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(tick_message(exec.get_executor(), time).to_string());
    }

    void coco_gui::start(const coco_executor &exec, const std::unordered_set<ratio::atom *> &atoms)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(start_message(exec.get_executor(), atoms).to_string());
    }
    void coco_gui::end(const coco_executor &exec, const std::unordered_set<ratio::atom *> &atoms)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        broadcast(end_message(exec.get_executor(), atoms).to_string());
    }

    void coco_gui::broadcast(const std::string &&msg, bool to_all)
    {
        std::lock_guard<std::recursive_mutex> _(cc.get_mutex());
        utils::c_ptr<network::message> m = new network::message(msg);
        if (to_all)
            for (auto &[tkn, conn] : user_to_ws)
                conn->send(m);
        else
            for (auto &[tkn, conn] : user_to_ws)
                if (cc.get_database().get_user(tkn).get_data()["type"] == "admin")
                    conn->send(m);
    }
} // namespace coco_gui