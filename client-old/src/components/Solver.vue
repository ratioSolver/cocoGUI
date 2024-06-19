<template>
  <v-tabs v-if='show_tabs' v-model='tab' color='deep-purple-accent-4'>
    <v-tab value='timelines'><v-icon>mdi-chart-timeline</v-icon>Timelines</v-tab>
    <v-tab value='graph'><v-icon>mdi-graph-outline</v-icon>Graph</v-tab>
  </v-tabs>
  <v-window :id="'slv-' + solver.id" v-model='tab' class='fill-height' show-arrows>
    <v-window-item value='timelines' class='fill-height'>
      <SolverTimelines :solver='solver' />
    </v-window-item>
    <v-window-item value='graph' class='fill-height'>
      <SolverGraph :solver='solver' />
    </v-window-item>
  </v-window>
</template>

<script setup>
import { ref } from 'vue';
import { Solver } from '@/solver';

const props = defineProps({
  solver: {
    type: Solver,
    required: true
  },
  show_tabs: {
    type: Boolean,
    required: false,
    default: true,
  }
});

const tab = ref('timelines');
</script>