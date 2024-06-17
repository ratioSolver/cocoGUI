<template>
  <v-container :id='get_graph_id(solver)' :style='{ height: 800 + "px" }' eager />
</template>

<script setup>
import { Solver, SolverListener } from '@/solver';
import { onMounted, onUnmounted } from 'vue';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import popper from 'cytoscape-popper';
import chroma from 'chroma-js';
import tippy from 'tippy.js';
import 'tippy.js/themes/light-border.css';

const scale = chroma.scale(['#0f0', '#f00']).mode('lrgb').domain([0, 15]);

const props = defineProps({
  solver: {
    type: Solver,
    required: true
  }
});

const get_graph_id = (solver) => 'slv-' + solver.id + '-graph';

cytoscape.use(dagre);
cytoscape.use(popper);

let listener;

tippy.setDefaultProps({
  arrow: false,
  trigger: 'manual',
  theme: 'light-border',
  placement: 'bottom'
});

class SolverListenerImpl extends SolverListener {

  constructor(solver) {
    super();

    this.layout = {
      name: 'dagre',
      rankDir: 'LR',
      fit: false,
      nodeDimensionsIncludeLabels: true
    };

    this.cy = cytoscape({
      container: document.getElementById(get_graph_id(solver)),
      style: [
        {
          selector: 'node[type="flaw"]',
          style: {
            'shape': 'round-rectangle',
            'background-color': 'data(color)',
            'label': 'data(label)',
            'border-width': '1px',
            'border-style': 'data(stroke)',
            'border-color': '#666'
          }
        },
        {
          selector: 'node[type="resolver"]',
          style: {
            'shape': 'ellipse',
            'background-color': 'data(color)',
            'label': 'data(label)',
            'border-width': '1px',
            'border-style': 'data(stroke)',
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
            'width': '1px',
            'line-style': 'data(stroke)'
          }
        },
        {
          selector: '.current',
          style: {
            'border-width': '3px',
            'border-color': '#000'
          }
        }
      ]
    });

    solver.add_listener(this);

    this.cy.layout(this.layout).run();
  }

