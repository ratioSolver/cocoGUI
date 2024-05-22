<template>
  <v-app>
    <v-navigation-drawer v-model="drawer">
      <v-list dense v-model:selected="window_model">
        <v-list-item value="chat" title="Chat" prepend-icon="mdi-message-text-outline" />
        <v-list-subheader v-if="solvers.size > 0" inset>Solvers</v-list-subheader>
        <SolverListItem v-for="[id, solver] in solvers" :key="id" :solver="solver" />
        <v-list-subheader v-if="items.size > 0" inset>Items</v-list-subheader>
        <ItemListItem v-for="[id, item] in sorted_items(items)" :key="id" :item="item" />
        <v-list-subheader v-if="types.size > 0" inset>Types</v-list-subheader>
        <TypeListItem v-for="[id, type] in types" :key="id" :type="type" />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>CoCo</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <v-window v-model="window_model" class="fill-height">
        <Chat />
        <Solver v-for="[id, solver] in solvers" :key="id" :solver="solver" />
        <Item v-for="[id, item] in sorted_items(items)" :key="id" :item="item" />
        <Type v-for="[id, type] in types" :key="id" :type="type" />
      </v-window>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useAppStore } from '@/store/app';
import { storeToRefs } from 'pinia';

const drawer = ref(false)
const window_model = ref(['chat']);

const { items, types, solvers } = storeToRefs(useAppStore());
</script>

<script>
function sorted_items(items) {
  return new Map([...items].sort((s1, s2) => s1[1].name.localeCompare(s2[1].name)));
}
</script>