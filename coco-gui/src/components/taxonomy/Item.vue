<template>
  <n-grid v-if="item" y-gap="12" :cols="1" style="padding: 12px;">
    <n-grid-item>
      <n-input v-model:value="item.id" label="ID" disabled>
        <template #suffix>
          <n-button @click="copy_id" :bordered="false">
            <n-icon :component="Copy20Regular" />
          </n-button>
        </template>
      </n-input>
    </n-grid-item>
    <n-grid-item v-if="static_props.size">
      <h3>Properties</h3>
    </n-grid-item>
    <n-grid-item v-if="static_props.size">
      <n-data-table :columns="columns"
        :data="Array.from(static_props).map(([name, prop]) => ({ name, property: prop }))" />
    </n-grid-item>
    <n-grid-item>
      <item-chart :item="item" :key="item.id" />
    </n-grid-item>
    <n-grid-item>
      <item-publisher :item="item" :key="item.id" />
    </n-grid-item>
  </n-grid>
</template>

<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'
import { NGrid, NGridItem, NInput, NDataTable, NButton, NIcon } from 'naive-ui';
import { Copy20Regular } from '@vicons/fluent';
import { taxonomy } from '@/taxonomy';
import ItemChart from './ItemChart.vue';
import ItemPublisher from './ItemPublisher.vue';
import { property_h } from '@/utils';

const props = defineProps<{ item: taxonomy.Item; }>();
const static_props = taxonomy.static_properties(props.item.type);

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
      return property_h(row.property, props.item.properties, true);
    }
  }
];

function copy_id() {
  window.navigator.clipboard.writeText(props.item.id);
}
</script>