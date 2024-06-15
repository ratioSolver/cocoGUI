import { defineStore } from 'pinia'
import { useCoCoStore } from './coco';

export const useAppStore = defineStore('app', {
  state: () => ({
    messages: [],
  }),
  actions: {
    connect(url = 'ws://' + window.location.host + '/coco', timeout = 10000) {
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
      };
      this.socket.onmessage = (msg) => {
        let data = JSON.parse(msg.data);
        console.log(data);
        useCoCoStore.update(data);
      };
    },
    send_message(message) {
      this.messages.push({ 'me': true, 'timestamp': new Date(), 'text': message });
    }
  }
});