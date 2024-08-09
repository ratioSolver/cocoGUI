<template>
  <n-tabs v-if="slv" type="line" animated>
    <n-tab-pane name="timelines" tab="Timelines">
      <solver-timelines :slv="slv" />
    </n-tab-pane>
    <n-tab-pane name="graph" tab="Graph">
      <solver-graph :slv="slv" />
    </n-tab-pane>
  </n-tabs>
</template>

<script setup lang="ts">
import { NTabs, NTabPane } from 'naive-ui';
import SolverTimelines from './SolverTimelines.vue';
import SolverGraph from './SolverGraph.vue';
import { ref } from 'vue';
import { onBeforeRouteUpdate } from 'vue-router';
import { useCoCoStore } from '@/stores/coco';
import { solver } from '@/solver';

const slv = ref<solver.Solver | undefined>(undefined);
onBeforeRouteUpdate((to, from) => { slv.value = useCoCoStore().state.solvers.get(to.params.id as string); });
</script>