<template>
  <div :id="props.map_id" class="leaflet-container"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps<{ map_id: string; center: { lat: number; lng: number }; zoom: number; }>();

let map: L.Map;
let ro: ResizeObserver;

onMounted(() => {
  map = L.map(props.map_id).setView([props.center.lat, props.center.lng], props.zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
  ro = new ResizeObserver(() => map.invalidateSize());
  ro.observe(document.getElementById(props.map_id)!);
});

onUnmounted(() => {
  map.remove();
  ro.disconnect();
});
</script>

<style scoped>
.leaflet-container {
  height: calc(100% - 50px);
  width: 100%;
}
</style>