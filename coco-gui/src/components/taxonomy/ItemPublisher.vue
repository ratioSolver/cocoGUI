<template>
  <n-grid y-gap="12" :cols="1">
    <n-grid-item>
      <n-data-table :columns="columns"
        :data="Array.from(dynamic_props).map(([name, prop]) => ({ name, property: prop }))" />
    </n-grid-item>
    <n-grid-item>
      <n-button type="primary" @click="publish">Publish</n-button>
    </n-grid-item>
  </n-grid>
</template>

<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'
import { NGrid, NGridItem, NDataTable, NButton } from 'naive-ui';
import { coco } from '@/coco';
import { taxonomy } from '@/taxonomy';
import { property_h } from '@/utils';
import { reactive, watch } from 'vue';

const props = defineProps<{ item: taxonomy.Item; }>();
const dynamic_props = taxonomy.dynamic_properties(props.item.type);

const value = reactive<Record<string, any>>({});

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
      return property_h(row.property, value);
    }
  }
];

updated_values(props.item.values);
watch(() => props.item.values, (values) => updated_values(values));

function updated_values(values: taxonomy.Data[]) {
  for (const [name, prop] of dynamic_props)
    if (values.length && values[values.length - 1].data[name])
      value[name] = values[values.length - 1].data[name];
    else
      value[name] = prop.default_value;
}

function publish() {
  const data: Record<string, any> = {};
  for (const [name, _] of dynamic_props)
    data[name] = value[name];
  coco.KnowledgeBase.getInstance().publish(props.item, data);
}
</script>