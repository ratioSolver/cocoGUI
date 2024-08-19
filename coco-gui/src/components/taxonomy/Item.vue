<template>
  <n-grid v-if="item" x-gap="12" y-gap="12" :cols="2" style="padding: 12px;">
    <n-grid-item>
      <n-input v-model:value="item.name" label="Name" required />
    </n-grid-item>
    <n-grid-item>
      <n-input v-model:value="item.description" label="Description" required />
    </n-grid-item>
    <n-grid-item span="2"><h3>Properties</h3></n-grid-item>
    <n-grid-item v-if="static_props.size" span="2">
      <n-data-table :columns="columns"
        :data="Array.from(static_props).map(([name, prop]) => ({ name, property: prop }))" />
    </n-grid-item>
    <n-grid-item span="2">
      <item-chart :item="item" :key="item.id" />
    </n-grid-item>
    <n-grid-item span="2">
      <item-publisher :item="item" :key="item.id" />
    </n-grid-item>
  </n-grid>
</template>

<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'
import { NGrid, NGridItem, NInput, NDataTable } from 'naive-ui';
import { taxonomy } from '@/taxonomy';
import BooleanProperty from '../properties/BooleanProperty.vue';
import IntegerProperty from '../properties/IntegerProperty.vue';
import RealProperty from '../properties/RealProperty.vue';
import StringProperty from '../properties/StringProperty.vue';
import SymbolProperty from '../properties/SymbolProperty.vue';
import ItemProperty from '../properties/ItemProperty.vue';
import ItemChart from './ItemChart.vue';
import ItemPublisher from './ItemPublisher.vue';
import { useRoute, onBeforeRouteUpdate } from 'vue-router';
import { useCoCoStore, static_properties } from '@/stores/coco';
import { ref, h } from 'vue';

const route = useRoute();
const item = ref(useCoCoStore().state.items.get(route.params.id as string));
const static_props = ref<Map<string, taxonomy.Property>>(new Map());
onBeforeRouteUpdate((to, from) => {
  item.value = useCoCoStore().state.items.get(to.params.id as string);
  if (item.value) {
    static_props.value = static_properties(item.value.type);
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
    width: '60%',
  },
  {
    title: 'Value',
    key: 'property',
    width: '40%',
    render(row) {
      if (row.property instanceof taxonomy.BooleanProperty) {
        return h(BooleanProperty, { par: row.property, value: item.value?.properties[row.name], disabled: true });
      } else if (row.property instanceof taxonomy.IntegerProperty) {
        return h(IntegerProperty, { par: row.property, value: item.value?.properties[row.name], disabled: true });
      } else if (row.property instanceof taxonomy.RealProperty) {
        return h(RealProperty, { par: row.property, value: item.value?.properties[row.name], disabled: true });
      } else if (row.property instanceof taxonomy.StringProperty) {
        return h(StringProperty, { par: row.property, value: item.value?.properties[row.name], disabled: true });
      } else if (row.property instanceof taxonomy.SymbolProperty) {
        return h(SymbolProperty, { par: row.property, value: item.value?.properties[row.name], disabled: true });
      } else if (row.property instanceof taxonomy.ItemProperty) {
        return h(ItemProperty, { par: row.property, value: item.value?.properties[row.name], disabled: true });
      } else {
        return '';
      }
    }
  }
];
</script>