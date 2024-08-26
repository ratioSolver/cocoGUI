<template>
  <n-select v-model:value="value" :placeholder="props.par.name" :multiple="props.par.multiple"
    :options="Array.from(props.par.type.instances).map((v) => ({ value: v.id, label: v.name }))"
    :disabled="props.disabled" clearable @update:value="(v: string | string[] | null) => emit('update', v)" />
</template>

<script setup lang="ts">
import { NSelect } from 'naive-ui';
import { taxonomy } from '@/taxonomy';
import { ref, watch } from 'vue';

const props = withDefaults(defineProps<{ par: taxonomy.ItemProperty; value: string | string[] | undefined; disabled: boolean; }>(), { disabled: false });
const emit = defineEmits<{ (event: 'update', value: string | string[] | null): void; }>();

const value = ref<string | string[] | undefined>(props.value);

watch(() => props.value, (new_value: string | string[] | undefined) => value.value = new_value);
</script>