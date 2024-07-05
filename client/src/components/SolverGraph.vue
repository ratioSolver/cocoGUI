<template>
  <v-container v-resize='on_resize' class="h-75" :id='get_graph_id(solver)' fluid />
</template>

<script setup lang="ts">
import { Solver, SolverListener } from '@/solver';
import { Flaw, Resolver, State } from '@/graph';
import { nextTick, onUnmounted } from 'vue';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import popper from 'cytoscape-popper';
import chroma from 'chroma-js';
import tippy, { Instance } from 'tippy.js';
import 'tippy.js/themes/light-border.css';

const props = defineProps<{ solver: Solver; }>();

const get_graph_id = (solver: Solver) => 'slv-' + solver.id + '-graph';

cytoscape.use(dagre);
cytoscape.use(popper);

let listener: SolverListenerImpl | null = null;

tippy.setDefaultProps({
  arrow: false,
  trigger: 'manual',
  theme: 'light-border',
  placement: 'bottom'
});

class SolverListenerImpl extends SolverListener {

  cy: cytoscape.Core;
  layout = {
    name: 'dagre',
    rankDir: 'LR',
    fit: false,
    nodeDimensionsIncludeLabels: true,
    animate: true,
    animationDuration: 100
  };
  tippys: Map<string, Instance> = new Map();

