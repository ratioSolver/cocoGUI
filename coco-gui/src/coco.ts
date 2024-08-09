import { taxonomy } from "./taxonomy"
import { rule } from "./rule"
import { solver } from "./solver"
import { static_properties, dynamic_properties } from "./stores/coco";

export namespace coco {

    export class StateListener {

        constructor() {
        }

        types(types: taxonomy.Type[]) { }
        type_added(type: taxonomy.Type) { }
        type_updated(type: taxonomy.Type) { }
        type_removed(id: string) { }

        items(items: taxonomy.Item[]) { }
        item_added(item: taxonomy.Item) { }
        item_updated(item: taxonomy.Item) { }
        item_removed(id: string) { }

        reactive_rules(rules: rule.ReactiveRule[]) { }
        reactive_rule_added(rule: rule.ReactiveRule) { }
        reactive_rule_updated(rule: rule.ReactiveRule) { }
        reactive_rule_removed(id: string) { }

        deliberative_rules(rules: rule.DeliberativeRule[]) { }
        deliberative_rule_added(rule: rule.DeliberativeRule) { }
        deliberative_rule_updated(rule: rule.DeliberativeRule) { }
        deliberative_rule_removed(id: string) { }

        solvers(solvers: solver.Solver[]) { }
        solver_added(solver: solver.Solver) { }
        solver_removed(id: string) { }
    }

    /**
     * Represents the CoCo knowledge base.
     */
    export class State {

        types: Map<string, taxonomy.Type>;
        items: Map<string, taxonomy.Item>;
        reactive_rules: Map<string, rule.ReactiveRule>;
        deliberative_rules: Map<string, rule.DeliberativeRule>;
        solvers: Map<string, solver.Solver>;
        listeners: Set<StateListener>;

        /**
         * Creates a new Knowledge instance.
         */
        constructor() {
            this.types = new Map();
            this.items = new Map();
            this.reactive_rules = new Map();
            this.deliberative_rules = new Map();
            this.solvers = new Map();
            this.listeners = new Set();
        }

        update_knowledge(message: any): boolean {
            switch (message.type) {
                case 'types':
                    this.set_types(message);
                    return true;
                case 'new_type':
                    this.add_type(message);
                    return true;
                case 'updated_type':
                    this.update_type(message);
                    return true;
                case 'deleted_type':
                    this.remove_type(message);
                    return true;
                case 'items':
                    this.set_items(message);
                    return true;
                case 'new_item':
                    this.add_item(message);
                    return true;
                case 'updated_item':
                    this.update_item(message);
                    return true;
                case 'new_data':
                    this.add_data(message);
                    return true;
                case 'deleted_item':
                    this.remove_item(message);
                    return true;
                case 'reactive_rules':
                    this.set_reactive_rules(message);
                    return true;
                case 'new_reactive_rule':
                    this.add_reactive_rule(message);
                    return true;
                case 'updated_reactive_rule':
                    this.update_reactive_rule(message);
                    return true;
                case 'deleted_reactive_rule':
                    this.remove_reactive_rule(message);
                    return true;
                case 'deliberative_rules':
                    this.set_deliberative_rules(message);
                    return true;
                case 'new_deliberative_rule':
                    this.add_deliberative_rule(message);
                    return true;
                case 'updated_deliberative_rule':
                    this.update_deliberative_rule(message);
                    return true;
                case 'deleted_deliberative_rule':
                    this.remove_deliberative_rule(message);
                    return true;
                case 'solvers':
                    this.set_solvers(message.solvers);
                    return true;
                case 'solver_state':
                    this.solvers.get(message.id)!.set_state(message);
                    return true;
                case 'solver_graph':
                    this.solvers.get(message.id)!.set_graph(message);
                    return true;
                case 'new_solver':
                    this.add_solver(message);
                    return true;
                case 'deleted_solver':
                    this.remove_solver(message);
                    return true;
                case 'flaw_created':
                    this.solvers.get(message.solver_id)!.create_flaw(message);
                    return true;
                case 'flaw_state_changed':
                    this.solvers.get(message.solver_id)!.set_flaw_state(message);
                    return true;
                case 'flaw_cost_changed':
                    this.solvers.get(message.solver_id)!.set_flaw_cost(message);
                    return true;
                case 'flaw_position_changed':
                    this.solvers.get(message.solver_id)!.set_flaw_position(message);
                    return true;
                case 'current_flaw':
                    this.solvers.get(message.solver_id)!.set_current_flaw(message);
                    return true;
                case 'resolver_created':
                    this.solvers.get(message.solver_id)!.create_resolver(message);
                    return true;
                case 'resolver_state_changed':
                    this.solvers.get(message.solver_id)!.set_resolver_state(message);
                    return true;
                case 'current_resolver':
                    this.solvers.get(message.solver_id)!.set_current_resolver(message);
                    return true;
                case 'causal_link_added':
                    this.solvers.get(message.solver_id)!.add_causal_link(message);
                    return true;
                case 'solver_execution_state_changed':
                    this.solvers.get(message.id)!.set_execution_state(message);
                    return true;
                case 'tick':
                    this.solvers.get(message.id)!.tick(message);
                    return true;
                case 'starting':
                    this.solvers.get(message.id)!.starting(message);
                    return true;
                case 'ending':
                    this.solvers.get(message.id)!.ending(message);
                    return true;
                case 'start':
                    this.solvers.get(message.id)!.start(message);
                    return true;
                case 'end':
                    this.solvers.get(message.id)!.end(message);
                    return true;
                default:
                    return false;
            }
        }

