<template>
  <v-card :class="{ 'maximized': maximized }" class="fill-height">
    <v-toolbar density="compact">
      <v-toolbar-title>{{ props.title }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="toggle_maximized">
        <v-icon>{{ maximized ? 'mdi-window-minimize' : 'mdi-window-maximize' }}</v-icon>
      </v-btn>
    </v-toolbar>
    <v-card-text class="fill-height">
      <slot></slot>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{ title: string; }>();

const maximized = ref(false);

function toggle_maximized() {
  maximized.value = !maximized.value;
}
</script>

<style scoped>
.maximized {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>