<template>
  <n-select v-model:value="value" :placeholder="props.par.name" :multiple="props.par.multiple"
    :options="Array.from(props.par.type.instances).map((v) => ({ value: v.id, label: v.name })) clearable" />
</template>

<script setup lang="ts">
import { NSelect } from 'naive-ui';
import { taxonomy } from '@/taxonomy';
import { ref, watch } from 'vue';

const props = withDefaults(defineProps<{ par: taxonomy.ItemProperty; value: taxonomy.Item | taxonomy.Item[]; disabled: boolean; }>(), { disabled: false });
const emit = defineEmits<{ (event: 'update', value: taxonomy.Item | taxonomy.Item[]): void; }>();

const values = new Map<string, taxonomy.Item>(Array.from(props.par.type.instances).map((v) => [v.id, v]));
const value = ref(props.par.multiple ? (props.value as taxonomy.Item[]).map((v) => v.id) : (props.value as taxonomy.Item).id);

watch(() => props.value, (new_value) => value.value = props.par.multiple ? (new_value as taxonomy.Item[]).map((v) => v.id) : (new_value as taxonomy.Item).id);
watch(value, (new_value) => emit('update', props.par.multiple ? (new_value as string[]).map((v) => values.get(v)!) : values.get(new_value as string)!));
</script>