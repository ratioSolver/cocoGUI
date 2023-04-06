// Utilities
import { defineStore } from 'pinia'
import { SolverD3 } from 'ratio-solver/solverD3';

const server = {
  host: 'localhost',
  port: 8080
}

export const useAppStore = defineStore('app', {
  state: () => ({
    token: localStorage.getItem('token'),
    user: null,
    login_dialog: false,
    sensor_types: [],
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
      this.sensor_types = [];
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
          case 'user_connected':
            this.users.get(data.user).connected = true;
            break;
          case 'user_disconnected':
            this.users.get(data.user).connected = false;
            break;
          case 'sensor_types':
            this.sensor_types = data.sensor_types;
            break;
          case 'sensors':
            for (let sensor of data.sensors)
              this.sensors.set(sensor.id, sensor);
            break;
          case 'solvers':
            for (let solver of data.solvers) {
              const slv = new SolverD3(solver.name, solver.state);
              this.solvers.set(solver.id, slv);
              nextTick(() => { slv.init(this.get_timelines_id(slv.id), this.get_graph_id(slv.id)); });
            }
            break;
          case 'users':
            for (let user of data.users)
              this.users.set(user.id, user);
            break;
        }
      };
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
    get_timelines_id: (state) => { return (id) => 'tls-' + id; },
    get_graph_id: (state) => { return (id) => 'gr-' + id; }
  }
})
