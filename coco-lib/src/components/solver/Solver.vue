<template>
  <n-tabs type="line" animated>
    <n-tab-pane name="timelines" tab="Timelines">
      <solver-timelines :solver="solver" />
    </n-tab-pane>
    <n-tab-pane name="graph" tab="Graph">
      <solver-graph :solver="solver" />
    </n-tab-pane>
  </n-tabs>
</template>

<script setup lang="ts">
import { NTabs, NTabPane } from 'naive-ui';
import SolverTimelines from './SolverTimelines.vue';
import SolverGraph from './SolverGraph.vue';
import { solver } from '@/solver';

defineProps<{ solver: solver.Solver; }>();
</script>