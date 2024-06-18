<template>
  <v-app>
    <v-navigation-drawer v-model="drawer">
      <v-list-item value="chat" title="Chat" prepend-icon="mdi-message-text-outline" />
      <v-list-subheader v-if="knowledge.types.size > 0" inset>Types</v-list-subheader>
      <TypeListItem v-for="[id, type] in sorted_types(knowledge.types)" :key="id" :type="type" />
      <v-list-subheader v-if="knowledge.items.size > 0" inset>Items</v-list-subheader>
      <ItemListItem v-for="[id, item] in sorted_items(knowledge.items)" :key="id" :item="item" />
    </v-navigation-drawer>
    <v-app-bar>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>CoCo</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <v-window v-model="window_model" class="fill-height">
        <v-window-item value="chat" class="fill-height">
          <Chat :messages="messages" @send="send_message" />
        </v-window-item>
        <v-window-item v-for="[id, type] in knowledge.types" :key="id" :value="type.id" class="fill-height">
          <Type :item_type="type" />
        </v-window-item>
        <v-window-item v-for="[id, item] in knowledge.items" :key="id" :value="item.id" class="fill-height" eager
          @group:selected="lazy_load(item.id)">
          <Item :item="item" @update="useCoCoStore().load_data" @publish="useCoCoStore().publish_data" />
        </v-window-item>
      </v-window>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCoCoStore } from './store/coco';
import { storeToRefs } from 'pinia';
import { coco } from './type';

const drawer = ref(false)
const window_model = ref(['chat']);

const { knowledge, messages } = storeToRefs(useCoCoStore());

function send_message(message: string) {
  useCoCoStore().send_message(message);
}
</script>

<script lang="ts">
function sorted_types(types: Map<string, coco.Type>) {
  return Array.from(types.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name));
}
function sorted_items(items: Map<string, coco.Item>) {
  return Array.from(items.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name));
}
function lazy_load(item_id: string) {
  if (useCoCoStore().knowledge.items.get(item_id)!.values.length === 0)
    useCoCoStore().load_data(item_id);
}
</script>