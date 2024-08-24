<template>
  <n-grid x-gap="12" y-gap="12" :cols="2">
    <n-grid-item>
      <coco-frame title="Taxonomy">
        <taxonomy-graph graph_id="taxonomy-graph" :state="useCoCoStore().kb" style="min-height: 400px;" />
      </coco-frame>
    </n-grid-item>
    <n-grid-item>
      <coco-frame title="Map">
        <coco-map map_id="map" @created="created" style="min-height: 400px;" />
      </coco-frame>
    </n-grid-item>
  </n-grid>
</template>

<script setup lang="ts">
import { NGrid, NGridItem } from 'naive-ui';
import { CocoFrame, TaxonomyGraph, CocoMap } from 'coco-gui';
import { useCoCoStore } from '@/stores/coco';
import L from "leaflet";

let map: L.Map | null = null;

function created(m: L.Map) {
  map = m;
  map.setView([41.902782, 12.496366], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
}
</script>