<template>
  <router-link :to="'/type/' + type.id" style="margin: 12px;">
    <n-list-item :value="type.id">
      <template #prefix>
        <n-icon size="medium" :component="Box20Regular" />
      </template>
      <n-thing :title="type.name" :description="type.description" />
    </n-list-item>
  </router-link>
</template>

<script setup lang="ts">
import { NListItem, NIcon, NThing } from 'naive-ui';
import { Box20Regular } from '@vicons/fluent';
import { taxonomy } from '@/taxonomy';

defineProps<{ type: taxonomy.Type; }>();
</script>