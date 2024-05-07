import { Solver } from '@/solver';
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    sensor_types: new Map(),
    sensors: new Map(),
    solvers: new Map(),
    messages: [],
  }),
  actions: {
    connect(url = 'ws://' + location.host + '/coco', timeout = 1000) {
      this.socket = new WebSocket(url);
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.socket.send(JSON.stringify({ 'type': 'login' }));
      };
      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        setTimeout(() => { this.connect(url, timeout); }, timeout);
      };
      this.socket.onerror = (error) => {
        console.log('WebSocket Error: ' + error);
        setTimeout(() => { this.connect(url, timeout); }, timeout);
      };
      this.socket.onmessage = (msg) => {
        let data = JSON.parse(msg.data);
        console.log(data);
        switch (data.type) {
          case 'solvers':
            this.solvers.clear();
            for (const solver of data.solvers)
              this.solvers.set(solver.id, new Solver(solver.id, solver.name, solver.state));
            break;
          case 'new_executor':
            this.solvers.set(data.id, new Solver(data.id, data.name, data.state));
            break;
          case 'deleted_executor':
            this.solvers.delete(data.id);
            break;
        }
      };
    },
    send_message(message) {
      this.messages.push({ 'me': true, 'timestamp': new Date(), 'text': message });
    }
  }
})