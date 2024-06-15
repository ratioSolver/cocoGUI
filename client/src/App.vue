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
        <TypeListItem v-for="[id, type] in sorted_types(types)" :key="id" :type="type" />
        <v-list-subheader v-if="reactive_rules.size > 0" inset>Reactive Rules</v-list-subheader>
        <RuleListItem v-for="[id, rule] in sorted_rules(reactive_rules)" :key="id" :rule="rule" />
        <v-list-subheader v-if="deliberative_rules.size > 0" inset>Deliberative Rules</v-list-subheader>
        <RuleListItem v-for="[id, rule] in sorted_rules(deliberative_rules)" :key="id" :rule="rule" />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>CoCo</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <v-window v-model="window_model" class="fill-height">
        <v-window-item value="chat" class="fill-height">
          <Chat />
        </v-window-item>
        <v-window-item v-for="[id, solver] in solvers" :key="id" :value="solver.id" class="fill-height" eager>
          <Solver :solver="solver" />
        </v-window-item>
        <v-window-item v-for="[id, item] in sorted_items(items)" :key="id" :value="item.id" class="fill-height"
          @group:selected="itm.lazy_load">
          <Item ref="itm" :item="item" />
        </v-window-item>
        <v-window-item v-for="[id, type] in sorted_types(types)" :key="id" :value="type.id" class="fill-height">
          <Type :type="type" />
        </v-window-item>
        <v-window-item v-for="[id, rule] in sorted_rules(reactive_rules)" :key="id" :value="rule" class="fill-height">
          <ReactiveRule :rule="rule" />
        </v-window-item>
        <v-window-item v-for="[id, rule] in sorted_rules(deliberative_rules)" :key="id" :value="id" class="fill-height">
          <DeliberativeRule :rule="rule" />
        </v-window-item>
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

const { items, types, solvers, reactive_rules, deliberative_rules } = storeToRefs(useAppStore());
</script>

<script>
function sorted_types(types) {
  return new Map([...types].sort((s1, s2) => s1[1].name.localeCompare(s2[1].name)));
}
function sorted_items(items) {
  return new Map([...items].sort((s1, s2) => s1[1].name.localeCompare(s2[1].name)));
}
function sorted_rules(rules) {
  return new Map([...rules].sort((s1, s2) => s1[1].name.localeCompare(s2[1].name)));
}
</script>