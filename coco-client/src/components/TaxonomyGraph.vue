<template>
  <v-container id="taxonomy-graph" class="fill-height" fluid />
</template>


<script setup lang="ts">
import { coco } from '@/type';
import { Knowledge, KnowledgeListener } from '@/knowledge';
import { onMounted, onUnmounted } from 'vue';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

const props = defineProps<{ knowledge: Knowledge; }>();

cytoscape.use(dagre);

let listener: TypeListener | null = null;

const layout = {
  name: 'dagre',
  fit: false,
  nodeDimensionsIncludeLabels: true
};

class TypeListener extends KnowledgeListener {

  cy: cytoscape.Core;

  constructor(knowledge: Knowledge) {
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
            'border-color': '#666',
            'background-color': '#ccc',
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
  }

  types(types: coco.Type[]) {
    for (const type of types.values())
      this.cy.add({ group: 'nodes', data: { id: type.id, name: type.name } });
    this.cy.layout(layout).run();
  }
  type_added(type: coco.Type) {
    this.cy.add({ group: 'nodes', data: { id: type.id, name: type.name } });
    this.cy.layout(layout).run();
  }
  type_updated(type: coco.Type) {
    this.cy.$id(type.id).data('name', type.name);
  }
  type_removed(id: string) {
    this.cy.$id(id).remove();
    this.cy.layout(layout).run();
  }
}

onMounted(() => {
  listener = new TypeListener(props.knowledge);
});

onUnmounted(() => {
  props.knowledge.remove_listener(listener!);
  listener!.cy.destroy();
  listener = null;
});
</script>