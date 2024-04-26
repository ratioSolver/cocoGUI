<template>
  <v-app>
    <v-navigation-drawer v-model="drawer">
      <v-list dense v-model:selected="window_model">
        <v-list-item value="chat" title="Chat" prepend-icon="mdi-message-text-outline" />
        <v-list-subheader v-if="sorted_sensors(sensors).size > 0" inset>Sensors</v-list-subheader>
        <SensorListItem v-for="[id, sensor] in sorted_sensors(sensors)" :key="id" :sensor="sensor" />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>CoCo</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <v-window v-model="window_model" class="fill-height">
        <Chat />
        <Sensor v-for="[id, sensor] in sorted_sensors(sensors)" :key="id" :sensor="sensor" />
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

const { sensors, solvers, messages } = storeToRefs(useAppStore());
</script>

<script>
function sorted_sensors(sensors) {
  return new Map([...sensors].filter(([id, sensor]) => !sensor.name.startsWith('part_')).sort((s1, s2) => s1[1].name.localeCompare(s2[1].name)));
}
</script>