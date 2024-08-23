import { MenuOption } from "naive-ui";
import { h } from "vue";
import { Box20Regular, Circle20Regular, BrainCircuit20Regular, PauseCircle20Regular, PlayCircle20Regular, CheckmarkCircle20Regular, ErrorCircle20Regular } from '@vicons/fluent';
import { taxonomy } from "./taxonomy";
import { rule } from "./rule";
import { solver } from "./solver";
import BooleanProperty from './components/properties/BooleanProperty.vue';
import IntegerProperty from './components/properties/IntegerProperty.vue';
import RealProperty from './components/properties/RealProperty.vue';
import StringProperty from './components/properties/StringProperty.vue';
import SymbolProperty from './components/properties/SymbolProperty.vue';
import ItemProperty from './components/properties/ItemProperty.vue';
import { computed } from "vue";

/*
export function types_menu_options(types: Map<string, taxonomy.Type>): MenuOption[] {
    return Array.from(types.values()).map(type => {
        return {
            label: () => h(RouterLink, { to: { name: 'type', params: { id: type.id } } }, { default: () => type.name }),
            key: type.id,
            icon: () => h(Box20Regular),
        }
    });
}

export function items_menu_options(items: Map<string, taxonomy.Item>): MenuOption[] {
    return Array.from(items.values()).map(item => {
        return {
            label: () => h(RouterLink, { to: { name: 'item', params: { id: item.id } } }, { default: () => item.name }),
            key: item.id,
            icon: () => h(Circle20Regular),
        }
    });
}

export function reactive_rules_menu_options(rules: Map<string, rule.ReactiveRule>): MenuOption[] {
    return Array.from(rules.values()).map(rule => {
        return {
            label: () => h(RouterLink, { to: { name: 'rule', params: { id: rule.id } } }, { default: () => rule.name }),
            key: rule.id,
            icon: () => h(Box20Regular),
        }
    });
}

export function deliberative_rules_menu_options(rules: Map<string, rule.DeliberativeRule>): MenuOption[] {
    return Array.from(rules.values()).map(rule => {
        return {
            label: () => h(RouterLink, { to: { name: 'rule', params: { id: rule.id } } }, { default: () => rule.name }),
            key: rule.id,
            icon: () => h(Box20Regular),
        }
    });
}

export function solvers_menu_options(solvers: Map<number, solver.Solver>): MenuOption[] {
    return Array.from(solvers.values()).map(slv => {
        const icn = computed(() => {
            switch (slv.state) {
                case solver.State.reasoning:
                case solver.State.adapting: return BrainCircuit20Regular;
                case solver.State.idle: return PauseCircle20Regular;
                case solver.State.executing: return PlayCircle20Regular;
                case solver.State.finished: return CheckmarkCircle20Regular;
                case solver.State.failed: return ErrorCircle20Regular;
            }
        });
        return {
            label: () => h(RouterLink, { to: { name: 'solver', params: { id: slv.id } } }, { default: () => slv.name }),
            key: slv.id,
            icon: () => h(icn.value)
        }
    });
}
*/

export function property_h(prop: taxonomy.Property, value: Record<string, any> | undefined, disabled: boolean = false) {
    if (prop instanceof taxonomy.BooleanProperty) {
        return h(BooleanProperty, { par: prop, value: value ? value[prop.name] : undefined, disabled: disabled });
    } else if (prop instanceof taxonomy.IntegerProperty) {
        return h(IntegerProperty, { par: prop, value: value ? value[prop.name] : undefined, disabled: disabled });
    } else if (prop instanceof taxonomy.RealProperty) {
        return h(RealProperty, { par: prop, value: value ? value[prop.name] : undefined, disabled: disabled });
    } else if (prop instanceof taxonomy.StringProperty) {
        return h(StringProperty, { par: prop, value: value ? value[prop.name] : undefined, disabled: disabled });
    } else if (prop instanceof taxonomy.SymbolProperty) {
        return h(SymbolProperty, { par: prop, value: value ? value[prop.name] : undefined, disabled: disabled });
    } else if (prop instanceof taxonomy.ItemProperty) {
        return h(ItemProperty, { par: prop, value: value ? value[prop.name] : undefined, disabled: disabled });
    } else {
        return '';
    }
}