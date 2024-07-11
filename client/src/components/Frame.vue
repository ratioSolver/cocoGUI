<template>
  <v-card v-if="!maximized" class="fill-height">
    <v-toolbar density="compact">
      <v-toolbar-title>{{ props.title }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="maximized = true">
        <v-icon>mdi-window-maximize</v-icon>
      </v-btn>
    </v-toolbar>
    <v-card-text class="fill-height">
      <slot></slot>
    </v-card-text>
  </v-card>

  <v-dialog v-else v-model="maximized" persistent width="100%" height="100%">
    <v-card class="fill-height">
      <v-toolbar density="compact">
        <v-toolbar-title>{{ props.title }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="maximized = false">
          <v-icon>mdi-window-restore</v-icon>
        </v-btn>
      </v-toolbar>
      <v-card-text class="fill-height">
        <slot></slot>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{ title: string; }>();

const maximized = ref(false);
</script>