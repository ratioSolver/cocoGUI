import { MenuOption } from "naive-ui";
import { h } from "vue";
import { RouterLink } from "vue-router";
import { Box20Regular, Circle20Regular, BrainCircuit20Regular, PauseCircle20Regular, PlayCircle20Regular, CheckmarkCircle20Regular, ErrorCircle20Regular } from '@vicons/fluent';
import { taxonomy } from "./taxonomy";
import { rule } from "./rule";
import { solver } from "./solver";
import { computed } from "vue";

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

export function solvers_menu_options(solvers: Map<string, solver.Solver>): MenuOption[] {
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