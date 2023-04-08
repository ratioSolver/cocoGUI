<template>
  <v-list-item :value="sensor_type.id" :title="sensor_type.name" :subtitle="sensor_type.description">
  </v-list-item>
</template>

<script setup>
defineProps({
  sensor_type: {
    type: Object,
    required: true,
  },
});
</script>