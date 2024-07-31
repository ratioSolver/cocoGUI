<template>
    <v-checkbox v-model="value" :label="props.name" required />
</template>

<script setup lang="ts">
import { coco } from '@/type';
import { ref } from 'vue';

const props = defineProps<{ name: string; par: coco.BooleanProperty; value: boolean; }>();

const value = ref(props.par.default_value);
</script>