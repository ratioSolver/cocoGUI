<template>
    <v-text-field v-model="value" type="text" :rules="[v => !!v || 'Value is required']" :label="props.name" required />
</template>

<script setup lang="ts">
import { coco } from '@/type';
import { ref, watch } from 'vue';

const props = defineProps<{ name: string; par: coco.StringProperty; value: string; }>();
const emit = defineEmits<{ (event: 'update', value: string): void; }>();

const value = ref(props.value);

watch(value, (new_value) => emit('update', new_value));
</script>