<template>
  <v-list-item :value="rule.id" :title="rule.name" prepend-icon="mdi-cog-outline" />
</template>

<script setup>
import { Rule } from '@/solver';

defineProps({
  rule: {
    type: Rule,
    required: true
  }
});
</script>