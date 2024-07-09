<template>
  <v-container id="map" class="fill-height" fluid />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps<{ center: { lat: number; lng: number }; zoom: number; }>();

let map: L.Map;

onMounted(() => {
  map = L.map('map').setView([props.center.lat, props.center.lng], props.zoom);
});

onUnmounted(() => {
  map.remove();
});
</script>