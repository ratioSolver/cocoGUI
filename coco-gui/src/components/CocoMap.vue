<template>
  <n-grid y-gap="12" :cols="1" class="map-container" style="grid-template-rows: 1fr auto;">
    <n-grid-item>
      <div :id="props.map_id" class="map-container"></div>
    </n-grid-item>
    <n-grid-item v-if="show_slider" style="grid-row-end: -1;">
      <n-slider v-model:value="time" />
    </n-grid-item>
  </n-grid>
</template>

<script setup lang="ts">
import { NGrid, NGridItem, NSlider } from 'naive-ui';
import { onMounted, onUnmounted, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { taxonomy } from '@/taxonomy';
import { coco } from '@/coco';

const props = withDefaults(defineProps<{ map_id: string; layers: taxonomy.Type[] }>(), { map_id: 'map' });

const emit = defineEmits<{ (event: 'created', value: L.Map): void; }>();

let map: L.Map;
let ro: ResizeObserver;
const layers: Map<taxonomy.Type, L.Layer> = new Map();
const show_slider = ref(false);
const time = ref(0);

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

watch(() => props.layers, (new_layers, old_layers) => {
  for (const l of old_layers)
    if (!new_layers.includes(l)) {
      console.debug('Removing layer', l);
      layers.get(l)?.remove();
    }

  for (const l of new_layers)
    if (!old_layers.includes(l)) {
      console.debug('Adding layer', l);
      const options: L.GeoJSONOptions = {
        style: (feature) => {
          const style: L.PathOptions = {};
          if (l.static_properties.has('color') || l.dynamic_properties.has('color'))
            style.color = feature?.properties['color'];
          if (l.static_properties.has('fillColor') || l.dynamic_properties.has('fillColor'))
            style.fillColor = feature?.properties['fillColor'];
          if (l.static_properties.has('weight') || l.dynamic_properties.has('weight'))
            style.weight = feature?.properties['weight'];
          return style;
        },
        onEachFeature: (feature, layer) => {
          let content = '';
          for (const [key, value] of Object.entries(feature.properties))
            content += `<b>${key}</b>: ${value}<br>`;
          layer.bindPopup(content);
        },
        pointToLayer: (feature, latlng) => {
          const options: L.CircleMarkerOptions = { radius: 5 };
          if (l.static_properties.has('radius') || l.dynamic_properties.has('radius'))
            options.radius = feature?.properties['radius'];
          if (l.static_properties.has('color') || l.dynamic_properties.has('color'))
            options.color = feature?.properties['color'];
          if (l.static_properties.has('fillColor') || l.dynamic_properties.has('fillColor'))
            options.fillColor = feature?.properties['fillColor'];
          return L.circle(latlng, options);
        }
      };
      coco.KnowledgeBase.getInstance().get_items(l).then(items => {
        if (l.static_properties.has('geometry')) {
          const geo_json: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
          for (const item of items) {
            const feature: GeoJSON.Feature = {
              type: 'Feature',
              geometry: item.properties.geometry,
              properties: {}
            };
            for (const [key, value] of Object.entries(item.properties))
              if (key !== 'geometry' && key !== 'color' && key !== 'fillColor' && key !== 'fillOpacity' && key !== 'weight')
                feature.properties![key] = value;
            geo_json.features.push(feature);
          }
          layers.set(l, L.geoJSON(geo_json, options).addTo(map));
        } else if (l.dynamic_properties.has('geometry')) {
        }
      });
    }
});
</script>

<style scoped>
.map-container {
  height: 100%;
  width: 100%;
}
</style>