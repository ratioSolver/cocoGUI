<template>
  <v-list-item :value="solver.id" :title="solver.name" :prepend-icon="icon!" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Solver, SolverState } from '@/solver';

const props = defineProps<{ solver: Solver; }>();

const icon = computed(() => {
  switch (props.solver.state) {
    case SolverState.reasoning:
    case SolverState.adapting: return 'mdi-brain';
    case SolverState.idle: return 'mdi-pause-circle';
    case SolverState.executing: return 'mdi-play-circle';
    case SolverState.finished: return 'mdi-check-circle';
    case SolverState.failed: return 'mdi-alert-circle';
  }
});
</script>