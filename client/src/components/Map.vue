<template>
  <v-container :id="props.map_id" class="fill-height" fluid />
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
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  ro = new ResizeObserver(() => map.invalidateSize());
  ro.observe(document.getElementById(props.map_id)!);
});

onUnmounted(() => {
  map.remove();
  ro.disconnect();
});
</script>