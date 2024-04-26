import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    sensor_types: new Map(),
    sensors: new Map(),
    solvers: new Map(),
    messages: [],
  }),
  actions: {
    connect(url = 'ws://' + location.host + '/restart', timeout = 1000) {
      this.socket = new WebSocket(url);
      this.socket.onopen = () => {
        this.socket.send(JSON.stringify({ 'type': 'login' }));
      };
      this.socket.onclose = () => {
        setTimeout(() => { this.connect(url, timeout); }, timeout);
      };
      this.socket.onerror = (error) => {
        console.log('WebSocket Error: ' + error);
        setTimeout(() => { this.connect(url, timeout); }, timeout);
      };
      this.socket.onmessage = (e) => {
      };
    },
    send_message(message) {
      this.messages.push({ 'me': true, 'timestamp': new Date(), 'text': message });
    }
  }
})