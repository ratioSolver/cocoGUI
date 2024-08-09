<template>
  <n-grid v-if="slv" :cols="1">
    <n-grid-item>
      <n-tabs v-if="slv" type="line" animated>
        <n-tab-pane name="timelines" tab="Timelines">
          <solver-timelines :slv="slv" />
        </n-tab-pane>
        <n-tab-pane name="graph" tab="Graph">
          <solver-graph :slv="slv" />
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
const slv = ref(useCoCoStore().state.solvers.get(route.params.id as string));
onBeforeRouteUpdate((to, from) => { slv.value = useCoCoStore().state.solvers.get(to.params.id as string); });
</script>