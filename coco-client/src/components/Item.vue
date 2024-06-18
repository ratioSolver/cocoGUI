<template>
  <v-card :title="item.name + ' (' + item.type.name + ')'"
    :subtitle="item.description + ' (' + item.type.description + ')'">
    <v-container>
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
    <ItemChart :item="item" />
    <ItemPublisher :item="item" @publish="publish" />
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Item } from '@/type';

defineProps<{ item: Item; }>();

const emit = defineEmits<{
  (event: 'update', item_id: string, from_date: Date, to_date: Date): void;
  (event: 'publish', item_id: string, data: JSON): void;
}>();

const from_menu = ref(false);
const from_date = ref(new Date(Date.now() - 1000 * 60 * 60 * 24 * 7));
const to_menu = ref(false);
const to_date = ref(new Date());

function publish(item_id: string, data: JSON) {
  emit('publish', item_id, data);
}
</script>