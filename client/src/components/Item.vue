<template>
  <v-card :title="item.name + ' (' + item.type.name + ')'"
    :subtitle="item.description + ' (' + item.type.description + ')'">
    <v-container fluid>
      <v-table v-if="static_properties.size" dense>
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
              <BooleanProperty v-if="(prop instanceof coco.BooleanProperty)" :name="name" :par="prop"
                :value="item.properties[name]" disabled />
              <IntegerProperty v-else-if="(prop instanceof coco.IntegerProperty)" :name="name" :par="prop"
                :value="item.properties[name]" disabled />
              <RealProperty v-else-if="(prop instanceof coco.RealProperty)" :name="name" :par="prop"
                :value="item.properties[name]" disabled />
              <StringProperty v-else-if="(prop instanceof coco.StringProperty)" :name="name" :par="prop"
                :value="item.properties[name]" disabled />
              <SymbolProperty v-else-if="(prop instanceof coco.SymbolProperty)" :name="name" :par="prop"
                :value="item.properties[name]" disabled />
              <ItemProperty v-else-if="(prop instanceof coco.ItemProperty)" :name="name" :par="prop"
                :value="item.properties[name]" disabled />
            </td>
          </tr>
        </tbody>
      </v-table>
      <v-divider v-if="static_properties.size" />
      <v-row>
        <v-col cols="5">
          <v-menu v-model="from_menu" :close-on-content-click="false" :nudge-right="40" transition="scale-transition">
            <template v-slot:activator="{ props }">
              <v-btn
                :text="'From: ' + from_date.getDate() + '/' + (from_date.getMonth() + 1) + '/' + from_date.getFullYear()"
                prepend-icon="mdi-calendar" v-bind="props" />
            </template>
            <v-date-picker v-model="from_date" :max="to_date" />
          </v-menu>
        </v-col>
        <v-col cols="5">
          <v-menu v-model="to_menu" :close-on-content-click="false" :nudge-right="40" transition="scale-transition">
            <template v-slot:activator="{ props }">
              <v-btn :text="'To: ' + to_date.getDate() + '/' + (to_date.getMonth() + 1) + '/' + to_date.getFullYear()"
                prepend-icon="mdi-calendar" v-bind="props" />
            </template>
            <v-date-picker v-model="to_date" :max="new Date()" :min="from_date" />
          </v-menu>
        </v-col>
        <v-col cols="2">
          <v-btn @click="$emit('update', item.id, from_date, to_date)" color="primary">Update</v-btn>
        </v-col>
      </v-row>
    </v-container>
    <ItemChart v-if="dynamic_properties.size" :item="item" />
    <ItemPublisher v-if="dynamic_properties.size" :item="item" @publish="publish" />
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { coco } from '@/type';

const props = defineProps<{ item: coco.Item; }>();
const static_properties = coco.Type.static_properties(props.item.type);
const dynamic_properties = coco.Type.dynamic_properties(props.item.type);

const emit = defineEmits<{
  (event: 'update', item_id: string, from_date: Date, to_date: Date): void;
  (event: 'publish', item_id: string, data: Record<string, any>): void;
}>();

const from_menu = ref(false);
const from_date = ref(new Date(Date.now() - 1000 * 60 * 60 * 24 * 7));
const to_menu = ref(false);
const to_date = ref(new Date());

function publish(item_id: string, data: Record<string, any>) {
  emit('publish', item_id, data);
}
</script>