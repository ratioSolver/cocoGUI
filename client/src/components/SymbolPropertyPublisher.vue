<template>
    <v-select v-if="props.par.multiple" v-model="value" :items="props.par.symbols" :label="props.name" chips multiple
        required />
    <v-combobox v-else v-model="value" :items="props.par.symbols" :label="props.name" required />
</template>

<script setup lang="ts">
import { coco } from '@/type';
import { ref, watch } from 'vue';

const props = defineProps<{ name: string; par: coco.SymbolProperty; value: string | string[]; }>();
const emit = defineEmits<{ (event: 'update', value: string | string[]): void; }>();

const value = ref(props.value);

watch(() => props.value, (new_value) => value.value = new_value);
watch(value, (new_value) => emit('update', new_value));
</script>