<template>
  <n-flex vertical>
    <n-flex v-if="static_props.size" vertical>
      Static properties
      <n-data-table :columns="columns"
        :data="Array.from(static_props).map(([name, prop]) => ({ name, property: prop }))" />
    </n-flex>
    <ItemChart v-if="item" :item="item" />
    <ItemPublisher v-if="item" :item="item" />
  </n-flex>
</template>

<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'
import { NFlex, NDataTable } from 'naive-ui';
import { taxonomy } from '@/taxonomy';
import BooleanProperty from '../properties/BooleanProperty.vue';
import IntegerProperty from '../properties/IntegerProperty.vue';
import RealProperty from '../properties/RealProperty.vue';
import StringProperty from '../properties/StringProperty.vue';
import SymbolProperty from '../properties/SymbolProperty.vue';
import ItemProperty from '../properties/ItemProperty.vue';
import ItemChart from './ItemChart.vue';
import ItemPublisher from './ItemPublisher.vue';
import { onBeforeRouteUpdate } from 'vue-router';
import { useCoCoStore, static_properties } from '@/stores/coco';
import { ref, h } from 'vue';

const item = ref<taxonomy.Item | undefined>(undefined);
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
    width: '80%',
  },
  {
    title: 'Value',
    key: 'property',
    width: '20%',
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