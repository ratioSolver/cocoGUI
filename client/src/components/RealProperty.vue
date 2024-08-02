<template>
  <v-text-field v-model.number="value" type="number" :rules="[
    (v: number) => v !== null || 'Value is required',
    (v: number) => props.par.min <= v || 'Value must be greater than or equal to ' + props.par.min,
    (v: number) => props.par.max >= v || 'Value must be less than or equal to ' + props.par.max]" :label="props.name"
    required :disabled="props.disabled" />
</template>

<script setup lang="ts">
import { coco } from '@/type';
import { ref, watch } from 'vue';

const props = withDefaults(defineProps<{ name: string; par: coco.RealProperty; value: number; disabled: boolean; }>(), { disabled: false });
const emit = defineEmits<{ (event: 'update', value: number): void; }>();

const value = ref(props.value);

watch(() => props.value, (new_value) => value.value = new_value);
watch(value, (new_value) => emit('update', new_value));
</script>