<template>
  <solver v-if="slv" :solver="slv" :key="slv.id" />
</template>

<script setup lang="ts">
import { Solver } from 'coco-gui';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import { useCoCoStore } from '@/stores/coco';

const route = useRoute();
let slv = useCoCoStore().kb.solvers.get(parseInt(route.params.id as string));
onBeforeRouteUpdate((to, from) => { slv = useCoCoStore().kb.solvers.get(parseInt(to.params.id as string)); });
</script>