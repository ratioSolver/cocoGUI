<template>
  <div :id="props.map_id" class="map-container"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = withDefaults(defineProps<{ map_id: string; }>(), { map_id: 'map' });

const emit = defineEmits<{ (event: 'created', value: L.Map): void; }>();

let map: L.Map;
let ro: ResizeObserver;

onMounted(() => {
  map = L.map(props.map_id);
  emit('created', map);
  ro = new ResizeObserver(() => map.invalidateSize());
  ro.observe(document.getElementById(props.map_id)!);
});

onUnmounted(() => {
  map.remove();
  ro.disconnect();
});
</script>

<style scoped>
.map-container {
  height: 100%;
  width: 100%;
}
</style>