  graph(graph) {
    this.cy.elements().remove();
    for (const flaw of graph.flaws) {
      const n = this.cy.add({ group: 'nodes', data: { id: flaw.id, type: 'flaw', label: this.solver.flaw_label(flaw), state: flaw.state, cost: flaw.cost, color: flaw.cost < Number.POSITIVE_INFINITY ? scale(flaw.cost).hex() : '#ccc', stroke: stroke_style(flaw) } });
      n.tippy = tippy(document.createElement('div'), { getReferenceClientRect: n.popperRef().getBoundingClientRect, content: this.solver.flaw_tooltip(flaw), });
      n.on('mouseover', () => n.tippy.show());
      n.on('mouseout', () => n.tippy.hide());
    }
    for (const resolver of graph.resolvers) {
      const n = this.cy.add({ group: 'nodes', data: { id: resolver.id, type: 'resolver', label: this.solver.resolver_label(resolver), state: resolver.state, cost: resolver.cost, color: resolver.cost < Number.POSITIVE_INFINITY ? scale(resolver.cost).hex() : '#ccc', stroke: stroke_style(resolver) } });
      n.tippy = tippy(document.createElement('div'), { getReferenceClientRect: n.popperRef().getBoundingClientRect, content: this.solver.resolver_tooltip(resolver), });
      n.on('mouseover', () => n.tippy.show());
      n.on('mouseout', () => n.tippy.hide());
      this.cy.add({ group: 'edges', data: { id: resolver.id + '-' + resolver.flaw.id, source: resolver.id, target: resolver.flaw.id, state: resolver.state, stroke: stroke_style(resolver) } });
      for (const precondition of resolver.preconditions)
        this.cy.add({ group: 'edges', data: { id: precondition + '-' + resolver.id, source: precondition, target: resolver.id, state: resolver.state, stroke: stroke_style(resolver) } });
    }
    this.cy.layout(this.layout).run();
  }
  flaw_created(flaw) {
    const n = this.cy.add({ group: 'nodes', data: { id: flaw.id, type: 'flaw', label: this.solver.flaw_label(flaw), state: flaw.state, cost: flaw.cost, color: flaw.cost < Number.POSITIVE_INFINITY ? scale(flaw.cost).hex() : '#ccc', stroke: stroke_style(flaw) } });
    n.tippy = tippy(document.createElement('div'), { getReferenceClientRect: n.popperRef().getBoundingClientRect, content: this.solver.flaw_tooltip(flaw), });
    n.on('mouseover', () => n.tippy.show());
    n.on('mouseout', () => n.tippy.hide());
    this.cy.layout(this.layout).run();
  }
  flaw_state_changed(flaw) {
    this.cy.$id(flaw.id).data({ state: flaw.state, stroke: stroke_style(flaw) });
  }
  flaw_cost_changed(flaw) {
    this.cy.$id(flaw.id).data({ cost: flaw.cost, color: flaw.cost < Number.POSITIVE_INFINITY ? scale(flaw.cost).hex() : '#ccc' });
  }
  flaw_position_changed(flaw) {
    this.cy.$id(flaw.id).tippy.setContent(this.solver.flaw_tooltip(flaw));
  }
  current_flaw_changed(flaw) {
    if (flaw.current)
      this.cy.$id(flaw.id).addClass('current');
    else
      this.cy.$id(flaw.id).removeClass('current');
  }
  resolver_created(resolver) {
    const n = this.cy.add({ group: 'nodes', data: { id: resolver.id, type: 'resolver', label: this.solver.resolver_label(resolver), state: resolver.state, cost: resolver.cost, color: resolver.cost < Number.POSITIVE_INFINITY ? scale(resolver.cost).hex() : '#ccc', stroke: stroke_style(resolver) } });
    n.tippy = tippy(document.createElement('div'), { getReferenceClientRect: n.popperRef().getBoundingClientRect, content: this.solver.resolver_tooltip(resolver), });
    n.on('mouseover', () => n.tippy.show());
    n.on('mouseout', () => n.tippy.hide());
    this.cy.add({ group: 'edges', data: { id: resolver.id + '-' + resolver.flaw.id, source: resolver.id, target: resolver.flaw.id, state: resolver.state, stroke: stroke_style(resolver) } });
    for (const precondition of resolver.preconditions)
      this.cy.add({ group: 'edges', data: { id: precondition + '-' + resolver.id, source: precondition, target: resolver.id, state: resolver.state, stroke: stroke_style(resolver) } });
    this.cy.layout(this.layout).run();
  }
  resolver_state_changed(resolver) {
    this.cy.$id(resolver.id).data({ state: resolver.state, stroke: stroke_style(resolver) });
    this.cy.$id(resolver.id + '-' + resolver.flaw.id).data({ state: resolver.state, stroke: stroke_style(resolver) });
    for (const precondition of resolver.preconditions)
      this.cy.$id(precondition + '-' + resolver.id).data({ state: resolver.state, stroke: stroke_style(resolver) });
  }
  resolver_cost_changed(resolver) {
    this.cy.$id(resolver.id).data({ cost: resolver.cost, color: resolver.cost < Number.POSITIVE_INFINITY ? scale(resolver.cost).hex() : '#ccc' });
  }
  current_resolver_changed(resolver) {
    if (resolver.current)
      this.cy.$id(resolver.id).addClass('current');
    else
      this.cy.$id(resolver.id).removeClass('current');
  }
  causal_link_added(link) {
    this.cy.add({ group: 'edges', data: { id: link.from + '-' + link.to, source: link.from, target: link.to, state: link.state, stroke: stroke_style(link) } });
    this.cy.layout(this.layout).run();
  }
}

onMounted(() => {
  listener = new SolverListenerImpl(props.solver);
});

onUnmounted(() => {
  props.solver.remove_listener(listener);
  listener.cy.destroy();
  listener = null;
});
</script>

<script>
function stroke_style(node) {
  switch (node.state) {
    case 'forbidden':
      return 'dotted';
    case 'active':
      return 'solid';
    case 'inactive':
      return 'dashed';
  }
}
</script>