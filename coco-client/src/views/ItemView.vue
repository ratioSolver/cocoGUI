<template>
  <item v-if="itm" :item="itm" :key="itm.id" />
</template>

<script setup lang="ts">
import { Item } from 'coco-gui';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import { useCoCoStore } from '@/stores/coco';

const route = useRoute();
let itm = useCoCoStore().kb.items.get(route.params.id as string);
onBeforeRouteUpdate((to, from) => { itm = useCoCoStore().kb.items.get(to.params.id as string); });
</script>