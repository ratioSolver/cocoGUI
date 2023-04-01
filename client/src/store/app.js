// Utilities
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    sensor_types: [],
    sensors: [],
    users: []
  }),
})
