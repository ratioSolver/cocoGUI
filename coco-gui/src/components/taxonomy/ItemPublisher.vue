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
import { NGrid, NGridItem, NDataTable, NTable, NButton } from 'naive-ui';
import BooleanProperty from '../properties/BooleanProperty.vue';
import IntegerProperty from '../properties/IntegerProperty.vue';
import RealProperty from '../properties/RealProperty.vue';
import StringProperty from '../properties/StringProperty.vue';
import SymbolProperty from '../properties/SymbolProperty.vue';
import ItemProperty from '../properties/ItemProperty.vue';
import { taxonomy } from '@/taxonomy';
import { h, reactive, watch } from 'vue';
import { useCoCoStore, dynamic_properties } from '@/stores/coco';

const props = defineProps<{ item: taxonomy.Item; }>();
const dynamic_props = dynamic_properties(props.item.type);

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
      if (row.property instanceof taxonomy.BooleanProperty) {
        return h(BooleanProperty, { par: row.property, value: value[row.name] });
      } else if (row.property instanceof taxonomy.IntegerProperty) {
        return h(IntegerProperty, { par: row.property, value: value[row.name] });
      } else if (row.property instanceof taxonomy.RealProperty) {
        return h(RealProperty, { par: row.property, value: value[row.name] });
      } else if (row.property instanceof taxonomy.StringProperty) {
        return h(StringProperty, { par: row.property, value: value[row.name] });
      } else if (row.property instanceof taxonomy.SymbolProperty) {
        return h(SymbolProperty, { par: row.property, value: value[row.name] });
      } else if (row.property instanceof taxonomy.ItemProperty) {
        return h(ItemProperty, { par: row.property, value: value[row.name] });
      } else {
        return '';
      }
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
  for (const [name, prop] of dynamic_props)
    if (prop instanceof taxonomy.ItemProperty)
      if (prop.multiple)
        data[name] = value[name].map((item: taxonomy.Item) => item.id);
      else
        data[name] = value[name].id;
    else
      data[name] = value[name];
  useCoCoStore().publish(props.item, data);
}
</script>