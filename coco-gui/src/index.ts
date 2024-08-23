import CoCoApp from './components/CoCoApp.vue';
import FrameComponent from './components/FrameComponent.vue';
import Chat from './components/Chat.vue';
import LogInDialog from './components/LogInDialog.vue';
import Map from './components/Map.vue';

import BooleanProperty from '@/components/properties/BooleanProperty.vue';
import IntegerProperty from './components/properties/IntegerProperty.vue';
import RealProperty from './components/properties/RealProperty.vue';
import StringProperty from './components/properties/StringProperty.vue';
import SymbolProperty from './components/properties/SymbolProperty.vue';
import ItemProperty from './components/properties/ItemProperty.vue';

import ReactiveRule from './components/taxonomy/ReactiveRule.vue';
import DeliberativeRule from './components/taxonomy/DeliberativeRule.vue';
import Item from './components/taxonomy/Item.vue';
import ItemListItem from './components/taxonomy/ItemListItem.vue';
import ItemChart from './components/taxonomy/ItemChart.vue';
import ItemPublisher from './components/taxonomy/ItemPublisher.vue';
import TypeListItem from './components/taxonomy/TypeListItem.vue';
import Type from './components/taxonomy/Type.vue';
import TaxonomyGraph from './components/taxonomy/TaxonomyGraph.vue';

import Solver from './components/solver/Solver.vue';
import SolverListItem from './components/solver/SolverListItem.vue';
import SolverGraph from './components/solver/SolverGraph.vue';
import SolverTimelines from './components/solver/SolverTimelines.vue';

export * from './utils';
export { coco } from './coco';
export { CoCoApp, FrameComponent, Chat, LogInDialog, Map };
export { BooleanProperty, IntegerProperty, RealProperty, StringProperty, SymbolProperty, ItemProperty };
export { ReactiveRule, DeliberativeRule, Item, ItemListItem, ItemChart, ItemPublisher, TypeListItem, Type, TaxonomyGraph };
export { Solver, SolverListItem, SolverGraph, SolverTimelines };

import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import cytoscapePopper, { RefElement } from 'cytoscape-popper';
import tippy from 'tippy.js';

function tippyFactory(ref: RefElement, content: HTMLElement) {
  // Since tippy constructor requires DOM element/elements, create a placeholder
  var dummyDomEle = document.createElement('div');

  var tip = tippy(dummyDomEle, {
    getReferenceClientRect: ref.getBoundingClientRect,
    trigger: 'manual', // mandatory
    // dom element inside the tippy:
    content: content,
    // your own preferences:
    arrow: true,
    placement: 'bottom',
    hideOnClick: false,
    sticky: "reference",

    // if interactive:
    interactive: true,
    appendTo: document.body // or append dummyDomEle to document.body
  });

  return tip;
}

cytoscape.use(dagre);
cytoscape.use(cytoscapePopper(tippyFactory));
