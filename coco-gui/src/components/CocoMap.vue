<template>
  <n-grid y-gap="12" :cols="1" class="map-container" style="grid-template-rows: 1fr auto;">
    <n-grid-item>
      <div :id="props.map_id" class="map-container"></div>
    </n-grid-item>
    <n-grid-item v-if="show_slider" style="grid-row-end: -1;">
      <n-slider v-model:value="time" :marks="marks" step="mark" :min="min" :max="max" />
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

const props = withDefaults(defineProps<{ map_id: string; layers: Set<taxonomy.Type> }>(), { map_id: 'map' });

const emit = defineEmits<{ (event: 'created', value: L.Map): void; }>();

let map: L.Map;
let ro: ResizeObserver;
const static_layers: Map<taxonomy.Type, L.Layer> = new Map();
const dynamic_layers: Map<number, Map<taxonomy.Type, L.Layer>> = new Map();
const type_items: Map<taxonomy.Type, Map<taxonomy.Item, MapItemListener>> = new Map();
const show_slider = ref(false);
const min = ref(0);
const max = ref(100);
const time = ref(0);
const marks = ref<{ [key: number]: string }>({});

class MapItemListener extends taxonomy.ItemListener {

  processed = false;
  item: taxonomy.Item;
  layers: { timestamp: number, data: GeoJSON.Feature }[] = [];

  constructor(item: taxonomy.Item) {
    super();
    this.item = item;
    item.add_listener(this);
  }

  values(values: taxonomy.Data[]): void {
    console.debug('Received', values.length, 'values');
    for (const val of values)
      this.layers.push({ timestamp: val.timestamp.getTime(), data: create_feature(this.item, val.data) });
    this.processed = true;
    if (all_processed())
      compute_dynamic_layers();
  }

  new_value(value: taxonomy.Data): void {
    this.layers.push({ timestamp: value.timestamp.getTime(), data: create_feature(this.item, value.data) });
  }
}

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
  console.debug('Layers changed');

  for (const l of old_layers)
    if (!new_layers.has(l)) {
      console.debug('Removing layer', l);
      static_layers.get(l)?.remove();
      static_layers.delete(l);

      if (type_items.has(l))
        for (const [item, listener] of type_items.get(l)!)
          item.remove_listener(listener);
      type_items.delete(l);
      for (const [timestamp, layers] of dynamic_layers)
        if (layers.has(l)) {
          layers.get(l)?.remove();
          layers.delete(l);
          if (layers.size === 0) {
            dynamic_layers.delete(timestamp);
            delete marks.value[timestamp];
          }
        }
    }

  let ss = false;
  for (const l of new_layers) {
    if (taxonomy.dynamic_properties(l).has('geometry'))
      ss = true;

    if (!old_layers.has(l)) {
      console.debug('Adding layer', l);
      const options = create_options(l);
      coco.KnowledgeBase.getInstance().get_items(l).then(items => {
        if (taxonomy.static_properties(l).has('geometry')) {
          const geo_json: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
          for (const item of items)
            geo_json.features.push(create_feature(item, {}));
          static_layers.set(l, L.geoJSON(geo_json, options).addTo(map));
        } else if (taxonomy.dynamic_properties(l).has('geometry')) {
          console.debug('Adding data for', items.length, 'items');
          show_slider.value = true;
          if (!type_items.has(l))
            type_items.set(l, new Map());

          // Load data for all items and add listeners
          for (const item of items) {
            const listener = new MapItemListener(item);
            type_items.get(l)!.set(item, listener);
            item.add_listener(listener);
            if (item.values.length === 0) // Load data if not already loaded
              coco.KnowledgeBase.getInstance().load_data(item);
          }
        }
      });
    }
  }
  show_slider.value = ss;
});

watch(() => time.value, (new_time, old_time) => {
  for (const [timestamp, layers] of dynamic_layers)
    for (const [_, l] of layers)
      if (timestamp === new_time)
        l.addTo(map);
      else
        l.remove();
});

