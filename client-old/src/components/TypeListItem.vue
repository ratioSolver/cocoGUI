<template>
  <v-list-item :value="type.id" :title="type.name" :subtitle="type.description"
    prepend-icon="mdi-package-variant-closed" three-line />
</template>

<script setup>
import { Type } from '@/type';

defineProps({
  type: {
    type: Type,
    required: true
  }
});
</script>