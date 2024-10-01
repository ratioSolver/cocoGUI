<template>
  <n-grid x-gap="12" y-gap="12" :cols="2">
    <n-grid-item>
      <coco-frame title="Taxonomy">
        <taxonomy-graph graph_id="taxonomy-graph" :state="coco.KnowledgeBase.getInstance()"
          style="min-height: 400px;" />
      </coco-frame>
    </n-grid-item>
    <n-grid-item>
      <coco-frame title="Map">
        <coco-map map_id="map" @created="created" :layers="layers" style="min-height: 400px;" />
      </coco-frame>
    </n-grid-item>
    <n-grid-item>
      <coco-frame title="Users">
        <item-table type_name="User" :label="new Map([['role', user_role]])" />
      </coco-frame>
    </n-grid-item>
  </n-grid>
</template>

<script setup lang="ts">
import { NGrid, NGridItem } from 'naive-ui';
import { CocoFrame, TaxonomyGraph, CocoMap, ItemTable, coco } from 'coco-gui';
import { useCoCoStore } from '../stores/coco';
import L from "leaflet";
import { computed } from 'vue';

let map: L.Map | null = null;
const layers = computed(() => new Set(useCoCoStore().layers.map(id => coco.KnowledgeBase.getInstance().types.get(id)!)));

function created(m: L.Map) {
  map = m;
  map.setView([41.902782, 12.496366], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
}

function user_role(role: number) {
  switch (role) {
    case 0: return 'Admin';
    case 1: return 'Coordinator';
    case 2: return 'User';
    default: return 'Unknown';
  }
}
</script>