  constructor(solver: Solver) {
    super();

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
            'border-style': 'data(stroke)' as any,
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
            'border-style': 'data(stroke)' as any,
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
            'line-style': 'data(stroke)' as any
          }
        },
        {
          selector: 'node.current',
          style: {
            'border-width': '3px',
            'border-color': '#000'
          }
        }
      ]
    });

    solver.add_listener(this);
  }

  graph(flaws: Flaw[], resolvers: Resolver[], current_flaw: Flaw, current_resolver: Resolver): void {
    this.cy.elements().remove();
    this.tippys.forEach(tippy => tippy.destroy());
    this.tippys.clear();
    for (const flaw of flaws) {
      const n = this.cy.add({ group: 'nodes', data: { id: flaw.id, type: 'flaw', label: Flaw.flaw_label(flaw), color: color(flaw), stroke: stroke_style(flaw) } });
      this.tippys.set(flaw.id, tippy(document.createElement('div'), { getReferenceClientRect: n.popperRef().getBoundingClientRect, content: Flaw.flaw_tooltip(flaw), }));
      n.on('mouseover', () => this.tippys.get(flaw.id)!.show());
      n.on('mouseout', () => this.tippys.get(flaw.id)!.hide());
    }
    for (const resolver of resolvers) {
      const n = this.cy.add({ group: 'nodes', data: { id: resolver.id, type: 'resolver', label: Resolver.resolver_label(resolver), color: color(resolver), stroke: stroke_style(resolver) } });
      this.tippys.set(resolver.id, tippy(document.createElement('div'), { getReferenceClientRect: n.popperRef().getBoundingClientRect, content: Resolver.resolver_tooltip(resolver), }));
      n.on('mouseover', () => this.tippys.get(resolver.id)!.show());
      n.on('mouseout', () => this.tippys.get(resolver.id)!.hide());
      this.cy.add({ group: 'edges', data: { id: resolver.id + '-' + resolver.flaw.id, source: resolver.id, target: resolver.flaw.id, stroke: stroke_style(resolver) } });
      for (const precondition of resolver.preconditions)
        this.cy.add({ group: 'edges', data: { id: precondition + '-' + resolver.id, source: precondition, target: resolver.id, stroke: stroke_style(resolver) } });
    }
    if (current_flaw && current_flaw.current)
      this.cy.$id(current_flaw.id).addClass('current');
    if (current_resolver && current_resolver.current)
      this.cy.$id(current_resolver.id).addClass('current');
    this.cy.layout(this.layout).run();
  }
  flaw_created(flaw: Flaw): void {
    const n = this.cy.add({ group: 'nodes', data: { id: flaw.id, type: 'flaw', label: Flaw.flaw_label(flaw), color: color(flaw), stroke: stroke_style(flaw) } });
    this.tippys.set(flaw.id, tippy(document.createElement('div'), { getReferenceClientRect: n.popperRef().getBoundingClientRect, content: Flaw.flaw_tooltip(flaw), }));
    n.on('mouseover', () => this.tippys.get(flaw.id)!.show());
    n.on('mouseout', () => this.tippys.get(flaw.id)!.hide());
    for (const cause of flaw.causes)
      this.cy.add({ group: 'edges', data: { id: flaw.id + '-' + cause.id, source: flaw.id, target: cause.id, stroke: stroke_style(flaw) } });
    this.cy.layout(this.layout).run();
  }
  flaw_state_changed(flaw: Flaw): void {
    this.cy.$id(flaw.id).data({ color: color(flaw), stroke: stroke_style(flaw) });
    this.cy.layout(this.layout).run();
  }
  flaw_cost_changed(flaw: Flaw): void {
    this.cy.$id(flaw.id).data({ color: color(flaw) });
    this.tippys.get(flaw.id)!.setContent(Flaw.flaw_tooltip(flaw));
    this.cy.layout(this.layout).run();
  }
  flaw_position_changed(flaw: Flaw): void {
    this.tippys.get(flaw.id)!.setContent(Flaw.flaw_tooltip(flaw));
    this.cy.layout(this.layout).run();
  }
  current_flaw_changed(flaw: Flaw): void {
    if (flaw.current)
      this.cy.$id(flaw.id).addClass('current');
    else
      this.cy.$id(flaw.id).removeClass('current');
    this.cy.layout(this.layout).run();
  }
  resolver_created(resolver: Resolver): void {
    const n = this.cy.add({ group: 'nodes', data: { id: resolver.id, type: 'resolver', label: Resolver.resolver_label(resolver), color: color(resolver), stroke: stroke_style(resolver) } });
    this.tippys.set(resolver.id, tippy(document.createElement('div'), { getReferenceClientRect: n.popperRef().getBoundingClientRect, content: Resolver.resolver_tooltip(resolver), }));
    n.on('mouseover', () => this.tippys.get(resolver.id)!.show());
    n.on('mouseout', () => this.tippys.get(resolver.id)!.hide());
    this.cy.add({ group: 'edges', data: { id: resolver.id + '-' + resolver.flaw.id, source: resolver.id, target: resolver.flaw.id, stroke: stroke_style(resolver) } });
    this.cy.layout(this.layout).run();
  }
  resolver_state_changed(resolver: Resolver): void {
    this.cy.$id(resolver.id).data({ color: color(resolver), stroke: stroke_style(resolver) });
    this.cy.$id(resolver.id + '-' + resolver.flaw.id).data({ stroke: stroke_style(resolver) });
    for (const precondition of resolver.preconditions)
      this.cy.$id(precondition + '-' + resolver.id).data({ stroke: stroke_style(resolver) });
    this.cy.layout(this.layout).run();
  }
  resolver_cost_changed(resolver: Resolver): void {
    this.cy.$id(resolver.id).data({ color: color(resolver) });
    this.cy.layout(this.layout).run();
  }
  current_resolver_changed(resolver: Resolver): void {
    if (resolver.current)
      this.cy.$id(resolver.id).addClass('current');
    else
      this.cy.$id(resolver.id).removeClass('current');
    this.cy.layout(this.layout).run();
  }
  causal_link_added(flaw: Flaw, resolver: Resolver): void {
    this.cy.add({ group: 'edges', data: { id: flaw.id + '-' + resolver.id, source: flaw.id, target: resolver.id, stroke: stroke_style(resolver) } });
    this.cy.layout(this.layout).run();
  }
}

onUnmounted(() => {
  props.solver.remove_listener(listener!);
  listener!.cy.destroy();
  listener = null;
});

function on_resize() {
  nextTick(() => {
    if (listener)
      listener.cy.resize();
    else if (document.getElementById(get_graph_id(props.solver))!.offsetWidth && document.getElementById(get_graph_id(props.solver))!.offsetHeight)
      listener = new SolverListenerImpl(props.solver);
  });
}
</script>

<script lang="ts">
const scale = chroma.scale(['#0f0', '#f00']).mode('lrgb').domain([0, 15]);

function stroke_style(node: Flaw | Resolver): string {
  switch (node.state) {
    case State.active:
      return 'solid';
    case State.forbidden:
      return 'dotted';
    case State.inactive:
      return 'dashed';
  }
}

function color(node: Flaw | Resolver): string {
  if (node.state == State.forbidden)
    return '#ccc';
  else if (node.cost == Infinity)
    return '#000';
  else
    return scale(node.cost).hex();
}
</script>