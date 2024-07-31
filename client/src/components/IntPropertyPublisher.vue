<template>
    <v-text-field v-model.number="value" type="number" :rules="[
        (v: number) => v !== null || 'Value is required',
        (v: number) => Number.isInteger(v) || 'Value must be an integer',
        (v: number) => props.par.min <= v || 'Value must be greater than or equal to ' + props.par.min,
        (v: number) => props.par.max >= v || 'Value must be less than or equal to ' + props.par.max]"
        :label="props.name" required />
</template>

<script setup lang="ts">
import { coco } from '@/type';
import { ref, watch } from 'vue';

const props = defineProps<{ name: string; par: coco.IntegerProperty; value: number; }>();
const emit = defineEmits<{ (event: 'update', value: number): void; }>();

const value = ref(props.value);

watch(value, (new_value) => emit('update', new_value));
</script>