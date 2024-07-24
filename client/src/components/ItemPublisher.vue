<template>
  <v-container fluid>
    <v-table dense>
      <thead>
        <tr>
          <th class="text-left" width="80%">Property name</th>
          <th class="text-left" width="20%">Value</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="[name, par] in item.type.dynamic_properties" :key="name">
          <td>{{ name }}</td>
          <td>
            <IntPublisher v-if="(par instanceof coco.IntegerProperty)" :name="name" :par="par" :value="value[name]" />
            <RealPublisher v-else-if="(par instanceof coco.RealProperty)" :name="name" :par="par" :value="value[name]" />
            <StringPublisher v-else-if="(par instanceof coco.StringProperty)" :name="name" :par="par"
              :value="value[name]" />
            <SingleSymbolPublisher v-else-if="(par instanceof coco.SymbolProperty && !par.multiple)" :name="name" :par="par"
              :value="value[name]" />
            <MultipleSymbolPublisher v-else-if="(par instanceof coco.SymbolProperty && par.multiple)" :name="name"
              :par="par" :value="value[name]" />
            <BooleanPublisher v-else-if="(par instanceof coco.BooleanProperty)" :name="name" :par="par"
              :value="value[name]" />
          </td>
        </tr>
      </tbody>
    </v-table>
    <v-btn block @click="$emit('publish', item.id, value)">Publish</v-btn>
  </v-container>
</template>

<script setup lang="ts">
import { coco } from '@/type';
import { reactive } from 'vue';

const props = defineProps<{ item: coco.Item; }>();

defineEmits<{ (event: 'publish', item_id: string, value: Record<string, any>): void; }>();

const value = reactive<Record<string, any>>({});
props.item.type.dynamic_properties.forEach((property) => {
  if (props.item.values.length && props.item.values[props.item.values.length - 1][property.name])
    value[property.name] = props.item.values[props.item.values.length - 1][property.name];
  else
    value[property.name] = property.default_value;
});
</script>