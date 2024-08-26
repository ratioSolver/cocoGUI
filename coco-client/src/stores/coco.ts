import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import { coco } from 'coco-gui'

export const useCoCoStore = defineStore('CoCo', () => {
  const kb = reactive<coco.KnowledgeBase>(coco.KnowledgeBase.getInstance());
  const layers = ref<string[]>([]);
  let socket: WebSocket | null = null;

  function connect(timeout = 5000) {
    socket = new WebSocket('ws://' + window.location.host + '/coco');
    socket.onopen = () => {
      console.log('Connected to CoCo server');
    };
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received:', data);
      kb.update_knowledge(data);
    };
    socket.onclose = () => {
      console.log('Connection to CoCo server closed');
      setTimeout(() => connect(timeout), timeout);
    };
  }

  return { kb, layers, connect }
});