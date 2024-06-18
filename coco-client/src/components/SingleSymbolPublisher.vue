<template>
    <v-combobox v-model="value" :items="props.par.symbols" :label="props.name" required />
</template>

<script setup lang="ts">
import { SymbolParameter } from '@/type';
import { ref } from 'vue';

const props = defineProps<{ name: string; par: SymbolParameter; value: boolean; }>();

const value = ref(props.par.default_value);
</script>