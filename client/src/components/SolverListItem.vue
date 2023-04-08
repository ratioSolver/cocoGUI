<template>
  <v-list-item :value="solver.id" :title="solver.name">
  </v-list-item>
</template>
  
<script setup>
defineProps({
  solver: {
    type: Object,
    required: true,
  },
});
</script>