        set_types(types_message: any): void {
            this.types.clear();
            for (const type_message of types_message.types)
                this.types.set(type_message.id, new taxonomy.Type(type_message.id, type_message.name, type_message.description));
            for (const type_message of types_message.types) {
                const type = this.types.get(type_message.id)!;
                if (type_message.parents)
                    for (const parent_id of type_message.parents)
                        type.parents.set(parent_id, this.types.get(parent_id)!);
                if (type_message.static_properties)
                    for (const [prop_name, prop_type] of Object.entries(type_message.static_properties))
                        type.static_properties.set(prop_name, taxonomy.create_property(this, prop_name, prop_type));
                if (type_message.dynamic_properties)
                    for (const [prop_name, prop_type] of Object.entries(type_message.dynamic_properties))
                        type.dynamic_properties.set(prop_name, taxonomy.create_property(this, prop_name, prop_type));
            }
            this.listeners.forEach(listener => listener.types(Array.from(this.types.values())));
        }

        add_type(created_type_message: any): void {
            const new_type = created_type_message.new_type;
            const parents = new Map<string, taxonomy.Type>();
            if (new_type.parents)
                for (const parent_id of new_type.parents) {
                    const parent = this.types.get(parent_id)!;
                    parents.set(parent.id, parent);
                }
            const static_properties = new Map<string, taxonomy.Property>();
            if (new_type.static_properties)
                for (const [prop_name, prop_type] of Object.entries(new_type.static_properties))
                    static_properties.set(prop_name, taxonomy.create_property(this, prop_name, prop_type));
            const dynamic_properties = new Map<string, taxonomy.Property>();
            if (new_type.dynamic_properties)
                for (const [prop_name, prop_type] of Object.entries(new_type.dynamic_properties))
                    dynamic_properties.set(prop_name, taxonomy.create_property(this, prop_name, prop_type));
            const type = new taxonomy.Type(new_type.id, new_type.name, new_type.description, parents, static_properties, dynamic_properties);
            this.types.set(type.id, type);
            this.listeners.forEach(listener => listener.type_added(type));
        }

        update_type(updated_type_message: any): void {
            const updated_type = updated_type_message.updated_type;
            const type = this.types.get(updated_type.id)!;
            if (updated_type.name)
                type.name = updated_type.name;
            if (updated_type.description)
                type.description = updated_type.description;
            if (updated_type.parents) {
                const parents = new Map<string, taxonomy.Type>();
                for (const parent_id of updated_type.parents)
                    parents.set(parent_id, this.types.get(parent_id)!);
                type.parents = parents;
            }
            if (updated_type.static_properties) {
                const static_properties = new Map<string, taxonomy.Property>();
                for (const [prop_name, prop_type] of Object.entries(updated_type.dynamic_properties))
                    static_properties.set(prop_name, taxonomy.create_property(this, prop_name, prop_type));
                type.static_properties = static_properties;
            }
            if (updated_type.dynamic_properties) {
                const dynamic_properties = new Map<string, taxonomy.Property>();
                for (const [prop_name, prop_type] of Object.entries(updated_type.dynamic_properties))
                    dynamic_properties.set(prop_name, taxonomy.create_property(this, prop_name, prop_type));
                type.dynamic_properties = dynamic_properties;
            }
            this.listeners.forEach(listener => listener.type_updated(type));
        }

