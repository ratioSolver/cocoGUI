<template>
  <v-container id="taxonomy-graph" class="fill-height" fluid />
</template>

<script setup>
import { useCoCoStore } from '@/store/coco';
import { storeToRefs } from 'pinia';
import { onMounted, onUnmounted, watch } from 'vue';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { Type } from '@/item';

cytoscape.use(dagre);

let cy;
let layout = {
  name: 'dagre',
  fit: false,
  nodeDimensionsIncludeLabels: true
};

const { types } = storeToRefs(useCoCoStore());

onMounted(() => {
  cy = cytoscape({
    container: document.getElementById('taxonomy-graph'),
    layout: layout,
    style: [
      {
        selector: 'node',
        style: {
          'shape': 'ellipse',
          'label': 'data(name)',
          'border-width': '1px',
          'border-color': '#666'
        }
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'bezier',
          'line-color': '#666',
          'target-arrow-color': '#666',
          'target-arrow-shape': 'triangle',
          'width': '1px'
        }
      }
    ]
  });
  for (const type of types.value.values())
    cy.add({ group: 'nodes', data: { id: type.id, name: type.name } });
});

onUnmounted(() => {
  cy.destroy();
});

watch(types, (new_types, old_types) => {
  for (const type of new_types.values())
    if (!old_types.has(type.id))
      cy.add({ group: 'nodes', data: { id: type.id, name: type.name } });
    else
      cy.$id(type.id).data('name', type.name);
  for (const type of old_types.values())
    if (!new_types.has(type.id))
      cy.$id(type.id).remove();
}, { deep: true });
</script>