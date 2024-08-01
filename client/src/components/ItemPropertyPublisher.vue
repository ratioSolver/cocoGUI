<template>
    <v-select v-if="props.par.multiple" v-model="value" :items="Array.from(props.par.type.instances)" item-title="name"
        :label="props.name" chips multiple required />
    <v-combobox v-else v-model="value" :items="Array.from(props.par.type.instances)" :label="props.name"
        item-title="name" required />
</template>

<script setup lang="ts">
import { coco } from '@/type';
import { ref, watch } from 'vue';

const props = defineProps<{ name: string; par: coco.ItemProperty; value: coco.Item | coco.Item[]; }>();
const emit = defineEmits<{ (event: 'update', value: coco.Item | coco.Item[]): void; }>();

const value = ref(props.value);

watch(() => props.value, (new_value) => value.value = new_value);
watch(value, (new_value) => emit('update', new_value));
</script>