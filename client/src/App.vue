<template>
  <v-app>
    <v-navigation-drawer v-model="drawer">
      <v-list dense v-model:selected="window_model">
        <v-list-item value="home" title="Home" prepend-icon="mdi-home" />
        <v-list-item value="chat" title="Chat" prepend-icon="mdi-message-text-outline" />
        <v-list-item v-if="knowledge.types.size > 0" value="taxonomy" title="Taxonomy" prepend-icon="mdi-chart-arc" />
        <v-list-subheader v-if="knowledge.solvers.size > 0" inset>Solvers</v-list-subheader>
        <SolverListItem v-for="[id, solver] in knowledge.solvers" :key="id" :solver="solver" />
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
        <v-window-item value="home" class="fill-height">
          <v-row class="fill-height">
            <v-col cols="12" md="6">
              <Frame title="Chat" icon="mdi-message-text-outline">
                <Map :center="{ lat: 51.505, lng: -0.09 }" zoom=13></Map>
              </Frame>
            </v-col>
          </v-row>
        </v-window-item>
        <v-window-item value="chat" class="fill-height">
          <Chat :messages="messages" @send="send_message" />
        </v-window-item>
        <v-window-item value="taxonomy" class="fill-height">
          <TaxonomyGraph :knowledge="knowledge" />
        </v-window-item>
        <v-window-item v-for="[id, type] in knowledge.types" :key="id" :value="type.id" class="fill-height">
          <Type :type="type" />
        </v-window-item>
        <v-window-item v-for="[id, solver] in knowledge.solvers" :key="id" :value="solver.id" class="fill-height" eager>
          <Solver :solver="solver" />
        </v-window-item>
        <v-window-item v-for="[id, item] in knowledge.items" :key="id" :value="item.id" class="fill-height" eager
          @group:selected="lazy_load(item.id)">
          <Item :item="item" @update="useCoCoStore().load_data" @publish="useCoCoStore().publish_data" />
        </v-window-item>
        <v-window-item v-for="[id, rule] in knowledge.reactive_rules" :key="id" :value="rule.id" class="fill-height">
          <ReactiveRule :rule="rule" />
        </v-window-item>
        <v-window-item v-for="[id, rule] in knowledge.deliberative_rules" :key="id" :value="rule.id"
          class="fill-height">
          <DeliberativeRule :rule="rule" />
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
import { Rule } from './knowledge';

const drawer = ref(false)
const window_model = ref(['home']);

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
function sorted_rules(rules: Map<string, Rule>) {
  return Array.from(rules.entries()).sort((a, b) => a[1].name.localeCompare(b[1].name));
}
function lazy_load(item_id: string) {
  if (useCoCoStore().knowledge.items.get(item_id)!.values.length === 0)
    useCoCoStore().load_data(item_id);
}
</script>