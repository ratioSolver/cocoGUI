<template>
  <n-grid :cols="1">
    <n-grid-item>
      <n-data-table :columns="columns" :data="items" :pagination="{ pageSize: 10 }" />
    </n-grid-item>
  </n-grid>
</template>

<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'
import { NGrid, NGridItem, NDataTable } from 'naive-ui';
import { taxonomy } from '@/taxonomy';
import { property_v } from '@/utils';
import { coco } from '@/coco';
import { computed, reactive } from 'vue';

type PropertyRow = { [key: string]: any };

const props = defineProps<{ type_name: string; }>();

const columns = reactive<DataTableColumns<PropertyRow>>([]);
const static_props = reactive<Map<string, taxonomy.Property>>(new Map());
const dynamic_props = reactive<Map<string, taxonomy.Property>>(new Map());

const type = computed<taxonomy.Type | undefined>(() => {
  for (const t of coco.KnowledgeBase.getInstance().types.values())
    if (t.name === props.type_name) {
      columns.length = 0;
      static_props.clear();
      dynamic_props.clear();
      for (const [name, prop] of taxonomy.static_properties(t))
        if (!(prop instanceof taxonomy.JSONProperty))
          static_props.set(name, prop);
      for (const [name, prop] of taxonomy.dynamic_properties(t))
        if (!(prop instanceof taxonomy.JSONProperty))
          dynamic_props.set(name, prop);

      if (dynamic_props.has('online')) {
        columns.push({
          title: 'Online',
          key: 'online',
          width: `${100 / (static_props.size + dynamic_props.size + 1)}%`, // Distribute width evenly
          render(row) {
            return property_v(dynamic_props.get('online')!, row['online']);
          }
        });
        dynamic_props.delete('online');
      }
      columns.push({
        title: 'Name',
        key: 'item-name',
        width: `${100 / (static_props.size + dynamic_props.size + 1)}%`, // Distribute width evenly
      });
      for (const [name, prop] of static_props) {
        columns.push({
          title: name,
          key: name,
          width: `${100 / (static_props.size + dynamic_props.size + 1)}%`, // Distribute width evenly
          render(row) {
            return property_v(prop, row[name]);
          }
        });
      }
      for (const [name, prop] of dynamic_props) {
        columns.push({
          title: name,
          key: name,
          width: `${100 / (static_props.size + dynamic_props.size + 1)}%`, // Distribute width evenly
          render(row) {
            return property_v(prop, row[name]);
          },
          className: 'dynamic'
        });
      }
      return t;
    }
  return undefined;
});

const items = computed(() => {
  const items: PropertyRow[] = [];
  if (type.value)
    for (const item of coco.KnowledgeBase.getInstance().items.values())
      if (item.type.is_instance_of(type.value)) {
        const row: PropertyRow = { 'item-name': item.name };
        for (const prop of static_props.keys())
          row[prop] = item.properties[prop];
        for (const prop of dynamic_props.keys())
          row[prop] = item.value.data[prop];
        items.push(row);
      }
  return items;
});
</script>

<style scoped>
:deep(.dynamic) {
  color: #6c6c6c !important;
}
</style>