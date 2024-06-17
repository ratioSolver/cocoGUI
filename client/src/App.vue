<template>
  <v-app>
    <v-navigation-drawer v-model="drawer">
      <v-list dense v-model:selected="window_model">
        <v-list-item value="chat" title="Chat" prepend-icon="mdi-message-text-outline" />
        <v-list-subheader v-if="knowledge.solvers.size > 0" inset>Solvers</v-list-subheader>
        <SolverListItem v-for="[id, solver] in knowledge.solvers" :key="id" :solver="solver" />
        <v-list-item v-if="knowledge.types.size > 0" value="taxonomy" title="Taxonomy" prepend-icon="mdi-chart-arc" />
        <v-list-subheader v-if="knowledge.types.size > 0" inset>Types</v-list-subheader>
        <TypeListItem v-for="[id, type] in sorted_types(knowledge.types)" :key="id" :type="type" />
        <v-list-subheader v-if="knowledge.reactive_rules.size > 0" inset>Reactive Rules</v-list-subheader>
        <RuleListItem v-for="[id, rule] in sorted_rules(knowledge.reactive_rules)" :key="id" :rule="rule" />
        <v-list-subheader v-if="knowledge.deliberative_rules.size > 0" inset>Deliberative Rules</v-list-subheader>
        <RuleListItem v-for="[id, rule] in sorted_rules(knowledge.deliberative_rules)" :key="id" :rule="rule" />
        <v-list-subheader v-if="knowledge.items.size > 0" inset>Items</v-list-subheader>
        <ItemListItem v-for="[id, item] in sorted_items(knowledge.items)" :key="id" :item="item" />
      </v-list>
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
        <v-window-item v-for="[id, solver] in knowledge.solvers" :key="id" :value="solver.id" class="fill-height" eager>
          <Solver :solver="solver" />
        </v-window-item>
        <v-window-item v-for="[id, item] in knowledge.items" :key="id" :value="item.id"
          class="fill-height" eager @group:selected="lazy_load(item.id)">
          <Item :item="item" @update="useAppStore().load_data" @publish="useAppStore().publish_data" />
        </v-window-item>
        <v-window-item v-for="[id, type] in knowledge.types" :key="id" :value="type.id"
          class="fill-height">
          <Type :item_type="type" />
        </v-window-item>
        <v-window-item v-for="[id, rule] in knowledge.reactive_rules" :key="id" :value="rule.id"
          class="fill-height">
          <ReactiveRule :rule="rule" />
        </v-window-item>
        <v-window-item v-for="[id, rule] in knowledge.deliberative_rules" :key="id" :value="rule.id"
          class="fill-height">
          <DeliberativeRule :rule="rule" />
        </v-window-item>
        <v-window-item value="taxonomy" class="fill-height">
          <TaxonomyGraph :knowledge="knowledge" />
        </v-window-item>
      </v-window>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useCoCoStore } from './store/coco';
import { useAppStore } from './store/app';
import { storeToRefs } from 'pinia';

const drawer = ref(false)
const window_model = ref(['chat']);

const { knowledge } = storeToRefs(useCoCoStore());
const { messages } = storeToRefs(useAppStore());

function send_message(message) {
  useAppStore().send_message(message);
}
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
function lazy_load(item_id) {
  if (useCoCoStore().knowledge.items.get(item_id).values.length === 0)
    useAppStore().load_data(item_id);
}
</script>