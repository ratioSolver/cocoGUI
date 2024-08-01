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
              :value="value[name]" @update="value[prop.name] = $event" />
            <IntPropertyPublisher v-else-if="(prop instanceof coco.IntegerProperty)" :name="name" :par="prop"
              :value="value[name]" @update="value[prop.name] = $event" />
            <RealPropertyPublisher v-else-if="(prop instanceof coco.RealProperty)" :name="name" :par="prop"
              :value="value[name]" @update="value[prop.name] = $event" />
            <StringPropertyPublisher v-else-if="(prop instanceof coco.StringProperty)" :name="name" :par="prop"
              :value="value[name]" @update="value[prop.name] = $event" />
            <SymbolPropertyPublisher v-else-if="(prop instanceof coco.SymbolProperty)" :name="name" :par="prop"
              :value="value[name]" @update="value[prop.name] = $event" />
            <ItemPropertyPublisher v-else-if="(prop instanceof coco.ItemProperty)" :name="name" :par="prop"
              :value="value[name]" @update="value[prop.name] = $event" />
          </td>
        </tr>
      </tbody>
    </v-table>
    <v-btn block @click="publish" color="primary">Publish</v-btn>
  </v-container>
</template>

<script setup lang="ts">
import { coco } from '@/type';
import { reactive, watch } from 'vue';

const props = defineProps<{ item: coco.Item; }>();

const emit = defineEmits<{ (event: 'publish', item_id: string, value: Record<string, any>): void; }>();

const value = reactive<Record<string, any>>({});

updated_values(props.item.values);
watch(() => props.item.values, (values) => updated_values(values));

function updated_values(values: coco.Data[]) {
  for (const [name, prop] of props.item.type.dynamic_properties)
    if (values.length && values[values.length - 1].data[name])
      value[name] = values[values.length - 1].data[name];
    else
      value[name] = prop.default_value;
}

function publish() {
  const data: Record<string, any> = {};
  for (const [name, prop] of props.item.type.dynamic_properties)
    if (prop instanceof coco.ItemProperty)
      if (prop.multiple)
        data[name] = value[name].map((item: coco.Item) => item.id);
      else
        data[name] = value[name].id;
    else
      data[name] = value[name];
  emit('publish', props.item.id, data);
}
</script>