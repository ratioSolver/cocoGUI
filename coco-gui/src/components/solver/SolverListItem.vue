<template>
  <router-link :to="'/solver/' + props.solver.id" style="margin: 12px;">
    <n-list-item :value="props.solver.id">
      <template #prefix>
        <n-icon size="medium" :component="icon" />
      </template>
      <n-thing :title="props.solver.name" />
    </n-list-item>
  </router-link>
</template>

<script setup lang="ts">
import { NListItem, NIcon } from 'naive-ui';
import { BrainCircuit20Regular, PauseCircle20Regular, PlayCircle20Regular, CheckmarkCircle20Regular, ErrorCircle20Regular } from '@vicons/fluent';
import { solver } from '@/solver';
import { computed } from 'vue';

const props = defineProps<{ solver: solver.Solver; }>();

const icon = computed(() => {
  switch (props.solver.state) {
    case solver.State.reasoning:
    case solver.State.adapting: return BrainCircuit20Regular;
    case solver.State.idle: return PauseCircle20Regular;
    case solver.State.executing: return PlayCircle20Regular;
    case solver.State.finished: return CheckmarkCircle20Regular;
    case solver.State.failed: return ErrorCircle20Regular;
  }
});
</script>