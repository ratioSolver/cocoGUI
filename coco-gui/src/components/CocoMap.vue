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
import { h, onMounted, onUnmounted, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { taxonomy } from '@/taxonomy';
import { coco } from '@/coco';

const props = withDefaults(defineProps<{ map_id: string; layers: Set<taxonomy.Type> }>(), { map_id: 'map' });

const emit = defineEmits<{ (event: 'created', value: L.Map): void; }>();

let map: L.Map;
let ro: ResizeObserver;
const options: Map<taxonomy.Type, L.GeoJSONOptions> = new Map();
const static_layers: Map<taxonomy.Type, L.Layer> = new Map();
const dynamic_layers: Map<taxonomy.Type, L.Layer> = new Map();
const dynamic_features: Map<number, Map<taxonomy.Type, GeoJSON.FeatureCollection>> = new Map();
const dynamic_items: Map<taxonomy.Type, Map<taxonomy.Item, MapItemListener>> = new Map();
const show_slider = ref(false);
const min = ref(Number.MAX_SAFE_INTEGER);
const max = ref(Number.MIN_SAFE_INTEGER);
const time = ref(0);
const marks = ref<{ [key: number]: string }>({});

class MapItemListener extends taxonomy.ItemListener {

  processed = false;
  item: taxonomy.Item;

  constructor(item: taxonomy.Item) {
    super();
    this.item = item;
    item.add_listener(this);
  }

  values(values: taxonomy.Data[]): void {
    for (const val of values)
      this.add_value(val);
    this.process();
  }

  new_value(value: taxonomy.Data): void {
    this.add_value(value);
    this.process();
  }

  private add_value(value: taxonomy.Data): void {
    if (!dynamic_features.has(value.timestamp.getTime())) {
      dynamic_features.set(value.timestamp.getTime(), new Map());
      dynamic_features.get(value.timestamp.getTime())!.set(this.item.type, { type: 'FeatureCollection', features: [] });
      marks.value[value.timestamp.getTime()] = '';
      if (value.timestamp.getTime() < min.value)
        min.value = value.timestamp.getTime();
      if (value.timestamp.getTime() > max.value)
        max.value = value.timestamp.getTime();
    }

    const properties: Record<string, any> = { 'name': this.item.get_name() };
    for (const [prop_name, prop] of taxonomy.static_properties(this.item.type))
      if (!(prop instanceof taxonomy.JSONProperty) && prop_name !== 'name' && prop_name !== 'color' && prop_name !== 'fillColor' && prop_name !== 'fillOpacity' && prop_name !== 'weight')
        properties[prop_name] = this.item.properties[prop_name];
    for (const [prop_name, prop] of taxonomy.dynamic_properties(this.item.type))
      if (!(prop instanceof taxonomy.JSONProperty) && prop_name !== 'name' && prop_name !== 'color' && prop_name !== 'fillColor' && prop_name !== 'fillOpacity' && prop_name !== 'weight')
        properties[prop_name] = value.data[prop_name];
    for (const [prop_name, prop] of taxonomy.dynamic_properties(this.item.type))
      if (is_geometry(prop))
        dynamic_features.get(value.timestamp.getTime())!.get(this.item.type)!.features.push({ type: 'Feature', geometry: value.data[prop_name], properties: properties });
  }

  private process(): void {
    this.processed = true;
    let proc = true;
    for (const [_, itm_ls] of dynamic_items)
      for (const [_, listener] of itm_ls)
        if (!listener.processed) {
          proc = false;
          break;
        }

    if (proc) {
      show_slider.value = true;
      // Fill in missing layers with the previous one if not updated
      const sorted = Array.from(dynamic_features.keys()).sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++)
        for (const type of props.layers)
          if (!dynamic_features.get(sorted[i])!.has(type) && dynamic_features.get(sorted[i - 1])!.has(type))
            dynamic_features.get(sorted[i])!.set(type, dynamic_features.get(sorted[i - 1])!.get(type)!);
    }
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
      dynamic_layers.get(l)?.remove();
      dynamic_layers.delete(l);
    }

  for (const l of new_layers)
    if (!old_layers.has(l)) {
      console.debug('Adding layer', l);

      let static_geometry = false;
      for (const [_, prop] of taxonomy.static_properties(l))
        if (is_geometry(prop)) {
          static_geometry = true;
          break;
        }
      let dynamic_geometry = false;
      for (const [_, prop] of taxonomy.dynamic_properties(l))
        if (is_geometry(prop)) {
          dynamic_geometry = true;
          break;
        }

      if ((static_geometry || dynamic_geometry) && !options.has(l))
        options.set(l, create_options(l));

      if (static_geometry)
        coco.KnowledgeBase.getInstance().get_items(l).then(items => {
          console.debug('Static geometry', l, items);
          const geo_json: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
          for (const item of items) {
            const properties: Record<string, any> = { 'name': item.get_name() };
            for (const [prop_name, prop] of taxonomy.static_properties(item.type))
              if (!(prop instanceof taxonomy.JSONProperty) && prop_name !== 'color' && prop_name !== 'fillColor' && prop_name !== 'fillOpacity' && prop_name !== 'weight')
                properties[prop_name] = item.properties[prop_name];
            for (const [prop_name, prop] of taxonomy.static_properties(item.type))
              if (is_geometry(prop))
                geo_json.features.push({ type: 'Feature', geometry: item.properties[prop_name], properties: properties });
          }
          static_layers.set(l, L.geoJSON(geo_json, options.get(l)!).addTo(map));
        });

      if (dynamic_geometry) {
        dynamic_items.set(l, new Map());
        coco.KnowledgeBase.getInstance().get_items(l).then(items => {
          console.debug('Dynamic geometry', l, items);
          for (const item of items) {
            const listener = new MapItemListener(item);
            dynamic_items.get(l)!.set(item, listener);
            item.add_listener(listener);
            if (item.values.length === 0)
              coco.KnowledgeBase.getInstance().load_data(item);
          }
        });
      }
    }
});

watch(() => time.value, (new_time, old_time) => {
  if (old_time !== undefined && dynamic_features.has(old_time)) {
    for (const [_, layer] of dynamic_layers)
      layer.remove();
    dynamic_layers.clear();
  }

  if (dynamic_features.has(new_time))
    for (const [type, features] of dynamic_features.get(new_time)!)
      dynamic_layers.set(type, L.geoJSON(features, options.get(type)).addTo(map));
});
</script>

<script lang="ts">
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

function is_geometry(prop: taxonomy.Property): boolean {
  return prop instanceof taxonomy.JSONProperty && Object.hasOwn(prop.schema, '$ref') && prop.schema['$ref'] === '#/components/schemas/geometry';
}
</script>

<style scoped>
.map-container {
  height: 100%;
  width: 100%;
}
</style>