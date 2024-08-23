<template>
  <type v-if="tp" :type="tp" :key="tp.id" />
</template>

<script setup lang="ts">
import { Type } from 'coco-gui';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import { useCoCoStore } from '@/stores/coco';

const route = useRoute();
let tp = useCoCoStore().kb.types.get(route.params.id as string);
onBeforeRouteUpdate((to, from) => { tp = useCoCoStore().kb.types.get(to.params.id as string); });
</script>