<template>
  <n-modal v-model:show="local_modal" :on-update:show="(value) => emit('update:modal', value)">
    <n-card title="New type" style="width: 400px;">
      <n-form :model="form_value" :rules="rules" ref="form_ref">
        <n-form-item label="Name" path="name">
          <n-input v-model:value="form_value.name" />
        </n-form-item>
        <n-form-item label="Description" path="description">
          <n-input v-model:value="form_value.description" />
        </n-form-item>
        <n-button type="primary" @click="validate">Create</n-button>
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
const form_value = ref({ name: '', description: undefined });
const rules = {
  name: [{ required: true, message: 'Please enter the type name', trigger: 'blur' }]
};

const local_modal = ref(props.modal);

watch(() => props.modal, (value) => local_modal.value = value);

function validate(e: MouseEvent) {
  e.preventDefault();
  form_ref.value?.validate((errors: Array<FormValidationError> | undefined) => {
    if (!errors)
      coco.KnowledgeBase.getInstance().create_type(form_value.value.name, form_value.value.description)
        .then((created: boolean) => {
          if (created)
            local_modal.value = false;
        }).catch((err) => message.error(err));
  }).catch((err) => console.debug(err));
}
</script>