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
        useCoCoStore().update(data);
      };
    },
    send_message(message) {
      this.messages.push({ 'me': true, 'timestamp': new Date(), 'text': message });
    },
    load_data(item_id, from = Date.now() - 1000 * 60 * 60 * 24 * 14, to = Date.now()) {
      console.log('load_data', item_id, from, to);
      fetch('http://' + location.host + '/item/' + item_id + '?' + new URLSearchParams({ from: from, to: to }), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }).then(res => {
        if (res.ok)
          res.json().then(data => {
            console.log(data);
            useCoCoStore().knowledge.set_item_data(item_id, data);
          });
        else
          res.json().then(data => alert(data.message));
      });
    },
    publish_data(item_id, data) {
      console.log('publish_data', item_id, data);
      fetch('http://' + location.host + '/item/' + item_id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => {
        if (!res.ok)
          res.json().then(data => alert(data.message));
      });
    }
  }
});