import { ref } from 'vue'
import { defineStore } from 'pinia'
import { coco } from '@/coco'

export const useCocoStore = defineStore('coco', () => {
  const name = ref('CoCo');
  const state = ref(new coco.State());

  return { name, state };
});
