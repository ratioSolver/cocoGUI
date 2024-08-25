<template>
  <n-grid v-if="type" x-gap="12" y-gap="12" :cols="3" style="padding: 12px;">
    <n-grid-item>{{ type.id }}</n-grid-item>
    <n-grid-item>
      <n-input v-model:value="type.name" label="Name" required />
    </n-grid-item>
    <n-grid-item>
      <n-input v-model:value="type.description" label="Description" required />
    </n-grid-item>
    <n-grid-item span="3">
      <h3>Static properties</h3>
    </n-grid-item>
    <n-grid-item span="3">
      <n-data-table :columns="columns"
        :data="Array.from(static_props).map(([name, prop]) => ({ name, property: prop }))" />
    </n-grid-item>
    <n-grid-item span="3">
      <h3>Dynamic properties</h3>
    </n-grid-item>
    <n-grid-item span="3">
      <n-data-table :columns="columns"
        :data="Array.from(dynamic_props).map(([name, prop]) => ({ name, property: prop }))" />
    </n-grid-item>
  </n-grid>
</template>

<script setup lang="ts">
import { NGrid, NGridItem, NInput, NDataTable } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui'
import { taxonomy } from '@/taxonomy';

const props = defineProps<{ type: taxonomy.Type; }>();
const static_props = taxonomy.static_properties(props.type);
const dynamic_props = taxonomy.dynamic_properties(props.type);

interface PropertyRow {
  name: string;
  property: taxonomy.Property;
}

const columns: DataTableColumns<PropertyRow> = [
  {
    title: 'Property name',
    key: 'name',
    width: '60%',
  },
  {
    title: 'Value',
    key: 'property',
    width: '40%',
    render(row) {
      if (row.property instanceof taxonomy.BooleanProperty) {
        return 'bool' + (row.property.default_value ? ' (' + row.property.default_value + ')' : '');
      } else if (row.property instanceof taxonomy.IntegerProperty) {
        return 'int [' + row.property.min + ', ' + row.property.max + ']' + (row.property.default_value ? ' (' + row.property.default_value + ')' : '');
      } else if (row.property instanceof taxonomy.RealProperty) {
        return 'real [' + row.property.min + ', ' + row.property.max + ']' + (row.property.default_value ? ' (' + row.property.default_value + ')' : '');
      } else if (row.property instanceof taxonomy.StringProperty) {
        return 'string' + (row.property.default_value ? ' (' + row.property.default_value + ')' : '');
      } else if (row.property instanceof taxonomy.SymbolProperty) {
        return 'symbol {' + (row.property.symbols && row.property.symbols.length < 10 ? row.property.symbols.join(', ') : row.property.symbols ? row.property.symbols.length + ' symbols' : '...') + '}' + (row.property.default_value ? ' (' + row.property.default_value + ')' : '');
      } else if (row.property instanceof taxonomy.ItemProperty) {
        return 'item {' + row.property.type.name + '}' + (row.property.default_value ? ' (' + row.property.default_value + ')' : '');
      } else {
        return '';
      }
    }
  }
];
</script>