        remove_type(removed_type_message: any): void {
            const removed_type_id = removed_type_message.id;
            if (!this.types.delete(removed_type_id))
                console.error(`Type ${removed_type_id} not found`);
            this.listeners.forEach(listener => listener.type_removed(removed_type_id));
        }

        set_items(items_message: any): void {
            const items = items_message.items;
            this.items.clear();
            for (const item_message of items) {
                const type = this.types.get(item_message.type)!;
                const item = new taxonomy.Item(item_message.id, type, item_message.name, item_message.description, item_message.properties);
                this.items.set(item.id, item);
            }
            for (const item of this.items.values()) {
                const props = static_properties(item.type);
                for (const [name, prop] of props)
                    if (item.properties[name] && prop instanceof taxonomy.ItemProperty)
                        item.properties[name] = this.items.get(item.properties[name] as string);
            }
            this.listeners.forEach(listener => listener.items(Array.from(this.items.values())));
        }

        add_item(created_item_message: any): void {
            const new_item = created_item_message.new_item;
            const type = this.types.get(new_item.type)!;
            const item = new taxonomy.Item(new_item.id, type, new_item.name, new_item.description, new_item.properties);
            const props = static_properties(item.type);
            for (const [name, prop] of props)
                if (item.properties[name] && prop instanceof taxonomy.ItemProperty)
                    item.properties[name] = this.items.get(item.properties[name] as string);
            this.items.set(item.id, item);
            this.listeners.forEach(listener => listener.item_added(item));
        }

        update_item(updated_item_message: any): void {
            const updated_item = updated_item_message.updated_item;
            const item = this.items.get(updated_item.id)!;
            if (updated_item.name)
                item.name = updated_item.name;
            if (updated_item.description)
                item.description = updated_item.description;
            if (updated_item.properties)
                item.properties = updated_item.properties;
            this.listeners.forEach(listener => listener.item_updated(item));
        }

        remove_item(removed_item_message: any): void {
            const removed_item_id = removed_item_message.id;
            if (!this.items.delete(removed_item_id))
                console.error(`Item ${removed_item_id} not found`);
            this.listeners.forEach(listener => listener.item_removed(removed_item_id));
        }

        set_data(item: taxonomy.Item, data_message: any): void {
            const data: taxonomy.Data[] = [];
            const dynamic_props = dynamic_properties(item.type);
            for (const i in data_message) {
                for (const [k, v] of Object.entries(data_message[i].data))
                    if (dynamic_props.get(k) instanceof taxonomy.ItemProperty)
                        data_message[i].data[k] = this.items.get(v as string);
                const timestamp = new Date(data_message[i].timestamp);
                if (data.length > 0 && timestamp.getTime() == data[data.length - 1].timestamp.getTime())
                    data[data.length - 1].data = { ...data[data.length - 1].data, ...data_message[i].data };
                else
                    data.push(new taxonomy.Data(timestamp, data_message[i].data));
            }
            item.set_values(data);
        }

        add_data(new_data_message: any): void {
            const item = this.items.get(new_data_message.item_id)!;
            const dynamic_props = dynamic_properties(item.type);
            for (const [k, v] of Object.entries(new_data_message.data))
                if (dynamic_props.get(k) instanceof taxonomy.ItemProperty)
                    new_data_message.data[k] = this.items.get(v as string);
            const timestamp = new Date(new_data_message.timestamp);
            if (item.values.length > 0 && timestamp.getTime() == item.values[item.values.length - 1].timestamp.getTime())
                item.values[item.values.length - 1].data = { ...item.values[item.values.length - 1].data, ...new_data_message.data };
            else
                item.add_value(new taxonomy.Data(timestamp, new_data_message.data));
        }

        set_reactive_rules(reactive_rules_message: any): void {
            const reactive_rules = reactive_rules_message.rules;
            this.reactive_rules.clear();
            for (const reactive_rule_message of reactive_rules) {
                const reactive_rule = new rule.ReactiveRule(reactive_rule_message.id, reactive_rule_message.name, reactive_rule_message.content);
                this.reactive_rules.set(reactive_rule.id, reactive_rule);
            }
            this.listeners.forEach(listener => listener.reactive_rules(Array.from(this.reactive_rules.values())));
        }

        add_reactive_rule(created_reactive_rule_message: any): void {
            const reactive_rule = new rule.ReactiveRule(created_reactive_rule_message.id, created_reactive_rule_message.name, created_reactive_rule_message.content);
            this.reactive_rules.set(reactive_rule.id, reactive_rule);
            this.listeners.forEach(listener => listener.reactive_rule_added(reactive_rule));
        }

