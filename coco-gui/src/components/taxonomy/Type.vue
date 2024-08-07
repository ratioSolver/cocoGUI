<template>
  <n-flex direction="vertical">
    <n-flex justify="space-around" size="large">
      <n-input v-model:value="type.name" label="Name" required />
      <n-input v-model:value="type.description" label="Description" required />
    </n-flex>
    <n-table>
      <thead>
        <tr>
          <th class="text-left">Static parameter name</th>
          <th class="text-left">Parameter type</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="[name, tp] in type.static_properties" :key="name">
          <td>{{ name }}</td>
          <td>{{ tp.default_value }}</td>
        </tr>
      </tbody>
    </n-table>
    <n-table>
      <thead>
        <tr>
          <th class="text-left">Dynamic parameter name</th>
          <th class="text-left">Parameter type</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="[name, tp] in type.static_properties" :key="name">
          <td>{{ name }}</td>
          <td>{{ tp.default_value }}</td>
        </tr>
      </tbody>
    </n-table>
  </n-flex>
</template>

<script setup lang="ts">
import { NFlex, NInput, NTable } from 'naive-ui';
import { taxonomy } from '@/taxonomy';

defineProps<{ type: taxonomy.Type; }>();
</script>