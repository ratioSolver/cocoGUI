<template>
  <v-list-item :value="item.id" :title="item.name" :subtitle="item.description" prepend-icon="mdi-thermometer"
    three-line />
</template>

<script setup>
import { Item } from '@/item';

defineProps({
  item: {
    type: Item,
    required: true
  }
});
</script>