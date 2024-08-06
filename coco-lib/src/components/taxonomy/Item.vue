<template>
  <n-table v-if="static_properties.size" dense>
    <thead>
      <tr>
        <th class="text-left" width="80%">Property name</th>
        <th class="text-left" width="20%">Value</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="[name, prop] in static_properties" :key="name">
        <td>{{ name }}</td>
        <td>
          <BooleanProperty v-if="(prop instanceof taxonomy.BooleanProperty)" :par="prop" :value="item.properties[name]"
            disabled />
          <IntegerProperty v-else-if="(prop instanceof taxonomy.IntegerProperty)" :par="prop"
            :value="item.properties[name]" disabled />
          <RealProperty v-else-if="(prop instanceof taxonomy.RealProperty)" :par="prop" :value="item.properties[name]"
            disabled />
          <StringProperty v-else-if="(prop instanceof taxonomy.StringProperty)" :par="prop"
            :value="item.properties[name]" disabled />
          <SymbolProperty v-else-if="(prop instanceof taxonomy.SymbolProperty)" :par="prop"
            :value="item.properties[name]" disabled />
          <ItemProperty v-else-if="(prop instanceof taxonomy.ItemProperty)" :par="prop" :value="item.properties[name]"
            disabled />
        </td>
      </tr>
    </tbody>
  </n-table>
  <ItemChart v-if="dynamic_properties.size" :item="item" />
  <ItemPublisher v-if="dynamic_properties.size" :item="item" @publish="publish" />
</template>

<script setup lang="ts">
import { NTable } from 'naive-ui';
import { taxonomy } from '@/taxonomy';
import BooleanProperty from '../properties/BooleanProperty.vue';
import IntegerProperty from '../properties/IntegerProperty.vue';
import RealProperty from '../properties/RealProperty.vue';
import StringProperty from '../properties/StringProperty.vue';
import SymbolProperty from '../properties/SymbolProperty.vue';
import ItemProperty from '../properties/ItemProperty.vue';
import ItemChart from './ItemChart.vue';
import ItemPublisher from './ItemPublisher.vue';

const props = defineProps<{ item: taxonomy.Item; }>();
const static_properties = taxonomy.Type.static_properties(props.item.type);
const dynamic_properties = taxonomy.Type.dynamic_properties(props.item.type);

const emit = defineEmits<{
  (event: 'update', item_id: string, from_date: Date, to_date: Date): void;
  (event: 'publish', item_id: string, data: Record<string, any>): void;
}>();

function publish(item_id: string, data: Record<string, any>) {
  emit('publish', item_id, data);
}
</script>