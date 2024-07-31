<template>
    <v-text-field v-model="value" type="text" :rules="[v => !!v || 'Value is required']" :label="props.name" required />
</template>

<script setup lang="ts">
import { coco } from '@/type';
import { ref } from 'vue';

const props = defineProps<{ name: string; par: coco.StringProperty; value: string; }>();

const value = ref(props.par.default_value);
</script>