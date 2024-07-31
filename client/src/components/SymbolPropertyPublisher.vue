<template>
    <v-select v-if="props.par.multiple" v-model="value" :items="props.par.symbols" :label="props.name" chips multiple
        required />
    <v-combobox v-else v-model="value" :items="props.par.symbols" :label="props.name" required />
</template>

<script setup lang="ts">
import { coco } from '@/type';
import { ref } from 'vue';

const props = defineProps<{ name: string; par: coco.SymbolProperty; value: string | string[]; }>();

const value = ref(props.value);
</script>