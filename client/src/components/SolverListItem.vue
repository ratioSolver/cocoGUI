<template>
  <v-list-item :value="solver.id" :title="solver.name">
  </v-list-item>
</template>
  
<script setup>
import { useAppStore } from '@/store/app';
import { storeToRefs } from 'pinia';

defineProps({
  solver: {
    type: Object,
    required: true,
  },
});

const { } = storeToRefs(useAppStore());
</script>