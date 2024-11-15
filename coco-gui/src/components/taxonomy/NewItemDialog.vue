<template>
  <n-modal v-model:show="local_modal" :on-update:show="(value) => emit('update:modal', value)">
    <n-card title="New item" style="width: 400px;">
      <n-form :model="form_value" :rules="rules" ref="form_ref">
        <n-form-item label="Type" path="type">
          <n-select v-model:value="form_value.type"
            :options="Array.from(coco.KnowledgeBase.getInstance().types.values()).map((v) => ({ value: v.id, label: v.name }))" />
        </n-form-item>
        <n-grid v-if="static_properties.size > 0" y-gap="12" :cols="1">
          <n-grid-item>
            <n-data-table :columns="system_columns"
              :data="Array.from(static_properties).map(([name, prop]) => ({ name, property: prop }))" />
          </n-grid-item>
        </n-grid>
        <n-button type="primary" @click="validate">Create</n-button>
      </n-form>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'
import type { FormInst, FormValidationError } from 'naive-ui'
import { NModal, NCard, NForm, NFormItem, NSelect, NGrid, NGridItem, NDataTable, NButton, useMessage } from 'naive-ui';
import { reactive, ref, watch } from 'vue';
import { coco } from '@/coco';
import { taxonomy } from '@/taxonomy';
import { property_h } from '@/utils';

const props = defineProps<{ modal: boolean; }>();
const emit = defineEmits<{ (event: 'update:modal', value: boolean): void; }>();

const form_ref = ref<FormInst | null>(null);
const message = useMessage();
const static_properties = ref(new Map<string, taxonomy.Property>());
const form_value = ref({ type: undefined });
const rules = {
  type: [{ required: true, message: 'Please select the item type', trigger: 'blur' }]
};

const system_data = reactive<Record<string, any>>({});

interface PropertyRow {
  name: string;
  property: taxonomy.Property;
}

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

watch(() => props.modal, (value) => local_modal.value = value);
watch(() => form_value.value.type, (value) => {
  if (value)
    static_properties.value = taxonomy.static_properties(coco.KnowledgeBase.getInstance().types.get(value)!);
});

function validate(e: MouseEvent) {
  e.preventDefault();
  form_ref.value?.validate((errors: Array<FormValidationError> | undefined) => {
    if (!errors)
      coco.KnowledgeBase.getInstance().create_item(form_value.value.type!)
        .then((created: boolean) => {
          if (created)
            local_modal.value = false;
        }).catch((err) => message.error(err));
  }).catch((err) => console.debug(err));
}
</script>