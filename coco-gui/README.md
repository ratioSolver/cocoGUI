# CoCo-GUI

This package provides core functionality for building Combined deductiOn and abduCtiOn (CoCo) graphical user interfaces (GUIs).

## Installation

CocoGUI is available as an [npm package](https://www.npmjs.com/package/coco-gui).
To install and save in your `package.json` dependencies, run:

```bash
npm install coco-gui
```

## Usage

To get started, create a new Vue project, if you don't have one yet.

```bash
npm create vue@latest
```

Install the required packages.

```bash
npm install naive-ui
npm install @vicons/fluent
```

Then, install the `coco-gui` package.

```bash
npm install coco-gui
```

Now, you can import the components you need in your Vue project.

### Create a Pinia store

To use the `KnowledgeBase` class in a Vue project, you can create a Pinia store and import the `KnowledgeBase` class from the `coco-gui` package.

```javascript
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { coco } from 'coco-gui'

export const useCoCoStore = defineStore('CoCo', () => {
  const kb = ref(coco.KnowledgeBase.getInstance())

  return { kb }
})
```

### Use the `KnowledgeBase` class

You can now use the store in your Vue components. For example, you can use the `KnowledgeBase` to visualize a taxonomy graph in a frame component.

```javascript
<template>
  <n-grid x-gap="12" y-gap="12" :cols="2">
    <n-grid-item>
      <frame-component title="Taxonomy">
        <taxonomy-graph graph_id="taxonomy-graph" :state="useCoCoStore().kb" style="min-height: 400px;"></taxonomy-graph>
      </frame-component>
    </n-grid-item>
  </n-grid>
</template>

<script setup lang="ts">
import { NGrid, NGridItem } from 'naive-ui';
import { FrameComponent, TaxonomyGraph } from 'coco-gui';
import { useCoCoStore } from '@/stores/coco';
</script>
</script>
```

### Visualize the types, the items and the solvers

In order to visualize the types, the items and the solvers, you can use Vue-Router to navigate between the different components.

Create a new Vue component for each type, item and solver.

Create a `TypeView.vue` file.

```javascript
<template>
  <type v-if="tp" :type="tp" :key="tp.id" />
</template>

<script setup lang="ts">
import { Type } from 'coco-gui';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import { useCoCoStore } from '@/stores/coco';

const route = useRoute();
let tp = useCoCoStore().kb.types.get(route.params.id as string);
onBeforeRouteUpdate((to, from) => { tp = useCoCoStore().kb.types.get(to.params.id as string); });
</script>
```

Create an `ItemView.vue` file.

```javascript
<template>
  <item v-if="itm" :item="itm" :key="itm.id" />
</template>

<script setup lang="ts">
import { Item } from 'coco-gui';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import { useCoCoStore } from '@/stores/coco';

const route = useRoute();
let itm = useCoCoStore().kb.items.get(route.params.id as string);
onBeforeRouteUpdate((to, from) => { itm = useCoCoStore().kb.items.get(to.params.id as string); });
</script>
```

Create a `SolverView.vue` file.

```javascript
<template>
  <solver v-if="slv" :solver="slv" :key="slv.id" />
</template>

<script setup lang="ts">
import { Solver } from 'coco-gui';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';
import { useCoCoStore } from '@/stores/coco';

const route = useRoute();
let slv = useCoCoStore().kb.solvers.get(parseInt(route.params.id as string));
onBeforeRouteUpdate((to, from) => { slv = useCoCoStore().kb.solvers.get(parseInt(to.params.id as string)); });
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
  <CoCoApp>
    <template #header>
      <router-link to="/">
        <h1>CoCo</h1>
      </router-link>
    </template>
    <template #drawer>
      <n-menu v-model:value="active_key" :options="menu" accordion />
    </template>
    <router-view />
  </CoCoApp>
</template>

<script setup lang="ts">
import 'coco-gui/dist/style.css';
import { Box20Regular, Circle20Regular, BrainCircuit20Regular, PauseCircle20Regular, PlayCircle20Regular, CheckmarkCircle20Regular, ErrorCircle20Regular } from '@vicons/fluent';
import { NMenu, type MenuOption } from 'naive-ui';
import { CoCoApp, taxonomy, rule, solver } from 'coco-gui';
import { computed, h, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useCoCoStore } from './stores/coco';

const store = useCoCoStore();

const active_key = ref<string | null>(null);
const menu: MenuOption[] = [
  { key: 'home', label: () => h(RouterLink, { to: '/' }, { default: () => 'Home' }) },
  { key: 'types', label: 'Types', children: types_menu_options(store.kb.types) as MenuOption[] },
  { key: 'items', label: 'Items', children: items_menu_options(store.kb.items) as MenuOption[] },
  { key: 'reactive_rules', label: 'Reactive Rules', children: reactive_rules_menu_options(store.kb.reactive_rules) as MenuOption[] },
  { key: 'deliberative_rules', label: 'Deliberative Rules', children: deliberative_rules_menu_options(store.kb.deliberative_rules) as MenuOption[] },
  { key: 'solvers', label: 'Solvers', children: solvers_menu_options(store.kb.solvers) as MenuOption[] }
];

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