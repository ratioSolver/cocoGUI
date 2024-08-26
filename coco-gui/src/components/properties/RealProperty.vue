<template>
  <n-input-number v-model.value="value" :placeholder="props.par.name" :disabled="props.disabled" :min="props.par.min"
    :max="props.par.max" />
</template>

<script setup lang="ts">
import { NInputNumber } from 'naive-ui';
import { taxonomy } from '@/taxonomy';
import { ref, watch } from 'vue';

const props = withDefaults(defineProps<{ par: taxonomy.IntegerProperty; value: number | undefined; disabled: boolean; }>(), { disabled: false });
const emit = defineEmits<{ (event: 'update', value: number | undefined): void; }>();

const value = ref<number | undefined>(props.value);

watch(() => props.value, (new_value: number | undefined) => value.value = new_value);
watch(value, (new_value: number | undefined) => emit('update', new_value));
</script>