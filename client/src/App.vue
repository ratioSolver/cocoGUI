<template>
  <v-app>
    <v-navigation-drawer v-model="drawer">
      <v-list dense>
        <SensorType v-for="sensor_type in sensor_types" :key="sensor_type.id" :sensor_type="sensor_type" />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>

      <v-toolbar-title>CoCo</v-toolbar-title>
    </v-app-bar>

    <v-main>
    </v-main>
  </v-app>
</template>

<script>
export default {
  data: () => ({ drawer: false }),
}
</script>

<script setup>
import { useAppStore } from './store/app.js'
import { storeToRefs } from 'pinia';

import SensorType from './components/SensorType.vue'

const { sensor_types } = storeToRefs(useAppStore())
</script>
