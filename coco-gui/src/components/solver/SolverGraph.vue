<template>
  <div :id="get_graph_id(props.slv)"></div>
</template>

<script setup lang="ts">
import { solver } from '@/solver';
import { graph } from '@/graph';
import { onMounted, onUnmounted } from 'vue';
import cytoscape from 'cytoscape';
import tippy, { Instance } from 'tippy.js';
import chroma from 'chroma-js'

const props = defineProps<{ slv: solver.Solver; }>();

const get_graph_id = (solver: solver.Solver) => 'slv-' + solver.id + '-graph';

let listener: SolverListenerImpl | null = null;

tippy.setDefaultProps({
  arrow: false,
  trigger: 'manual',
  theme: 'light-border',
  placement: 'bottom'
});

class SolverListenerImpl extends solver.SolverListener {

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

  constructor(solver: solver.Solver) {
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

  graph(flaws: graph.Flaw[], resolvers: graph.Resolver[], current_flaw: graph.Flaw, current_resolver: graph.Resolver): void {
    this.cy.elements().remove();
    this.tippys.forEach(tippy => tippy.destroy());
    this.tippys.clear();
    for (const flaw of flaws) {
      const n = this.cy.add({ group: 'nodes', data: { id: flaw.id, type: 'flaw', label: graph.Flaw.flaw_label(flaw), color: color(flaw), stroke: stroke_style(flaw) } });
      this.tippys.set(flaw.id, tippy(document.createElement('div'), { getReferenceClientRect: n.popperRef().getBoundingClientRect, content: graph.Flaw.flaw_tooltip(flaw), }));
      n.on('mouseover', () => this.tippys.get(flaw.id)!.show());
      n.on('mouseout', () => this.tippys.get(flaw.id)!.hide());
    }
    for (const resolver of resolvers) {
      const n = this.cy.add({ group: 'nodes', data: { id: resolver.id, type: 'resolver', label: graph.Resolver.resolver_label(resolver), color: color(resolver), stroke: stroke_style(resolver) } });
      this.tippys.set(resolver.id, tippy(document.createElement('div'), { getReferenceClientRect: n.popperRef().getBoundingClientRect, content: graph.Resolver.resolver_tooltip(resolver), }));
      n.on('mouseover', () => this.tippys.get(resolver.id)!.show());
      n.on('mouseout', () => this.tippys.get(resolver.id)!.hide());
      this.cy.add({ group: 'edges', data: { id: `${resolver.id}-${resolver.flaw.id}`, source: resolver.id, target: resolver.flaw.id, stroke: stroke_style(resolver) } });
      for (const precondition of resolver.preconditions)
        this.cy.add({ group: 'edges', data: { id: `${precondition.id}-${resolver.id}`, source: precondition.id, target: resolver.id, stroke: stroke_style(resolver) } });
    }
    if (current_flaw && current_flaw.current)
      this.cy.$id(current_flaw.id).addClass('current');
    if (current_resolver && current_resolver.current)
      this.cy.$id(current_resolver.id).addClass('current');
    this.cy.layout(this.layout).run();
  }
  flaw_created(flaw: graph.Flaw): void {
    const n = this.cy.add({ group: 'nodes', data: { id: flaw.id, type: 'flaw', label: graph.Flaw.flaw_label(flaw), color: color(flaw), stroke: stroke_style(flaw) } });
    this.tippys.set(flaw.id, tippy(document.createElement('div'), { getReferenceClientRect: n.popperRef().getBoundingClientRect, content: graph.Flaw.flaw_tooltip(flaw), }));
    n.on('mouseover', () => this.tippys.get(flaw.id)!.show());
    n.on('mouseout', () => this.tippys.get(flaw.id)!.hide());
    for (const cause of flaw.causes)
      this.cy.add({ group: 'edges', data: { id: `${flaw.id}-${cause.id}`, source: flaw.id, target: cause.id, stroke: stroke_style(flaw) } });
    this.cy.layout(this.layout).run();
  }
  flaw_state_changed(flaw: graph.Flaw): void {
    this.cy.$id(flaw.id).data({ color: color(flaw), stroke: stroke_style(flaw) });
    this.cy.layout(this.layout).run();
  }
  flaw_cost_changed(flaw: graph.Flaw): void {
    this.cy.$id(flaw.id).data({ color: color(flaw) });
    this.tippys.get(flaw.id)!.setContent(graph.Flaw.flaw_tooltip(flaw));
    this.cy.layout(this.layout).run();
  }
  flaw_position_changed(flaw: graph.Flaw): void {
    this.tippys.get(flaw.id)!.setContent(graph.Flaw.flaw_tooltip(flaw));
    this.cy.layout(this.layout).run();
  }
  current_flaw_changed(flaw: graph.Flaw): void {
    if (flaw.current)
      this.cy.$id(flaw.id).addClass('current');
    else
      this.cy.$id(flaw.id).removeClass('current');
    this.cy.layout(this.layout).run();
  }
  resolver_created(resolver: graph.Resolver): void {
    const n = this.cy.add({ group: 'nodes', data: { id: resolver.id, type: 'resolver', label: graph.Resolver.resolver_label(resolver), color: color(resolver), stroke: stroke_style(resolver) } });
    this.tippys.set(resolver.id, tippy(document.createElement('div'), { getReferenceClientRect: n.popperRef().getBoundingClientRect, content: graph.Resolver.resolver_tooltip(resolver), }));
    n.on('mouseover', () => this.tippys.get(resolver.id)!.show());
    n.on('mouseout', () => this.tippys.get(resolver.id)!.hide());
    this.cy.add({ group: 'edges', data: { id: `${resolver.id}-${resolver.flaw.id}`, source: resolver.id, target: resolver.flaw.id, stroke: stroke_style(resolver) } });
    this.cy.layout(this.layout).run();
  }
  resolver_state_changed(resolver: graph.Resolver): void {
    this.cy.$id(resolver.id).data({ color: color(resolver), stroke: stroke_style(resolver) });
    this.cy.$id(`${resolver.id}-${resolver.flaw.id}`).data({ stroke: stroke_style(resolver) });
    for (const precondition of resolver.preconditions)
      this.cy.$id(`${precondition.id}-${resolver.id}`).data({ stroke: stroke_style(resolver) });
    this.cy.layout(this.layout).run();
  }
  resolver_cost_changed(resolver: graph.Resolver): void {
    this.cy.$id(resolver.id).data({ color: color(resolver) });
    this.cy.layout(this.layout).run();
  }
  current_resolver_changed(resolver: graph.Resolver): void {
    if (resolver.current)
      this.cy.$id(resolver.id).addClass('current');
    else
      this.cy.$id(resolver.id).removeClass('current');
    this.cy.layout(this.layout).run();
  }
  causal_link_added(flaw: graph.Flaw, resolver: graph.Resolver): void {
    this.cy.add({ group: 'edges', data: { id: `${flaw.id}-${resolver.id}`, source: flaw.id, target: resolver.id, stroke: stroke_style(resolver) } });
    this.cy.layout(this.layout).run();
  }
}

onMounted(() => {
  listener = new SolverListenerImpl(props.slv);
});

onUnmounted(() => {
  props.slv.remove_listener(listener!);
  listener!.cy.destroy();
  listener = null;
});

</script>

<script lang="ts">
const scale = chroma.scale(['#0f0', '#f00']).mode('lrgb').domain([0, 15]);

function stroke_style(node: graph.Flaw | graph.Resolver): string {
  switch (node.state) {
    case graph.State.active:
      return 'solid';
    case graph.State.forbidden:
      return 'dotted';
    case graph.State.inactive:
      return 'dashed';
  }
}

function color(node: graph.Flaw | graph.Resolver): string {
  if (node.state == graph.State.forbidden)
    return '#ccc';
  else if (node.cost == Infinity)
    return '#000';
  else
    return scale(node.cost).hex();
}
</script>