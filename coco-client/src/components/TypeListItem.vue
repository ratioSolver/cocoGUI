<template>
  <v-list-item :value="type.id" :title="type.name" :subtitle="type.description"
    prepend-icon="mdi-package-variant-closed" three-line />
</template>

<script setup lang="ts">
import { coco } from '@/type';

defineProps<{ type: coco.Type; }>();
</script>