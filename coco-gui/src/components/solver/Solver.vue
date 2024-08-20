<template>
  <n-grid v-if="slv" y-gap="12" :cols="1" style="padding: 12px;">
    <n-grid-item>
      {{ slv.name }}
    </n-grid-item>
    <n-grid-item>
      <n-tabs v-if="slv" type="line" animated>
        <n-tab-pane name="timelines" tab="Timelines">
          <solver-timelines :slv="slv" :key="slv.id" />
        </n-tab-pane>
        <n-tab-pane name="graph" tab="Graph">
          <solver-graph :slv="slv" :key="slv.id" style="height: calc(100vh - 180px);" />
        </n-tab-pane>
      </n-tabs>
    </n-grid-item>
  </n-grid>
</template>

<script setup lang="ts">
import { NGrid, NGridItem, NTabs, NTabPane } from 'naive-ui';
import SolverTimelines from './SolverTimelines.vue';
import SolverGraph from './SolverGraph.vue';
import { ref } from 'vue';
import { useRoute, onBeforeRouteUpdate } from 'vue-router';
import { useCoCoStore } from '@/stores/coco';

const route = useRoute();
const slv = ref(useCoCoStore().state.solvers.get(parseInt(route.params.id as string)));
onBeforeRouteUpdate((to, from) => {
  slv.value = useCoCoStore().state.solvers.get(parseInt(to.params.id as string));
});
</script>