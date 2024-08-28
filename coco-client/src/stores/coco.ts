import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useCoCoStore = defineStore('CoCo', () => {
  const layers = ref<string[]>([]);

  return { layers }
});