<template>
  <v-list-item :value="rule.id" :title="rule.name" prepend-icon="mdi-cog-outline" />
</template>

<script setup>
import { Rule } from '@/knowledge';

defineProps({
  rule: {
    type: Rule,
    required: true
  }
});
</script>