        update_reactive_rule(updated_reactive_rule_message: any): void {
            const update_reactive_rule = updated_reactive_rule_message.updated_reactive_rule;
            const reactive_rule = this.reactive_rules.get(update_reactive_rule.id)!;
            if (update_reactive_rule.name)
                reactive_rule.name = update_reactive_rule.name;
            if (update_reactive_rule.content)
                reactive_rule.content = update_reactive_rule.content;
            this.listeners.forEach(listener => listener.reactive_rule_updated(reactive_rule));
        }

        remove_reactive_rule(removed_reactive_rule_message: any): void {
            const removed_reactive_rule_id = removed_reactive_rule_message.id;
            const reactive_rule = this.reactive_rules.get(removed_reactive_rule_id)!;
            this.reactive_rules.delete(removed_reactive_rule_id);
            this.listeners.forEach(listener => listener.reactive_rule_removed(reactive_rule.id));
        }

        set_deliberative_rules(deliberative_rules_message: any): void {
            const deliberative_rules = deliberative_rules_message.rules;
            this.deliberative_rules.clear();
            for (const deliberative_rule_message of deliberative_rules) {
                const deliberative_rule = new rule.DeliberativeRule(deliberative_rule_message.id, deliberative_rule_message.name, deliberative_rule_message.content);
                this.deliberative_rules.set(deliberative_rule.id, deliberative_rule);
            }
            this.listeners.forEach(listener => listener.deliberative_rules(Array.from(this.deliberative_rules.values())));
        }

        add_deliberative_rule(created_deliberative_rule_message: any): void {
            const deliberative_rule = new rule.DeliberativeRule(created_deliberative_rule_message.id, created_deliberative_rule_message.name, created_deliberative_rule_message.content);
            this.deliberative_rules.set(deliberative_rule.id, deliberative_rule);
            this.listeners.forEach(listener => listener.deliberative_rule_added(deliberative_rule));
        }

        update_deliberative_rule(updated_deliberative_rule_message: any): void {
            const update_deliberative_rule = updated_deliberative_rule_message.updated_deliberative_rule;
            const deliberative_rule = this.deliberative_rules.get(update_deliberative_rule.id)!;
            if (update_deliberative_rule.name)
                deliberative_rule.name = update_deliberative_rule.name;
            if (update_deliberative_rule.content)
                deliberative_rule.content = update_deliberative_rule.content;
            this.listeners.forEach(listener => listener.deliberative_rule_updated(deliberative_rule));
        }

        remove_deliberative_rule(removed_deliberative_rule_message: any): void {
            const removed_deliberative_rule_id = removed_deliberative_rule_message.id;
            const deliberative_rule = this.deliberative_rules.get(removed_deliberative_rule_id)!;
            this.deliberative_rules.delete(removed_deliberative_rule_id);
            this.listeners.forEach(listener => listener.deliberative_rule_removed(deliberative_rule.id));
        }

        set_solvers(solvers_message: any): void {
            this.solvers.clear();
            for (const solver_message of solvers_message) {
                const slv = new solver.Solver(solver_message.id, solver_message.name, solver.State[solver_message.state as keyof typeof solver.State]);
                this.solvers.set(slv.id, slv);
            }
            this.listeners.forEach(listener => listener.solvers(Array.from(this.solvers.values())));
        }

        add_solver(created_solver_message: any): void {
            const slv = new solver.Solver(created_solver_message.id, created_solver_message.name, solver.State[created_solver_message.state as keyof typeof solver.State]);
            this.solvers.set(slv.id, slv);
            this.listeners.forEach(listener => listener.solver_added(slv));
        }

        remove_solver(removed_solver_message: any): void {
            const removed_solver_id = removed_solver_message.id;
            if (!this.solvers.delete(removed_solver_id))
                console.error(`Solver ${removed_solver_id} not found`);
            this.listeners.forEach(listener => listener.solver_removed(removed_solver_id));
        }

        add_listener(listener: StateListener): void {
            this.listeners.add(listener);
            listener.types(Array.from(this.types.values()));
            listener.items(Array.from(this.items.values()));
            listener.reactive_rules(Array.from(this.reactive_rules.values()));
            listener.deliberative_rules(Array.from(this.deliberative_rules.values()));
            listener.solvers(Array.from(this.solvers.values()));
        }

        remove_listener(listener: StateListener): void {
            this.listeners.delete(listener);
        }
    }
}