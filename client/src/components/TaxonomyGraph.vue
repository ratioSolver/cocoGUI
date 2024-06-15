<template>
  <v-container id="taxonomy-graph-container" class="fill-height" fluid />
</template>

<script setup>
import { useAppStore } from '@/store/app';
import { storeToRefs } from 'pinia';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

const layout = {
  name: 'dagre'
};

cytoscape.use(dagre);

const { types } = storeToRefs(useAppStore());

let cy;

onMounted(() => {
  cy = cytoscape({
    container: document.getElementById('taxonomy-graph'),
    elements: {
      nodes: Object.values(types.value).map(type => ({ data: { id: type.id, label: type.name } })),
      edges: []
    },
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'text-valign': 'center',
          'text-halign': 'center',
          'background-color': '#f8f9fa',
          'border-color': '#007bff',
          'border-width': 1,
          'border-opacity': 0.5,
          'shape': 'roundrectangle'
        }
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'bezier',
          'target-arrow-shape': 'triangle',
          'line-color': '#007bff',
          'target-arrow-color': '#007bff',
          'width': 1
        }
      }
    ],
    layout
  });
});

onUnmounted(() => {
  cy.destroy();
});

watch(types, () => {
  cy.json({ elements: { nodes: Object.values(types.value).map(type => ({ data: { id: type.id, label: type.name } })) } });
});
</script>