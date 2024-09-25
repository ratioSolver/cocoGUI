<template>
  <n-modal v-model:show="local_modal">
    <n-card title="Log in" style="width: 400px;">
      <n-form :model="form_value" :rules="rules" ref="form_ref">
        <n-form-item label="Username" path="username">
          <n-input v-model:value="form_value.username" :input-props="{ autocomplete: 'username' }" />
        </n-form-item>
        <n-form-item label="Password" path="password">
          <n-input v-model:value="form_value.password" type="password"
            :input-props="{ autocomplete: 'current-password' }" />
        </n-form-item>
        <n-button type="primary" @click="validate">Log in</n-button>
      </n-form>
    </n-card>
  </n-modal>
</template>

<script setup lang="ts">
import type { FormInst, FormValidationError } from 'naive-ui'
import { NModal, NCard, NForm, NFormItem, NInput, NButton, useMessage } from 'naive-ui';
import { ref, watch } from 'vue';
import { coco } from '@/coco';

const props = defineProps<{ modal: boolean; }>();
const emit = defineEmits<{ (event: 'update:modal', value: boolean): void; }>();

const form_ref = ref<FormInst | null>(null);
const message = useMessage();
const form_value = ref({ username: '', password: '' });
const rules = {
  username: [{ required: true, message: 'Please enter your username (email)', trigger: 'blur' }],
  password: [{ required: true, message: 'Please enter your password', trigger: 'blur' }],
};

const local_modal = ref(props.modal);

watch(() => props.modal, (value) => local_modal.value = value);

function validate(e: MouseEvent) {
  e.preventDefault();
  form_ref.value?.validate((errors: Array<FormValidationError> | undefined) => {
    if (!errors)
      coco.KnowledgeBase.getInstance().login(form_value.value.username!, form_value.value.password!)
        .then((logged: boolean) => {
          if (logged)
            emit('update:modal', false);
        }).catch((err) => message.error(err));
  }).catch((err) => console.debug(err));
}
</script>