import { ref } from 'vue'
import { defineStore } from 'pinia'
import { coco } from 'coco-gui'

export const useCoCoStore = defineStore('CoCo', () => {
  const kb = ref(coco.KnowledgeBase.getInstance())

  return { kb }
})
