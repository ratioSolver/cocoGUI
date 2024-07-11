<template>
  <v-container id="map" class="fill-height" fluid />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, nextTick } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps<{ center: { lat: number; lng: number }; zoom: number; }>();

let map: L.Map;

onMounted(() => {
  map = L.map('map').setView([props.center.lat, props.center.lng], props.zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
});

onUnmounted(() => {
  map.remove();
});

const invalidateSize = () => {
  nextTick(() => map.invalidateSize());
}

defineExpose({ invalidateSize });
</script>