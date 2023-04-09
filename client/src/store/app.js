// Utilities
import { defineStore } from 'pinia'
import { SolverD3 } from '../solverD3';
import { nextTick } from 'vue';

const server = {
  host: 'localhost',
  port: 8080
}

export const useAppStore = defineStore('app', {
  state: () => ({
    token: localStorage.getItem('token'),
    user: null,
    login_dialog: false,
    sensor_types: new Map(),
    sensors: new Map(),
    solvers: new Map(),
    users: new Map()
  }),
  actions: {
    login(email, password) {
      fetch('http://' + server.host + ':' + server.port + '/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      }).then(res => {
        if (res.status === 200) {
          res.json().then(data => {
            this.token = data.token;
            localStorage.setItem('token', data.token);
          });
          this.login_dialog = false;
        }
      });
    },
    logout() {
      localStorage.removeItem('token');
      this.token = null;
      this.user = null;
      this.sensor_types.clear();
      this.sensors.clear();
      this.solvers.clear();
      this.users.clear();
      this.login_dialog = true;
    },
    connect(url = 'ws://' + server.host + ':' + server.port + '/coco', timeout = 1000) {
      this.socket = new WebSocket(url);
      this.socket.onopen = () => {
        this.socket.send(JSON.stringify({ 'type': 'connect', 'token': this.token }));
      };
      this.socket.onclose = () => {
        setTimeout(() => { this.connect(url, timeout); }, timeout);
      };
      this.socket.onmessage = (msg) => {
        let data = JSON.parse(msg.data);
        switch (data.type) {
          case 'connect':
            if (data.success)
              this.user = data.user;
            else
              this.logout();
            break;
          case 'users':
            for (let user of data.users)
              this.users.set(user.id, user);
            break;
          case 'new_user':
            this.users.set(data.user.id, data.user);
            break;
          case 'updated_user':
            this.users.set(data.user.id, data.user);
            break;
          case 'removed_user':
            this.users.delete(data.user);
            break;
          case 'user_connected':
            this.users.get(data.user).connected = true;
            break;
          case 'user_disconnected':
            this.users.get(data.user).connected = false;
            break;
          case 'sensor_types':
            for (let sensor_type of data.sensor_types)
              this.sensor_types.set(sensor_type.id, sensor_type);
            break;
          case 'new_sensor_type':
            this.sensor_types.set(data.sensor_type.id, data.sensor_type);
            break;
          case 'updated_sensor_type':
            this.sensor_types.set(data.sensor_type.id, data.sensor_type);
            break;
          case 'removed_sensor_type':
            this.sensor_types.delete(data.sensor_type);
            break;
          case 'sensors':
            for (let sensor of data.sensors) {
              sensor.data = [];
              this.sensors.set(sensor.id, sensor);
            }
            break;
          case 'new_sensor':
            data.sensor.data = [];
            this.sensors.set(data.sensor.id, data.sensor);
            break;
          case 'updated_sensor':
            this.sensors.set(data.sensor.id, data.sensor);
            break;
          case 'removed_sensor':
            this.sensors.delete(data.sensor);
            break;
          case 'new_sensor_value':
            this.sensors.get(data.sensor).data.push(data.value);
            this.sensors.get(data.sensor).value = data.value;
            break;
          case 'new_sensor_state':
            this.sensors.get(data.sensor).state = data.state;
            break;
          case 'solvers':
            for (let solver of data.solvers)
              this.solvers.set(solver.id, new SolverD3(solver.id, solver.name, solver.state));
            nextTick(() => {
              for (let [id, slv] of this.solvers)
                slv.init(this.get_timelines_id(id), this.get_graph_id(id));
            });
            break;
          case 'new_solver':
            const slv = new SolverD3(data.solver.id, data.solver.name, data.solver.state);
            this.solvers.set(data.solver.id, slv);
            nextTick(() => { slv.init(this.get_timelines_id(slv.id), this.get_graph_id(slv.id)); });
            break;
          case 'removed_solver':
            this.solvers.delete(data.solver);
            break;
          case 'state_changed':
            this.solvers.get(data.solver_id).state_changed(data);
            break;
          case 'graph':
            this.solvers.get(data.solver_id).graph(data);
            break;
          case 'flaw_created':
            this.solvers.get(data.solver_id).flaw_created(data);
            break;
          case 'flaw_state_changed':
            this.solvers.get(data.solver_id).flaw_state_changed(data);
            break;
          case 'flaw_cost_changed':
            this.solvers.get(data.solver_id).flaw_cost_changed(data);
            break;
          case 'flaw_position_changed':
            this.solvers.get(data.solver_id).flaw_position_changed(data);
            break;
          case 'current_flaw':
            this.solvers.get(data.solver_id).current_flaw_changed(data);
            break;
          case 'resolver_created':
            this.solvers.get(data.solver_id).resolver_created(data);
            break;
          case 'resolver_state_changed':
            this.solvers.get(data.solver_id).resolver_state_changed(data);
            break;
          case 'current_resolver':
            this.solvers.get(data.solver_id).current_resolver_changed(data);
            break;
          case 'causal_link_added':
            this.solvers.get(data.solver_id).causal_link_added(data);
            break;
          case 'executor_state_changed':
            this.solvers.get(data.solver_id).executor_state_changed(data);
            break;
          case 'tick':
            this.solvers.get(data.solver_id).tick(data);
            break;
          case 'starting':
            this.solvers.get(data.solver_id).starting(data);
            break;
          case 'ending':
            this.solvers.get(data.solver_id).ending(data);
            break;
          case 'start':
            this.solvers.get(data.solver_id).start(data);
            break;
          case 'end':
            this.solvers.get(data.solver_id).end(data);
            break;
        }
      };
    },
    publish_sensor_value(sensor, value) {
      fetch('http://' + server.host + ':' + server.port + '/sensor/' + sensor, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': this.token
        },
        body: JSON.stringify(value)
      });
    }
  },
  getters: {
    parameter_type: (state) => {
      return (type) => {
        switch (type) {
          case 1: return 'int';
          case 2: return 'float';
          case 3: return 'bool';
          case 4: return 'symbol';
          case 5: return 'string';
          default: return 'unknown';
        }
      };
    },
    input_type: (state) => {
      return (type) => {
        switch (type) {
          case 1:
          case 2: return 'number';
          case 3: return 'checkbox';
          case 4:
          case 5: return 'text';
          default: return 'unknown';
        }
      };
    },
    get_timelines_id: (state) => { return (id) => 'tls-' + id; },
    get_graph_id: (state) => { return (id) => 'gr-' + id; }
  }
})
