<template>
  <v-container fluid>
    <v-table dense>
      <thead>
        <tr>
          <th class="text-left" width="80%">Parameter name</th>
          <th class="text-left" width="20%">Value</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="[name, par] in item.type.dynamic_parameters" :key="name">
          <td>{{ name }}</td>
          <td>
            <IntPublisher v-if="(par instanceof coco.IntegerParameter)" :name="name" :par="par" :value="value[name]" />
            <RealPublisher v-else-if="(par instanceof coco.RealParameter)" :name="name" :par="par" :value="value[name]" />
            <StringPublisher v-else-if="(par instanceof coco.StringParameter)" :name="name" :par="par"
              :value="value[name]" />
            <SingleSymbolPublisher v-else-if="(par instanceof coco.SymbolParameter && !par.multiple)" :name="name" :par="par"
              :value="value[name]" />
            <MultipleSymbolPublisher v-else-if="(par instanceof coco.SymbolParameter && par.multiple)" :name="name"
              :par="par" :value="value[name]" />
            <BooleanPublisher v-else-if="(par instanceof coco.BooleanParameter)" :name="name" :par="par"
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
props.item.type.dynamic_parameters.forEach((parameter) => {
  if (props.item.values.length && props.item.values[props.item.values.length - 1][parameter.name])
    value[parameter.name] = props.item.values[props.item.values.length - 1][parameter.name];
  else
    value[parameter.name] = parameter.default_value;
});
</script>