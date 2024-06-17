import { Knowledge } from '@/knowledge';
import { Solver } from '@/solver';
import { defineStore } from 'pinia'

export const useCoCoStore = defineStore('CoCo', {
  state: () => ({
    knowledge: new Knowledge()
  }),
  actions: {
    update(data) {
      console.log('Updating knowledge');
      console.log(data);
      this.knowledge.update(data);
    }
  }
});