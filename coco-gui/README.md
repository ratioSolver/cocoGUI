# CoCo-GUI

This package provides core functionality for building Combined deductiOn and abduCtiOn (CoCo) graphical user interfaces (GUIs).

## Installation

CocoGUI is available as an [npm package](https://www.npmjs.com/package/coco-gui).
To install and save in your `package.json` dependencies, run:

```bash
npm install coco-gui
```

## Usage

To get started, if you don't have one yet, create a new Vue project.

```bash
npm create vue@latest
```

Install the required packages.

```bash
npm install -D naive-ui
npm install -D @vicons/fluent
```

Then, install the `coco-gui` package.

```bash
npm install coco-gui
```

Now, you can import the components you need in your Vue project.

## Get Access to the CoCo Knowledge Base

The `KnowledgeBase` class is a singleton class that provides access to the CoCo knowledge base.

```javascript
import { coco } from 'coco-gui';

const kb = coco.KnowledgeBase.getInstance();
```

Notice that the returned `KnowledgeBase` object is reactive. This means that you can use it in Vue components to visualize the types, the items, the rules and the solvers.

### Visualize the types, the items and the solvers

In order to visualize the types, the items and the solvers, you can use Vue-Router to navigate between the different components.

Create a new Vue component for each type, item and solver.

Create a `TypeView.vue` file.

```javascript
<template>
  <type v-if="tp" :type="tp" :key="tp.id" />
</template>

<script setup lang="ts">
import { Type, coco } from 'coco-gui';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';

const route = useRoute();
let tp = coco.KnowledgeBase.getInstance().types.get(route.params.id as string);
onBeforeRouteUpdate((to, from) => { tp = coco.KnowledgeBase.getInstance().types.get(to.params.id as string); });
</script>
```

Create an `ItemView.vue` file.

```javascript
<template>
  <item v-if="itm" :item="itm" :key="itm.id" />
</template>

<script setup lang="ts">
import { Item, coco } from 'coco-gui';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';

const route = useRoute();
let itm = coco.KnowledgeBase.getInstance().items.get(route.params.id as string);
onBeforeRouteUpdate((to, from) => { itm = coco.KnowledgeBase.getInstance().items.get(to.params.id as string); });
</script>
```

Create a `SolverView.vue` file.

```javascript
<template>
  <solver v-if="slv" :solver="slv" :key="slv.id" />
</template>

<script setup lang="ts">
import { Solver, coco } from 'coco-gui';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';

const route = useRoute();
let slv = coco.KnowledgeBase.getInstance().solvers.get(parseInt(route.params.id as string));
onBeforeRouteUpdate((to, from) => { slv = coco.KnowledgeBase.getInstance().solvers.get(parseInt(to.params.id as string)); });
</script>
```

Now, you can use Vue-Router to navigate between the different components.

```javascript
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import TypeView from '../views/TypeView.vue'
import ItemView from '../views/ItemView.vue'
import SolverView from '../views/SolverView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/type/:id',
      name: 'type',
      component: TypeView
    },
    {
      path: '/item/:id',
      name: 'item',
      component: ItemView
    },
    {
      path: '/solver/:id',
      name: 'solver',
      component: SolverView
    }
  ]
})

export default router
```

### Create a CoCo GUI

You can now create a CoCo GUI by using the components you need in your Vue project.

```javascript
<template>
  <coco-app>
    <template #header>
      <router-link to="/">
        <h1>CoCo</h1>
      </router-link>
    </template>
    <template #drawer>
      <n-menu v-model:value="active_key" :options="menu" accordion />
    </template>
    <router-view />
  </coco-app>
</template>

<script setup lang="ts">
import 'coco-gui/dist/style.css';
import { Box20Regular, Circle20Regular, BrainCircuit20Regular, PauseCircle20Regular, PlayCircle20Regular, CheckmarkCircle20Regular, ErrorCircle20Regular } from '@vicons/fluent';
import { NMenu, type MenuOption } from 'naive-ui';
import { coco-app, taxonomy, rule, solver, coco } from 'coco-gui';
import { computed, h, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useCoCoStore } from './stores/coco';

const store = useCoCoStore();
coco.KnowledgeBase.getInstance().connect();

const active_key = ref<string | null>(null);
const menu = computed<MenuOption[]>(() => [
  { key: 'home', label: () => h(RouterLink, { to: '/' }, { default: () => 'Home' }) },
  { key: 'types', label: 'Types', children: types_menu_options(coco.KnowledgeBase.getInstance().types) },
  { key: 'items', label: 'Items', children: items_menu_options(coco.KnowledgeBase.getInstance().items) },
  { key: 'reactive_rules', label: 'Reactive Rules', children: reactive_rules_menu_options(coco.KnowledgeBase.getInstance().reactive_rules) },
  { key: 'deliberative_rules', label: 'Deliberative Rules', children: deliberative_rules_menu_options(coco.KnowledgeBase.getInstance().deliberative_rules) },
  { key: 'solvers', label: 'Solvers', children: solvers_menu_options(coco.KnowledgeBase.getInstance().solvers) }
]);

function types_menu_options(types: Map<string, taxonomy.Type>): MenuOption[] {
  return Array.from(types.values()).map(type => {
    return {
      label: () => h(RouterLink, { to: { name: 'type', params: { id: type.id } } }, { default: () => type.name }),
      key: type.id,
      icon: () => h(Box20Regular),
    }
  });
}

function items_menu_options(items: Map<string, taxonomy.Item>): MenuOption[] {
  return Array.from(items.values()).map(item => {
    return {
      label: () => h(RouterLink, { to: { name: 'item', params: { id: item.id } } }, { default: () => item.name }),
      key: item.id,
      icon: () => h(Circle20Regular),
    }
  });
}

function reactive_rules_menu_options(rules: Map<string, rule.ReactiveRule>): MenuOption[] {
  return Array.from(rules.values()).map(rule => {
    return {
      label: () => h(RouterLink, { to: { name: 'rule', params: { id: rule.id } } }, { default: () => rule.name }),
      key: rule.id,
      icon: () => h(Box20Regular),
    }
  });
}

function deliberative_rules_menu_options(rules: Map<string, rule.DeliberativeRule>): MenuOption[] {
  return Array.from(rules.values()).map(rule => {
    return {
      label: () => h(RouterLink, { to: { name: 'rule', params: { id: rule.id } } }, { default: () => rule.name }),
      key: rule.id,
      icon: () => h(Box20Regular),
    }
  });
}

function solvers_menu_options(solvers: Map<number, solver.Solver>): MenuOption[] {
  return Array.from(solvers.values()).map(slv => {
    const icn = computed(() => {
      switch (slv.state) {
        case solver.State.reasoning:
        case solver.State.adapting: return BrainCircuit20Regular;
        case solver.State.idle: return PauseCircle20Regular;
        case solver.State.executing: return PlayCircle20Regular;
        case solver.State.finished: return CheckmarkCircle20Regular;
        case solver.State.failed: return ErrorCircle20Regular;
      }
    });
    return {
      label: () => h(RouterLink, { to: { name: 'solver', params: { id: slv.id } } }, { default: () => slv.name }),
      key: slv.id,
      icon: () => h(icn.value)
    }
  });
}
</script>
```

## Widgets

Widgets can be used to display information in a graphical user interface. The `CocoFrame` component can be used to display a frame with a title. The `CocoFrame` component requires a `title` prop to specify the title of the frame.

```javascript
<template>
  <coco-frame title="Frame">
    <p>Content</p>
  </coco-frame>
</template>

<script setup lang="ts">
import { CocoFrame } from 'coco-gui';
</script>
```

### Visualize the Taxonomy Graph

The `TaxonomyGraph` component can be used to visualize the taxonomy graph. The `TaxonomyGraph` component requires a `graph_id` prop to specify the id of the graph. The `TaxonomyGraph` component uses the [Cytoscape](https://js.cytoscape.org/) library to render the graph.

```javascript
<template>
  <n-grid x-gap="12" y-gap="12" :cols="2">
    <n-grid-item>
      <coco-frame title="Taxonomy">
        <taxonomy-graph graph_id="taxonomy-graph" style="min-height: 400px;"></taxonomy-graph>
      </coco-frame>
    </n-grid-item>
  </n-grid>
</template>

<script setup lang="ts">
import { NGrid, NGridItem } from 'naive-ui';
import { FrameComponent, TaxonomyGraph } from 'coco-gui';
</script>
```

### Visualize Maps

Maps can be used to display geo-referenced information. The `CocoMap` component can be used to display a map. The `CocoMap` component requires a `map_id` prop to specify the id of the map. Once the map is created, the `created` event is emitted. The returned map object, based on the [Leaflet](https://leafletjs.com/) library, can be used to add layers to the map.

Install the required packages.

```bash
npm install -D leaflet
npm install -D @types/leaflet
```

```javascript
<template>
  <coco-frame title="Map">
    <coco-map map_id="map" @created="created" style="min-height: 400px;" />
  </coco-frame>
</template>

<script setup lang="ts">
import { CocoMap } from 'coco-gui';
import 'leaflet/dist/leaflet.css';
import L from "leaflet";

let map: L.Map | null = null;

function created(m: L.Map) {
  map = m;
  map.setView([41.902782, 12.496366], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
}
</script>
```