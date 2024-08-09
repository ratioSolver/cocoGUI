<template>
  <n-flex direction="vertical">
    <n-flex v-if="type" justify="space-around" size="large">
      <n-input v-model:value="type.name" label="Name" required />
      <n-input v-model:value="type.description" label="Description" required />
    </n-flex>
    <n-flex v-if="static_props.size" vertical>
      Static properties
      <n-data-table :columns="columns"
        :data="Array.from(static_props).map(([name, prop]) => ({ name, property: prop }))" />
    </n-flex>
    <n-flex v-if="dynamic_props.size" vertical>
      Dynamic properties
      <n-data-table :columns="columns"
        :data="Array.from(dynamic_props).map(([name, prop]) => ({ name, property: prop }))" />
    </n-flex>
  </n-flex>
</template>

<script setup lang="ts">
import { NFlex, NInput, NDataTable } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui'
import { taxonomy } from '@/taxonomy';
import { onBeforeRouteUpdate } from 'vue-router';
import { useCoCoStore, static_properties, dynamic_properties } from '@/stores/coco';
import { ref } from 'vue';

const type = ref<taxonomy.Type | undefined>(undefined);
const static_props = ref<Map<string, taxonomy.Property>>(new Map());
const dynamic_props = ref<Map<string, taxonomy.Property>>(new Map());
onBeforeRouteUpdate((to, from) => {
  type.value = useCoCoStore().state.types.get(to.params.id as string);
  if (type.value) {
    static_props.value = static_properties(type.value);
    dynamic_props.value = dynamic_properties(type.value);
  }
});

interface PropertyRow {
  name: string;
  property: taxonomy.Property;
}

const columns: DataTableColumns<PropertyRow> = [
  {
    title: 'Property name',
    key: 'name',
    width: '80%',
  },
  {
    title: 'Value',
    key: 'property',
    width: '20%',
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

defineProps<{ type: taxonomy.Type; }>();
</script>