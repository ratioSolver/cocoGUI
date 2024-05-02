<template>
  <v-app>
    <v-navigation-drawer v-model="drawer">
      <v-list dense v-model:selected="window_model">
        <v-list-item value="chat" title="Chat" prepend-icon="mdi-message-text-outline" />
        <v-list-subheader v-if="solvers.size > 0" inset>Solvers</v-list-subheader>
        <SolverListItem v-for="[id, solver] in solvers" :key="id" :solver="solver" />
        <v-list-subheader v-if="sensors.size > 0" inset>Sensors</v-list-subheader>
        <SensorListItem v-for="[id, sensor] in sorted_sensors(sensors)" :key="id" :sensor="sensor" />
        <v-list-subheader v-if="sensor_types.size > 0" inset>Sensor Types</v-list-subheader>
        <SensorTypeListItem v-for="[id, sensor_type] in sensor_types" :key="id" :sensor_type="sensor_type" />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>CoCo</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <v-window v-model="window_model" class="fill-height">
        <Chat />
        <Solver v-for="[id, solver] in solvers" :key="id" :solver="solver" />
        <Sensor v-for="[id, sensor] in sorted_sensors(sensors)" :key="id" :sensor="sensor" />
        <SensorType v-for="[id, sensor_type] in sensor_types" :key="id" :sensor_type="sensor_type" />
      </v-window>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useAppStore } from '@/store/app';
import { storeToRefs } from 'pinia';

const drawer = ref(false)
const window_model = ref(['chat']);

const { sensors, sensor_types, solvers } = storeToRefs(useAppStore());
</script>

<script>
function sorted_sensors(sensors) {
  return new Map([...sensors].sort((s1, s2) => s1[1].name.localeCompare(s2[1].name)));
}
</script>