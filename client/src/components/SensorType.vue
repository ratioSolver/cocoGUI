<template>
  <v-list-item>
    <v-list-item-content>
      <v-list-item-title>{{ sensor_type.name }}</v-list-item-title>
    </v-list-item-content>
  </v-list-item>
</template>

<script setup>
defineProps({
  sensor_type: {
    type: Object,
    required: true,
  },
})
</script>