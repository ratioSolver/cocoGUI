<template>
  <n-checkbox v-model:checked="value" :disabled="props.disabled"> {{ props.par.name }} </n-checkbox>
</template>

<script setup lang="ts">
import { NCheckbox } from 'naive-ui';
import { taxonomy } from '@/taxonomy';
import { ref, watch } from 'vue';

const props = withDefaults(defineProps<{ par: taxonomy.BooleanProperty; value: boolean; disabled: boolean; }>(), { disabled: false });
const emit = defineEmits<{ (event: 'update', value: boolean): void; }>();

const value = ref(props.value);

watch(() => props.value, (new_value) => value.value = new_value);
watch(value, (new_value) => emit('update', new_value));
</script>