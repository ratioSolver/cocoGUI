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
        <n-form-item v-if="coco.KnowledgeBase.getInstance().user?.properties.role < 2" label="Role" path="role">
          <n-select v-model:value="form_value.role" :options="roles" />
        </n-form-item>
        <n-form-item label="First name" path="first_name">
          <n-input v-model:value="form_value.first_name" :input-props="{ autocomplete: 'given-name' }" />
        </n-form-item>
        <n-form-item label="Last name" path="last_name">
          <n-input v-model:value="form_value.last_name" :input-props="{ autocomplete: 'family-name' }" />
        </n-form-item>
        <n-button type="primary" @click="validate">Create</n-button>
      </n-form>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import type { FormInst, FormValidationError, SelectOption } from 'naive-ui'
import { NModal, NCard, NForm, NFormItem, NInput, NSelect, NButton, useMessage } from 'naive-ui';
import { ref, watch } from 'vue';
import { coco } from '@/coco';

const props = defineProps<{ modal: boolean; }>();
const emit = defineEmits<{ (event: 'update:modal', value: boolean): void; }>();

const form_ref = ref<FormInst | null>(null);
const message = useMessage();
const form_value = ref({ username: '', password: '', first_name: '', last_name: '', role: 2 });
const roles: SelectOption[] = [];
const rules = {
  username: [{ required: true, message: 'Please enter your username (email)', trigger: 'blur' }],
  password: [{ required: true, message: 'Please enter your password', trigger: 'blur' }],
  first_name: [{ required: true, message: 'Please enter your first name', trigger: 'blur' }],
  last_name: [{ required: true, message: 'Please enter your last name', trigger: 'blur' }],
};

const local_modal = ref(props.modal);

watch(() => props.modal, (value) => local_modal.value = value);
watch(() => coco.KnowledgeBase.getInstance().user, () => {
  roles.splice(0, roles.length);
  if (coco.KnowledgeBase.getInstance().user?.properties.role < 1)
    roles.push({ label: 'Admin', value: 0 });
  if (coco.KnowledgeBase.getInstance().user?.properties.role < 2)
    roles.push({ label: 'Coordinator', value: 1 });
  roles.push({ label: 'User', value: 2 });
});

function validate(e: MouseEvent) {
  e.preventDefault();
  form_ref.value?.validate((errors: Array<FormValidationError> | undefined) => {
    if (!errors)
      coco.KnowledgeBase.getInstance().create_user(form_value.value.username, form_value.value.password, { first_name: form_value.value.first_name, last_name: form_value.value.last_name }, { role: form_value.value.role })
        .then((id: string | null) => {
          if (id)
            local_modal.value = false;
        }).catch((err) => message.error(err));
  }).catch((err) => console.debug(err));
}
</script>