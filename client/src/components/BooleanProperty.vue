<template>
  <v-checkbox v-model="value" :label="props.name" required :disabled="props.disabled" />
</template>

<script setup lang="ts">
import { coco } from '@/type';
import { ref, watch } from 'vue';

const props = withDefaults(defineProps<{ name: string; par: coco.BooleanProperty; value: boolean; disabled: boolean; }>(), { disabled: false });
const emit = defineEmits<{ (event: 'update', value: boolean): void; }>();

const value = ref(props.value);

watch(() => props.value, (new_value) => value.value = new_value);
watch(value, (new_value) => emit('update', new_value));
</script>