<template>
  <n-checkbox v-model:checked="value" :disabled="props.disabled"> {{ props.par.name }} </n-checkbox>
</template>

<script setup lang="ts">
import { NCheckbox } from 'naive-ui';
import { taxonomy } from '@/taxonomy';
import { ref, watch } from 'vue';

const props = withDefaults(defineProps<{ par: taxonomy.BooleanProperty; value: boolean | undefined; disabled: boolean; }>(), { disabled: false });
const emit = defineEmits<{ (event: 'update', value: boolean | undefined): void; }>();

const value = ref<boolean | undefined>(props.value);

watch(() => props.value, (new_value: boolean | undefined) => value.value = new_value);
watch(value, (new_value: boolean | undefined) => emit('update', new_value));
</script>