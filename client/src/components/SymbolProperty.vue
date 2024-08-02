<template>
    <v-select v-if="props.par.multiple" v-model="value" :items="props.par.symbols" :label="props.name" chips multiple
        required :disabled="props.disabled" />
    <v-combobox v-else v-model="value" :items="props.par.symbols" :label="props.name" required
        :disabled="props.disabled" />
</template>

<script setup lang="ts">
import { coco } from '@/type';
import { ref, watch } from 'vue';

const props = withDefaults(defineProps<{ name: string; par: coco.SymbolProperty; value: string | string[]; disabled: boolean; }>(), { disabled: false });
const emit = defineEmits<{ (event: 'update', value: string | string[]): void; }>();

const value = ref(props.value);

watch(() => props.value, (new_value) => value.value = new_value);
watch(value, (new_value) => emit('update', new_value));
</script>