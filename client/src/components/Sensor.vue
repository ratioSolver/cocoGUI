<template>
  <v-list-item>
    <v-list-item-title>{{ sensor.name }}</v-list-item-title>
  </v-list-item>
</template>

<script setup>
defineProps({
  sensor: {
    type: Object,
    required: true,
  },
})
</script>