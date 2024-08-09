<template>
  <n-list-item :value="type.id">
    <template #prefix>
      <n-icon size="medium" :component="Box20Regular" />
    </template>
    <router-link :to="'/types/' + type.id">
      <n-thing :title="type.name" :description="type.description" />
    </router-link>
  </n-list-item>
</template>

<script setup lang="ts">
import { NListItem, NIcon, NThing } from 'naive-ui';
import { Box20Regular } from '@vicons/fluent';
import { taxonomy } from '@/taxonomy';

defineProps<{ type: taxonomy.Type; }>();
</script>