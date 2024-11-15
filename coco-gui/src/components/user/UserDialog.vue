<template>
  <n-modal v-model:show="local_modal" :on-update:show="(value) => emit('update:modal', value)">
    <n-card title="User" style="width: 400px;">
      <n-input v-model:value="coco.KnowledgeBase.getInstance().user!.personal_data.username" disabled />
      <n-input v-model:value="role" disabled />
      <n-grid v-if="props.personal_properties" y-gap="12" :cols="1">
        <n-grid-item>
          <n-data-table :columns="personal_columns"
            :data="Array.from(props.personal_properties).map((prop) => ({ name: prop.name, property: prop }))" />
        </n-grid-item>
      </n-grid>
      <n-grid v-if="static_properties.size > 0" y-gap="12" :cols="1">
        <n-grid-item>
          <n-data-table :columns="system_columns"
            :data="Array.from(static_properties).map(([name, prop]) => ({ name, property: prop }))" />
        </n-grid-item>
      </n-grid>
      <n-button type="primary">Update</n-button>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'
import { NModal, NCard, NInput, NGrid, NGridItem, NDataTable, NButton } from 'naive-ui';
import { reactive, ref, watch } from 'vue';
import { coco } from '@/coco';
import { taxonomy } from '@/taxonomy';
import { property_h } from '@/utils';

const props = withDefaults(defineProps<{ modal: boolean; personal_properties: taxonomy.Property[] | undefined }>(), { personal_properties: undefined });
const emit = defineEmits<{ (event: 'update:modal', value: boolean): void; }>();

const static_properties = ref(new Map<string, taxonomy.Property>());
const role = ref('User');
const personal_data = reactive<Record<string, any>>({});
const system_data = reactive<Record<string, any>>({});

interface PropertyRow {
  name: string;
  property: taxonomy.Property;
}

const personal_columns: DataTableColumns<PropertyRow> = [
  {
    title: 'Personal data',
    key: 'name',
    width: '60%',
  },
  {
    title: 'Value',
    key: 'property',
    width: '40%',
    render(row) {
      return property_h(row.property, personal_data);
    }
  }
];

const system_columns: DataTableColumns<PropertyRow> = [
  {
    title: 'System data',
    key: 'name',
    width: '60%',
  },
  {
    title: 'Value',
    key: 'property',
    width: '40%',
    render(row) {
      return property_h(row.property, system_data);
    }
  }
];

const local_modal = ref(props.modal);

updated_user();
watch(() => props.modal, (value) => local_modal.value = value);
watch(() => coco.KnowledgeBase.getInstance().user, () => updated_user());

function updated_user() {
  static_properties.value = taxonomy.static_properties(coco.KnowledgeBase.getInstance().user!.type!);
  static_properties.value.delete('role');
  switch (coco.KnowledgeBase.getInstance().user!.properties.role) {
    case 0:
      role.value = 'Admin';
      break;
    case 1:
      role.value = 'Coordinator';
      break;
    case 2:
      role.value = 'User';
      break;
  }
  Object.keys(coco.KnowledgeBase.getInstance().user!.personal_data).forEach((key) => {
    if (key !== 'username')
      personal_data[key] = coco.KnowledgeBase.getInstance().user!.personal_data[key];
  });
  for (const [name, prop] of static_properties.value)
    system_data[name] = coco.KnowledgeBase.getInstance().user!.properties[name] ? coco.KnowledgeBase.getInstance().user!.properties[name] : prop.default_value;
}
</script>