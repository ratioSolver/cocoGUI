<template>
  <router-link :to="'/item/' + item.id" style="margin: 12px;">
    <n-list-item :value="item.id">
      <template #prefix>
        <n-icon size="medium" :component="Circle20Regular" />
      </template>
      <n-thing :title="item.name" :description="item.description" />
    </n-list-item>
  </router-link>
</template>

<script setup lang="ts">
import { NListItem, NIcon, NThing } from 'naive-ui';
import { Circle20Regular } from '@vicons/fluent';
import { taxonomy } from '@/taxonomy';

defineProps<{ item: taxonomy.Item; }>();
</script>