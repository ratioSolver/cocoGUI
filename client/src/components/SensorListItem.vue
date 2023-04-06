<template>
  <v-list-item :value="sensor.id" :title="sensor.name" :subtitle="sensor.description">
  </v-list-item>
</template>

<script setup>
defineProps({
  sensor: {
    type: Object,
    required: true,
  },
});
</script>