<template>
  <n-select v-model:value="value" :placeholder="props.par.name" :multiple="props.par.multiple"
    :options="Array.from(props.par.symbols).map((v) => ({ value: v, label: v }))" :disabled="props.disabled"
    clearable />
</template>

<script setup lang="ts">
import { NSelect } from 'naive-ui';
import { taxonomy } from '@/taxonomy';
import { ref, watch } from 'vue';

const props = withDefaults(defineProps<{ par: taxonomy.SymbolProperty; value: string | string[]; disabled: boolean; }>(), { disabled: false });
const emit = defineEmits<{ (event: 'update', value: string | string[]): void; }>();
const value = ref(props.value);

watch(() => props.value, (new_value) => value.value = new_value);
watch(value, (new_value) => emit('update', new_value));
</script>