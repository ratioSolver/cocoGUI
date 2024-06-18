<template>
    <v-checkbox v-model="value" :label="props.name" required />
</template>

<script setup lang="ts">
import { BooleanParameter } from '@/type';
import { ref } from 'vue';

const props = defineProps<{ name: string; par: BooleanParameter; value: boolean; }>();

const value = ref(props.par.default_value);
</script>