import { Knowledge } from '@/knowledge';
import { defineStore } from 'pinia'

export const useCoCoStore = defineStore('CoCo', {
  state: () => ({
    knowledge: new Knowledge()
  }),
  actions: {
    update(data) {
      this.knowledge.update(data);
    }
  }
});