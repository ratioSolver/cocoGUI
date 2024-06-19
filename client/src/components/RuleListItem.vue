<template>
  <v-list-item :value="rule.id" :title="rule.name" prepend-icon="mdi-cog-outline" />
</template>

<script setup lang="ts">
import { Rule } from '@/knowledge';

defineProps<{ rule: Rule; }>();
</script>