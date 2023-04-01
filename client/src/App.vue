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

      <v-spacer></v-spacer>

      <v-avatar v-if="user" size="36px">
        <v-img v-if="user.avatar" alt="Avatar" :src="user.avatar"></v-img>
        <v-icon v-else icon="mdi-account"></v-icon>
      </v-avatar>
    </v-app-bar>

    <v-main>
      <Login />
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
import Login from './components/Login.vue'

const { sensor_types, token, user, login_dialog } = storeToRefs(useAppStore());

if (token) {
  useAppStore().connect();
} else // we need to show login dialog..
  login_dialog.value = true;
</script>
