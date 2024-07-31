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
        <tr v-for="[name, prop] in item.type.dynamic_properties" :key="name">
          <td>{{ name }}</td>
          <td>
            <BooleanPropertyPublisher v-if="(prop instanceof coco.BooleanProperty)" :name="name" :par="prop"
              :value="value[name]" @update="update_value(prop, $event)" />
            <IntPropertyPublisher v-else-if="(prop instanceof coco.IntegerProperty)" :name="name" :par="prop"
              :value="value[name]" @update="update_value(prop, $event)" />
            <RealPropertyPublisher v-else-if="(prop instanceof coco.RealProperty)" :name="name" :par="prop"
              :value="value[name]" @update="update_value(prop, $event)" />
            <StringPropertyPublisher v-else-if="(prop instanceof coco.StringProperty)" :name="name" :par="prop"
              :value="value[name]" @update="update_value(prop, $event)" />
            <SymbolPropertyPublisher v-else-if="(prop instanceof coco.SymbolProperty)" :name="name" :par="prop"
              :value="value[name]" @update="update_value(prop, $event)" />
            <ItemPropertyPublisher v-else-if="(prop instanceof coco.ItemProperty)" :name="name" :par="prop"
              :value="value[name]" @update="update_value(prop, $event)" />
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

function update_value(prop: coco.Property, new_value: any) {
  if (prop instanceof coco.ItemProperty)
    if (prop.multiple)
      value[prop.name] = new_value.map((item: coco.Item) => item.id);
    else
      value[prop.name] = new_value.id;
  else
    value[prop.name] = new_value;
}
</script>