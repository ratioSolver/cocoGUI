import { Component, computed, h } from "vue";
import { taxonomy } from "./taxonomy";
import { rule } from "./rule";
import { solver } from "./solver";
import BooleanProperty from './components/properties/BooleanProperty.vue';
import IntegerProperty from './components/properties/IntegerProperty.vue';
import RealProperty from './components/properties/RealProperty.vue';
import StringProperty from './components/properties/StringProperty.vue';
import SymbolProperty from './components/properties/SymbolProperty.vue';
import ItemProperty from './components/properties/ItemProperty.vue';
import { Box20Regular, Circle20Regular, BrainCircuit20Regular, PauseCircle20Regular, PlayCircle20Regular, CheckmarkCircle20Regular, ErrorCircle20Regular, PlugConnected20Regular, PlugDisconnected20Regular, Checkmark16Regular } from '@vicons/fluent';
import { coco } from "./coco";

/**
 * Renders a property component based on the type of the given property.
 * 
 * @param prop - The property to render.
 * @param value - The value object containing the property values.
 * @param disabled - Indicates whether the property component should be disabled.
 * @returns The rendered property component.
 */
export function property_h(prop: taxonomy.Property, value: Record<string, any>, disabled: boolean = false) {
  if (prop instanceof taxonomy.BooleanProperty) {
    return h(BooleanProperty, {
      par: prop, value: value[prop.name], disabled: disabled, onUpdate: (v: boolean | null) => {
        if (v)
          value[prop.name] = v;
        else
          delete value[prop.name];
      }
    });
  } else if (prop instanceof taxonomy.IntegerProperty) {
    return h(IntegerProperty, {
      par: prop, value: value[prop.name], disabled: disabled, onUpdate: (v: number | null) => {
        if (v)
          value[prop.name] = v;
        else
          delete value[prop.name];
      }
    });
  } else if (prop instanceof taxonomy.RealProperty) {
    return h(RealProperty, {
      par: prop, value: value[prop.name], disabled: disabled, onUpdate: (v: number | null) => {
        if (v)
          value[prop.name] = v;
        else
          delete value[prop.name];
      }
    });
  } else if (prop instanceof taxonomy.StringProperty) {
    return h(StringProperty, {
      par: prop, value: value[prop.name], disabled: disabled, onUpdate: (v: string | null) => {
        if (v)
          value[prop.name] = v;
        else
          delete value[prop.name];
      }
    });
  } else if (prop instanceof taxonomy.SymbolProperty) {
    return h(SymbolProperty, {
      par: prop, value: value[prop.name], disabled: disabled, onUpdate: (v: string | string[] | null) => {
        if (v)
          value[prop.name] = v;
        else
          delete value[prop.name];
      }
    });
  } else if (prop instanceof taxonomy.ItemProperty) {
    return h(ItemProperty, {
      par: prop, value: value[prop.name], disabled: disabled, onUpdate: (v: string | string[] | null) => {
        if (v)
          value[prop.name] = v;
        else
          delete value[prop.name];
      }
    });
  } else {
    return '';
  }
}

/**
 * Returns the visual representation of a property value.
 * 
 * @param prop - The property to visualize.
 * @param value - The value of the property.
 * @returns The visual representation of the property value.
 */
export function property_v(prop: taxonomy.Property, value: any) {
  if (prop instanceof taxonomy.BooleanProperty) {
    return value ? '✓' : '✗';
  } else if (prop instanceof taxonomy.IntegerProperty) {
    return value;
  } else if (prop instanceof taxonomy.RealProperty) {
    return value;
  } else if (prop instanceof taxonomy.StringProperty) {
    return value;
  } else if (prop instanceof taxonomy.SymbolProperty) {
    if (value)
      return prop.multiple ? value.join(', ') : value;
    else
      return '';
  } else if (prop instanceof taxonomy.ItemProperty) {
    if (value)
      return prop.multiple ? value.map((v: string) => coco.KnowledgeBase.getInstance().items.get(v)?.get_name()).join(', ') : coco.KnowledgeBase.getInstance().items.get(value)?.get_name();
    else
      return '';
  } else {
    return '';
  }
}

export function type_icon() { return h(Box20Regular); }
export function item_icon() { return h(Circle20Regular); }
export function reactive_rule_icon() { return h(Box20Regular); }
export function deliberative_rule_icon() { return h(Box20Regular); }
export function solver_icon(slv: solver.Solver) {
  switch (slv.state) {
    case solver.State.reasoning:
    case solver.State.adapting: return h(BrainCircuit20Regular);
    case solver.State.idle: return h(PauseCircle20Regular);
    case solver.State.executing: return h(PlayCircle20Regular);
    case solver.State.finished: return h(CheckmarkCircle20Regular);
    case solver.State.failed: return h(ErrorCircle20Regular);
  }
}