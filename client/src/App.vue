<template>
  <v-app>
    <v-navigation-drawer v-model="drawer">
      <v-list dense v-model:selected="selected_item">
        <v-list-subheader inset>Sensors</v-list-subheader>
        <SensorListItem v-for="[id, sensor] in sensors" :key="id" :sensor="sensor" />
        <v-divider></v-divider>
        <v-list-subheader inset>Solvers</v-list-subheader>
        <SolverListItem v-for="[id, solver] in solvers" :key="id" :solver="solver" />
        <v-divider></v-divider>
        <v-list-subheader inset>Users</v-list-subheader>
        <UserListItem v-for="[id, user] in users" :key="id" :user="user" />
        <v-list-subheader inset>Sensor types</v-list-subheader>
        <SensorTypeListItem v-for="[id, sensor_type] in sensor_types" :key="id" :sensor_type="sensor_type" />
        <v-divider></v-divider>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>

      <v-toolbar-title>CoCo</v-toolbar-title>

      <v-spacer></v-spacer>

      <strong v-if="user" v-html="user.last_name"></strong>
      <v-avatar v-if="user" size="36px">
        <v-img v-if="user.avatar" alt="Avatar" :src="user.avatar"></v-img>
        <v-icon v-else icon="mdi-account"></v-icon>
      </v-avatar>
      <v-divider vertical></v-divider>
      <v-btn icon="mdi-view-grid-plus" v-if="user" @click="useAppStore().new_sensor_type_dialog = true" />
      <v-btn icon="mdi-plus-network" v-if="user" @click="useAppStore().new_sensor_dialog = true" />
      <v-divider vertical></v-divider>
      <v-btn icon="mdi-microphone" @click="useAppStore().start_speech_recognition()" />
      <v-icon v-if="listening" icon="mdi-ear-hearing" />
      <v-icon v-if="speaking" icon="mdi-account-voice" />
    </v-app-bar>

    <v-main>
      <v-window v-model="selected_item" class='fill-height'>
        <SensorType v-for="[id, sensor_type] in sensor_types" :key="id" :sensor_type="sensor_type" />
        <Sensor v-for="[id, sensor] in sensors" :key="id" :sensor="sensor" />
        <Solver v-for="[id, solver] in solvers" :key="id" :solver="solver" />
        <User v-for="[id, user] in users" :key="id" :user="user" />
      </v-window>

      <Login />
      <NewSensorType />
      <NewSensor />
      <v-snackbar v-model="recognized_text_snackbar" timeout="-1">
        {{ recognized_text }}
      </v-snackbar>
    </v-main>
  </v-app>
</template>

<script>
export default {
    data: () => ({ drawer: false, selected_item: null }),
    components: { NewSensorType }
}
</script>

<script setup>
import { useAppStore } from '@/store/app';
import { storeToRefs } from 'pinia';

import SensorTypeListItem from './components/SensorTypeListItem.vue'
import SensorType from './components/SensorType.vue'
import SensorListItem from './components/SensorListItem.vue'
import Sensor from './components/Sensor.vue'
import SolverListItem from './components/SolverListItem.vue'
import Solver from './components/Solver.vue'
import UserListItem from './components/UserListItem.vue'
import User from './components/User.vue'
import Login from './components/Login.vue'
import NewSensorType from './components/NewSensorType.vue';
import NewSensor from './components/NewSensor.vue';

const { sensor_types, sensors, solvers, users, token, user, login_dialog, listening, recognized_text, recognized_text_snackbar, speaking } = storeToRefs(useAppStore());

useAppStore().init_speech_recognition();

if (token) {
  useAppStore().connect();
} else // we need to show login dialog..
  login_dialog.value = true;
</script>