function all_processed(): boolean {
  for (const [_, itm_ls] of type_items)
    for (const [_, listener] of itm_ls)
      if (!listener.processed)
        return false;
  return true;
}

function compute_dynamic_layers(): void {
  console.debug('Computing dynamic layers');
  min.value = Number.MAX_SAFE_INTEGER;
  max.value = Number.MIN_SAFE_INTEGER;

  // For each type, the layers over time
  const layers = new Map<taxonomy.Type, Map<number, GeoJSON.FeatureCollection>>();
  for (const [type, itm_ls] of type_items) {
    const tp_layers = new Map<number, GeoJSON.FeatureCollection>();
    for (const [_, listener] of itm_ls)
      for (const layer of listener.layers) {
        if (!tp_layers.has(layer.timestamp))
          tp_layers.set(layer.timestamp, { type: 'FeatureCollection', features: [] });
        tp_layers.get(layer.timestamp)!.features.push(layer.data);
        if (!marks.value[layer.timestamp]) {
          marks.value[layer.timestamp] = '';
          if (layer.timestamp < min.value)
            min.value = layer.timestamp;
          if (layer.timestamp > max.value)
            max.value = layer.timestamp;
          dynamic_layers.set(layer.timestamp, new Map());
        }
      }
    layers.set(type, tp_layers);
  }

  // Create, for each timestamp, the layers for each type
  for (const [type, tp_layers] of layers)
    for (const [timestamp, data] of tp_layers) {
      const options = create_options(type);
      dynamic_layers.get(timestamp)!.set(type, L.geoJSON(data, options));
    }

  // Fill in missing layers with the previous one if not updated
  const sorted = Array.from(dynamic_layers.keys()).sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++)
    for (const type of props.layers)
      if (!dynamic_layers.get(sorted[i])!.has(type) && dynamic_layers.get(sorted[i - 1])!.has(type))
        dynamic_layers.get(sorted[i])!.set(type, dynamic_layers.get(sorted[i - 1])!.get(type)!);

  console.debug('Dynamic layers computed', dynamic_layers);
}

function create_options(type: taxonomy.Type): L.GeoJSONOptions {
  const options: L.GeoJSONOptions = {
    style: (feature) => {
      const style: L.PathOptions = {};
      if (taxonomy.static_properties(type).has('color') || taxonomy.dynamic_properties(type).has('color'))
        style.color = feature?.properties['color'];
      if (taxonomy.static_properties(type).has('fillColor') || taxonomy.dynamic_properties(type).has('fillColor'))
        style.fillColor = feature?.properties['fillColor'];
      if (taxonomy.static_properties(type).has('weight') || taxonomy.dynamic_properties(type).has('weight'))
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
      if (taxonomy.static_properties(type).has('radius') || taxonomy.dynamic_properties(type).has('radius'))
        options.radius = feature?.properties['radius'];
      if (taxonomy.static_properties(type).has('color') || taxonomy.dynamic_properties(type).has('color'))
        options.color = feature?.properties['color'];
      if (taxonomy.static_properties(type).has('fillColor') || taxonomy.dynamic_properties(type).has('fillColor'))
        options.fillColor = feature?.properties['fillColor'];
      return L.circle(latlng, options);
    }
  };
  return options;
}

function create_feature(item: taxonomy.Item, data: Record<string, any>): GeoJSON.Feature {
  const feature: GeoJSON.Feature = { type: 'Feature', geometry: data.geometry, properties: {} };
  for (const [key, value] of Object.entries(item.properties))
    if (key !== 'geometry' && key !== 'color' && key !== 'fillColor' && key !== 'fillOpacity' && key !== 'weight')
      feature.properties![key] = value;
  for (const [key, value] of Object.entries(data))
    if (key !== 'geometry' && key !== 'color' && key !== 'fillColor' && key !== 'fillOpacity' && key !== 'weight')
      feature.properties![key] = value;
  return feature;
}
</script>

<style scoped>
.map-container {
  height: 100%;
  width: 100%;
}
</style>