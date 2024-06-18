<template>
  <v-list-item :value="item.id" :title="item.name" :subtitle="item.description" prepend-icon="mdi-circle" three-line />
</template>

<script setup lang="ts">
import { coco } from '@/type';

defineProps<{ item: coco.Item; }>();
</script>