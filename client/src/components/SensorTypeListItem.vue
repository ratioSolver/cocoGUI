<template>
  <v-list-item :value="sensor_type.id" :title="sensor_type.name" :subtitle="sensor_type.description"
    prepend-icon="mdi-package-variant-closed" three-line />
</template>

<script setup>
import { SensorType } from '@/sensor';

defineProps({
  sensor_type: {
    type: SensorType,
    required: true
  }
});
</script>