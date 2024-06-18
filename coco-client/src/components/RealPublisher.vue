<template>
    <v-text-field v-model.number="value" type="number" :rules="[
        (v: number) => v !== null || 'Value is required',
        (v: number) => props.par.min <= v || 'Value must be greater than or equal to ' + props.par.min,
        (v: number) => props.par.max >= v || 'Value must be less than or equal to ' + props.par.max]"
        :label="props.name" required />
</template>

<script setup lang="ts">
import { coco } from '@/type';
import { ref } from 'vue';

const props = defineProps<{ name: string; par: coco.RealParameter; value: number; }>();

const value = ref(props.par.default_value);
</script>