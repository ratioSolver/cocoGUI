<template>
  <n-modal v-model:show="local_modal" :on-update:show="(value) => emit('update:modal', value)">
    <n-card title="New user" style="width: 400px;">
      <n-form :model="form_value" :rules="rules" ref="form_ref">
        <n-form-item label="Username" path="username">
          <n-input v-model:value="form_value.username" :input-props="{ autocomplete: 'username' }" />
        </n-form-item>
        <n-form-item label="Password" path="password">
          <n-input v-model:value="form_value.password" type="password"
            :input-props="{ autocomplete: 'current-password' }" />
        </n-form-item>
        <n-form-item v-if="coco.KnowledgeBase.getInstance().user!.properties.role < 2" label="Role" path="role">
          <n-select v-model:value="form_value.role" :options="roles" />
        </n-form-item>
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
        <n-button type="primary" @click="validate">Create</n-button>
      </n-form>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui'
import type { FormInst, FormValidationError, SelectOption } from 'naive-ui'
import { NModal, NCard, NForm, NFormItem, NInput, NSelect, NGrid, NGridItem, NDataTable, NButton, useMessage } from 'naive-ui';
import { reactive, ref, watch } from 'vue';
import { coco } from '@/coco';
import { taxonomy } from '@/taxonomy';
import { property_h } from '@/utils';

const props = withDefaults(defineProps<{ modal: boolean; personal_properties: taxonomy.Property[] | undefined }>(), { personal_properties: undefined });
const emit = defineEmits<{ (event: 'update:modal', value: boolean): void; }>();

const static_properties = ref(new Map<string, taxonomy.Property>());
const personal_data = reactive<Record<string, any>>({});
const system_data = reactive<Record<string, any>>({});

static_properties.value = taxonomy.static_properties(coco.KnowledgeBase.getInstance().user!.type!);
static_properties.value.delete('role');

const roles: SelectOption[] = [];
roles.splice(0, roles.length);
if (coco.KnowledgeBase.getInstance().user!.properties.role < 1)
  roles.push({ label: 'Admin', value: 0 });
if (coco.KnowledgeBase.getInstance().user!.properties.role < 2)
  roles.push({ label: 'Coordinator', value: 1 });
roles.push({ label: 'User', value: 2 });

const form_ref = ref<FormInst | null>(null);
const message = useMessage();
const form_value = ref({ username: '', password: '', role: 2 });
const rules = {
  username: [{ required: true, message: 'Please enter your username (email)', trigger: 'blur' }],
  password: [{ required: true, message: 'Please enter your password', trigger: 'blur' }]
};

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

watch(() => props.modal, (value) => local_modal.value = value);

function validate(e: MouseEvent) {
  e.preventDefault();
  form_ref.value?.validate((errors: Array<FormValidationError> | undefined) => {
    if (!errors) {
      const p_data: Record<string, any> = {};
      if (props.personal_properties)
        for (const prop of props.personal_properties)
          p_data[prop.name] = personal_data[prop.name];
      const s_data: Record<string, any> = {};
      for (const [name, _] of static_properties.value)
        s_data[name] = system_data[name];
      s_data['role'] = form_value.value.role;
      coco.KnowledgeBase.getInstance().create_user(form_value.value.username, form_value.value.password, p_data, s_data)
        .then((id: string | null) => {
          if (id)
            local_modal.value = false;
        }).catch((err) => message.error(err));
    }
  }).catch((err) => console.debug(err));
}
</script>