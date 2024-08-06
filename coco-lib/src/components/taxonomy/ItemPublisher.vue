<template>
  <n-table size="small">
    <thead>
      <tr>
        <th class="text-left" width="80%">Property name</th>
        <th class="text-left" width="20%">Value</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="[name, prop] in dynamic_properties" :key="name">
        <td>{{ name }}</td>
        <td>
          <BooleanProperty v-if="(prop instanceof taxonomy.BooleanProperty)" :name="name" :par="prop"
            :value="value[name]" @update="value[prop.name] = $event" />
          <IntegerProperty v-else-if="(prop instanceof taxonomy.IntegerProperty)" :name="name" :par="prop"
            :value="value[name]" @update="value[prop.name] = $event" />
          <RealProperty v-else-if="(prop instanceof taxonomy.RealProperty)" :name="name" :par="prop"
            :value="value[name]" @update="value[prop.name] = $event" />
          <StringProperty v-else-if="(prop instanceof taxonomy.StringProperty)" :name="name" :par="prop"
            :value="value[name]" @update="value[prop.name] = $event" />
          <SymbolProperty v-else-if="(prop instanceof taxonomy.SymbolProperty)" :name="name" :par="prop"
            :value="value[name]" @update="value[prop.name] = $event" />
          <ItemProperty v-else-if="(prop instanceof taxonomy.ItemProperty)" :name="name" :par="prop"
            :value="value[name]" @update="value[prop.name] = $event" />
        </td>
      </tr>
    </tbody>
  </n-table>
</template>

<script setup lang="ts">
import { NTable } from 'naive-ui';
import BooleanProperty from '../properties/BooleanProperty.vue';
import IntegerProperty from '../properties/IntegerProperty.vue';
import RealProperty from '../properties/RealProperty.vue';
import StringProperty from '../properties/StringProperty.vue';
import SymbolProperty from '../properties/SymbolProperty.vue';
import ItemProperty from '../properties/ItemProperty.vue';
import { taxonomy } from '@/taxonomy';
import { reactive, watch } from 'vue';

const props = defineProps<{ item: taxonomy.Item; }>();
const dynamic_properties = taxonomy.Type.dynamic_properties(props.item.type);

const emit = defineEmits<{ (event: 'publish', item_id: string, value: Record<string, any>): void; }>();

const value = reactive<Record<string, any>>({});

updated_values(props.item.values);
watch(() => props.item.values, (values) => updated_values(values));

function updated_values(values: taxonomy.Data[]) {
  for (const [name, prop] of dynamic_properties)
    if (values.length && values[values.length - 1].data[name])
      value[name] = values[values.length - 1].data[name];
    else
      value[name] = prop.default_value;
}

function publish() {
  const data: Record<string, any> = {};
  for (const [name, prop] of dynamic_properties)
    if (prop instanceof taxonomy.ItemProperty)
      if (prop.multiple)
        data[name] = value[name].map((item: taxonomy.Item) => item.id);
      else
        data[name] = value[name].id;
    else
      data[name] = value[name];
  emit('publish', props.item.id, data);
}
</script>