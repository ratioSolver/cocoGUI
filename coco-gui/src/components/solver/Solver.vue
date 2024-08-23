<template>
  <n-grid v-if="props.solver" y-gap="12" :cols="1" style="padding: 12px;">
    <n-grid-item>
      {{ props.solver.name }}
    </n-grid-item>
    <n-grid-item>
      <n-tabs v-if="props.solver" type="line" animated>
        <n-tab-pane name="timelines" tab="Timelines">
          <solver-timelines :slv="props.solver" :key="props.solver.id" />
        </n-tab-pane>
        <n-tab-pane name="graph" tab="Graph">
          <solver-graph :slv="props.solver" :key="props.solver.id" style="height: calc(100vh - 180px);" />
        </n-tab-pane>
      </n-tabs>
    </n-grid-item>
  </n-grid>
</template>

<script setup lang="ts">
import { NGrid, NGridItem, NTabs, NTabPane } from 'naive-ui';
import SolverTimelines from './SolverTimelines.vue';
import SolverGraph from './SolverGraph.vue';
import { solver } from '@/solver';

const props = defineProps<{ solver: solver.Solver; }>();
</script>