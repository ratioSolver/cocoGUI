<template>
  <v-container id="taxonomy-graph" class="fill-height" fluid />
</template>

<script setup>
import { Knowledge, KnowledgeListener } from '@/knowledge';
import { onMounted, onUnmounted } from 'vue';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

const props = defineProps({
  knowledge: {
    type: Knowledge,
    required: true
  }
});

cytoscape.use(dagre);

let listener;

const layout = {
  name: 'dagre',
  fit: false,
  nodeDimensionsIncludeLabels: true
};

class TypeListener extends KnowledgeListener {

  constructor(knowledge) {
    super();

    this.cy = cytoscape({
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

    knowledge.add_listener(this);

    this.cy.layout(layout).run();
  }

  types(types) {
    for (const type of types.values())
      this.cy.add({ group: 'nodes', data: { id: type.id, name: type.name } });
  }
  type_added(type) {
    this.cy.add({ group: 'nodes', data: { id: type.id, name: type.name } });
  }
  type_updated(type) {
    this.cy.$id(type.id).data('name', type.name);
  }
  type_removed(id) {
    this.cy.$id(id).remove();
  }
}

onMounted(() => {
  listener = new TypeListener(props.knowledge);
});

onUnmounted(() => {
  props.knowledge.remove_listener(listener);
  listener.cy.destroy();
  listener = null;
});
</script>