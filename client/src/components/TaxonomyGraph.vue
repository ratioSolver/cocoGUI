<template>
  <v-container id="taxonomy-graph" class="taxonomy-container" fluid />
</template>


<script setup lang="ts">
import { coco } from '@/type';
import { Knowledge, KnowledgeListener } from '@/knowledge';
import { onMounted, onUnmounted } from 'vue';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import popper from 'cytoscape-popper';
import tippy, { Instance } from 'tippy.js';

const props = defineProps<{ knowledge: Knowledge; }>();

cytoscape.use(dagre);
cytoscape.use(popper);

let listener: TypeListener | null = null;

tippy.setDefaultProps({
  arrow: false,
  trigger: 'manual',
  theme: 'light-border',
  placement: 'bottom'
});

class TypeListener extends KnowledgeListener {

  cy: cytoscape.Core;
  layout = {
    name: 'dagre',
    rankDir: 'BT',
    fit: false,
    nodeDimensionsIncludeLabels: true
  };
  tippys: Map<string, Instance> = new Map();

  constructor(knowledge: Knowledge) {
    super();

    this.cy = cytoscape({
      container: document.getElementById('taxonomy-graph'),
      layout: this.layout,
      style: [
        {
          selector: 'node',
          style: {
            'shape': 'ellipse',
            'label': 'data(name)',
            'border-width': '1px',
            'border-color': '#666',
            'background-color': '#FFD700',
          }
        },
        {
          selector: 'edge[type="is_a"]',
          style: {
            'curve-style': 'bezier',
            'line-color': '#666',
            'target-arrow-color': '#666',
            'target-arrow-shape': 'triangle',
            'width': '1px'
          }
        },
        {
          selector: 'edge[type="static_property"]',
          style: {
            'curve-style': 'bezier',
            'label': 'data(name)',
            'line-color': '#666',
            'target-arrow-color': '#666',
            'target-arrow-shape': 'diamond',
            'width': '1px',
            'line-style': 'dashed'
          }
        },
        {
          selector: 'edge[type="dynamic_property"]',
          style: {
            'curve-style': 'bezier',
            'label': 'data(name)',
            'line-color': '#666',
            'target-arrow-color': '#666',
            'target-arrow-shape': 'diamond',
            'width': '1px',
            'line-style': 'dotted'
          }
        }
      ]
    });

    knowledge.add_listener(this);
  }

  types(types: coco.Type[]) {
    this.cy.elements().remove();
    this.tippys.forEach(tippy => tippy.destroy());
    this.tippys.clear();
    for (const type of types.values()) {
      const n = this.cy.add({ group: 'nodes', data: { id: type.id, name: type.name } });
      this.tippys.set(type.id, tippy(document.createElement('div'), { getReferenceClientRect: n.popperRef().getBoundingClientRect, content: coco.Type.type_tooltip(type), allowHTML: true }));
      n.on('mouseover', () => this.tippys.get(type.id)!.show());
      n.on('mouseout', () => this.tippys.get(type.id)!.hide());
    }
    for (const type of types.values()) {
      for (const parent of type.parents.values())
        this.cy.add({ group: 'edges', data: { id: `${type.id}-${parent.id}`, type: 'is_a', source: type.id, target: parent.id } });
      for (const prop of type.static_properties.values())
        if (prop instanceof coco.ItemProperty)
          this.cy.add({ group: 'edges', data: { id: `${type.id}-${prop.type.id}`, type: 'static_property', name: prop.name, source: type.id, target: prop.type.id } });
      for (const prop of type.dynamic_properties.values())
        if (prop instanceof coco.ItemProperty)
          this.cy.add({ group: 'edges', data: { id: `${type.id}-${prop.type.id}`, type: 'dynamic_property', name: prop.name, source: type.id, target: prop.type.id } });
    }
    this.cy.layout(this.layout).run();
  }
  type_added(type: coco.Type) {
    const n = this.cy.add({ group: 'nodes', data: { id: type.id, name: type.name } });
    this.tippys.set(type.id, tippy(document.createElement('div'), { getReferenceClientRect: n.popperRef().getBoundingClientRect, content: coco.Type.type_tooltip(type), allowHTML: true }));
    n.on('mouseover', () => this.tippys.get(type.id)!.show());
    n.on('mouseout', () => this.tippys.get(type.id)!.hide());
    for (const parent of type.parents.values())
      this.cy.add({ group: 'edges', data: { id: `${type.id}-${parent.id}`, type: 'is_a', source: type.id, target: parent.id } });
    for (const prop of type.static_properties.values())
      if (prop instanceof coco.ItemProperty)
        this.cy.add({ group: 'edges', data: { id: `${type.id}-${prop.type.id}`, type: 'static_property', name: prop.name, source: type.id, target: prop.type.id } });
    for (const prop of type.dynamic_properties.values())
      if (prop instanceof coco.ItemProperty)
        this.cy.add({ group: 'edges', data: { id: `${type.id}-${prop.type.id}`, type: 'dynamic_property', name: prop.name, source: type.id, target: prop.type.id } });
    this.cy.layout(this.layout).run();
  }
  type_updated(type: coco.Type) {
    this.cy.$id(type.id).data('name', type.name);
    this.tippys.get(type.id)!.setContent(coco.Type.type_tooltip(type));
    this.cy.edges().filter(e => e.source().id() === type.id).remove();
    for (const parent of type.parents.values())
      this.cy.add({ group: 'edges', data: { id: `${type.id}-${parent.id}`, type: 'is_a', source: type.id, target: parent.id } });
    for (const prop of type.static_properties.values())
      if (prop instanceof coco.ItemProperty)
        this.cy.add({ group: 'edges', data: { id: `${type.id}-${prop.type.id}`, type: 'static_property', source: type.id, target: prop.type.id } });
    for (const prop of type.dynamic_properties.values())
      if (prop instanceof coco.ItemProperty)
        this.cy.add({ group: 'edges', data: { id: `${type.id}-${prop.type.id}`, type: 'dynamic_property', source: type.id, target: prop.type.id } });
    this.cy.layout(this.layout).run();
  }
  type_removed(id: string) {
    this.cy.$id(id).remove();
    this.cy.layout(this.layout).run();
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

<style scoped>
.taxonomy-container {
  height: calc(100% - 50px);
  width: 100%;
}
</style>