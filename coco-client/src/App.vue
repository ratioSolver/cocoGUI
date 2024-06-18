<template>
  <v-app>
    <v-navigation-drawer v-model="drawer">
      <v-list-item value="chat" title="Chat" prepend-icon="mdi-message-text-outline" />
    </v-navigation-drawer>
    <v-app-bar>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>CoCo</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <v-window v-model="window_model" class="fill-height">
        <v-window-item value="chat" class="fill-height">
          <Chat :messages="messages" @send="send_message" />
        </v-window-item>
      </v-window>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const drawer = ref(false)
const window_model = ref(['chat']);
const messages = ref([]);

function send_message(message: string) {
  messages.value.push({ text: message, me: true });
}
</script>
