<template>
  <n-input v-model:value="value" :placeholder="props.par.name" :disabled="props.disabled" clearable />
</template>

<script setup lang="ts">
import { NInput } from 'naive-ui';
import { taxonomy } from '@/taxonomy';
import { ref, watch } from 'vue';

const props = withDefaults(defineProps<{ par: taxonomy.StringProperty; value: string | undefined; disabled: boolean; }>(), { disabled: false });
const emit = defineEmits<{ (event: 'update', value: string | undefined): void; }>();

const value = ref(props.value);

watch(() => props.value, (new_value) => value.value = new_value);
watch(value, (new_value) => emit('update', new_value));
</script>