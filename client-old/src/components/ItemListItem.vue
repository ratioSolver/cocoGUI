<template>
  <v-list-item :value="item.id" :title="item.name" :subtitle="item.description" prepend-icon="mdi-circle" three-line />
</template>

<script setup>
import { Item } from '@/type';

defineProps({
  item: {
    type: Item,
    required: true
  }
});
</script>