// Utilities
import { defineStore } from 'pinia'

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
    sensors: [],
    users: []
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
      this.sensors = [];
      this.users = [];
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
          case 'sensor_types':
            this.sensor_types = data.sensor_types;
            break;
          case 'sensors':
            this.sensors = data.sensors;
            break;
          case 'users':
            this.users = data.users;
            break;
        }
      };
    }
  }
})
