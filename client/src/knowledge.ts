import { coco } from "./type";
import { Solver, SolverState } from "./solver";

export class KnowledgeListener {

    constructor() {
    }

    taxonomy(types: coco.Type[]) { }
    type_added(type: coco.Type) { }
    type_updated(type: coco.Type) { }
    type_removed(id: string) { }

    items(items: coco.Item[]) { }
    item_added(item: coco.Item) { }
    item_updated(item: coco.Item) { }
    item_removed(id: string) { }

    reactive_rules(rules: Rule[]) { }
    reactive_rule_added(rule: Rule) { }
    reactive_rule_updated(rule: Rule) { }
    reactive_rule_removed(id: string) { }

    deliberative_rules(rules: Rule[]) { }
    deliberative_rule_added(rule: Rule) { }
    deliberative_rule_updated(rule: Rule) { }
    deliberative_rule_removed(id: string) { }

    solvers(solvers: Solver[]) { }
    solver_added(solver: Solver) { }
    solver_removed(id: string) { }
}

/**
 * Represents a deliberative or a reactive rule.
 */
export class Rule {

    id: string;
    name: string;
    content: string;

    /**
     * Creates a new Rule instance.
     *
     * @param id The ID of the rule.
     * @param name The name of the rule.
     * @param content The content of the rule.
     */
    constructor(id: string, name: string, content: string) {
        this.id = id;
        this.name = name;
        this.content = content;
    }
}

/**
 * Represents the CoCo knowledge base.
 */
export class Knowledge {

    name: string;
    types: Map<string, coco.Type>;
    items: Map<string, coco.Item>;
    reactive_rules: Map<string, Rule>;
    deliberative_rules: Map<string, Rule>;
    solvers: Map<string, Solver>;
    listeners: Set<KnowledgeListener>;

    /**
     * Creates a new Knowledge instance.
     *
     * @param name The name of the knowledge base.
     */
    constructor(name: string) {
        this.name = name;
        this.types = new Map();
        this.items = new Map();
        this.reactive_rules = new Map();
        this.deliberative_rules = new Map();
        this.solvers = new Map();
        this.listeners = new Set();
    }

    update_knowledge(message: any): boolean {
        switch (message.type) {
            case 'taxonomy':
                this.set_taxonomy(message);
                return true;
            case 'new_type':
                this.add_type(message);
                return true;
            case 'updated_type':
                this.update_type(message);
                return true;
            case 'deleted_type':
                this.remove_type(message.id);
                return true;
            case 'items':
                this.set_items(message.items);
                return true;
            case 'new_item':
                this.add_item(message);
                return true;
            case 'updated_item':
                this.update_item(message);
                return true;
            case 'deleted_item':
                this.remove_item(message.id);
                return true;
            case 'reactive_rules':
                this.set_reactive_rules(message.rules);
                return true;
            case 'new_reactive_rule':
                this.add_reactive_rule(message);
                return true;
            case 'updated_reactive_rule':
                this.update_reactive_rule(message);
                return true;
            case 'deleted_reactive_rule':
                this.remove_reactive_rule(message.id);
                return true;
            case 'deliberative_rules':
                this.set_deliberative_rules(message.rules);
                return true;
            case 'new_deliberative_rule':
                this.add_deliberative_rule(message);
                return true;
            case 'updated_deliberative_rule':
                this.update_deliberative_rule(message);
                return true;
            case 'deleted_deliberative_rule':
                this.remove_deliberative_rule(message.id);
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
                this.remove_solver(message.id);
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

    set_taxonomy(taxonomy_message: any): void {
        this.types.clear();
        for (let type_message of taxonomy_message.types) {
            const static_parameters = type_message.static_parameters.map((parameter_message: any) => coco.get_parameter(parameter_message));
            const dynamic_parameters = type_message.dynamic_parameters.map((parameter_message: any) => coco.get_parameter(parameter_message));
            const type = new coco.Type(type_message.id, type_message.name, type_message.description, static_parameters, dynamic_parameters);
            this.types.set(type.id, type);
        }
        this.listeners.forEach(listener => listener.taxonomy(Array.from(this.types.values())));
    }

    add_type(created_type_message: any): void {
        const static_parameters = created_type_message.static_parameters.map((parameter_message: any) => coco.get_parameter(parameter_message));
        const dynamic_parameters = created_type_message.dynamic_parameters.map((parameter_message: any) => coco.get_parameter(parameter_message));
        const type = new coco.Type(created_type_message.id, created_type_message.name, created_type_message.description, static_parameters, dynamic_parameters);
        this.types.set(type.id, type);
        this.listeners.forEach(listener => listener.type_added(type));
    }

    update_type(updated_type_message: any): void {
        const type = this.types.get(updated_type_message.id)!;
        if (updated_type_message.name)
            type.name = updated_type_message.name;
        if (updated_type_message.description)
            type.description = updated_type_message.description;
        if (updated_type_message.static_parameters)
            type.static_parameters = updated_type_message.static_parameters.map((parameter_message: any) => coco.get_parameter(parameter_message));
        if (updated_type_message.dynamic_parameters)
            type.dynamic_parameters = updated_type_message.dynamic_parameters.map((parameter_message: any) => coco.get_parameter(parameter_message));
        this.listeners.forEach(listener => listener.type_updated(type));
    }

    remove_type(removed_type_id: string): void {
        const type = this.types.get(removed_type_id)!;
        this.types.delete(removed_type_id);
        this.listeners.forEach(listener => listener.type_removed(type.id));
    }

    set_items(items_message: any): void {
        this.items.clear();
        for (let item_message of items_message) {
            const type = this.types.get(item_message.type)!;
            const item = new coco.Item(item_message.id, type, item_message.name, item_message.description, item_message.parameters);
            this.items.set(item.id, item);
        }
        this.listeners.forEach(listener => listener.items(Array.from(this.items.values())));
    }

    add_item(created_item_message: any): void {
        const type = this.types.get(created_item_message.type)!;
        const item = new coco.Item(created_item_message.id, type, created_item_message.name, created_item_message.description, created_item_message.parameters);
        this.items.set(item.id, item);
        this.listeners.forEach(listener => listener.item_added(item));
    }

    update_item(updated_item_message: any): void {
        const item = this.items.get(updated_item_message.id)!;
        if (updated_item_message.name)
            item.name = updated_item_message.name;
        if (updated_item_message.description)
            item.description = updated_item_message.description;
        if (updated_item_message.parameters)
            item.parameters = updated_item_message.parameters;
        this.listeners.forEach(listener => listener.item_updated(item));
    }

    remove_item(removed_item_id: string): void {
        const item = this.items.get(removed_item_id)!;
        this.items.delete(removed_item_id);
        this.listeners.forEach(listener => listener.item_removed(item.id));
    }

    set_reactive_rules(reactive_rules_message: any): void {
        this.reactive_rules.clear();
        for (let reactive_rule_message of reactive_rules_message) {
            const reactive_rule = new Rule(reactive_rule_message.id, reactive_rule_message.name, reactive_rule_message.content);
            this.reactive_rules.set(reactive_rule.id, reactive_rule);
        }
        this.listeners.forEach(listener => listener.reactive_rules(Array.from(this.reactive_rules.values())));
    }

    add_reactive_rule(created_reactive_rule_message: any): void {
        const reactive_rule = new Rule(created_reactive_rule_message.id, created_reactive_rule_message.name, created_reactive_rule_message.content);
        this.reactive_rules.set(reactive_rule.id, reactive_rule);
        this.listeners.forEach(listener => listener.reactive_rule_added(reactive_rule));
    }

    update_reactive_rule(updated_reactive_rule_message: any): void {
        const reactive_rule = this.reactive_rules.get(updated_reactive_rule_message.id)!;
        if (updated_reactive_rule_message.name)
            reactive_rule.name = updated_reactive_rule_message.name;
        if (updated_reactive_rule_message.content)
            reactive_rule.content = updated_reactive_rule_message.content;
        this.listeners.forEach(listener => listener.reactive_rule_updated(reactive_rule));
    }

    remove_reactive_rule(removed_reactive_rule_id: string): void {
        const reactive_rule = this.reactive_rules.get(removed_reactive_rule_id)!;
        this.reactive_rules.delete(removed_reactive_rule_id);
        this.listeners.forEach(listener => listener.reactive_rule_removed(reactive_rule.id));
    }

    set_deliberative_rules(deliberative_rules_message: any): void {
        this.deliberative_rules.clear();
        for (let deliberative_rule_message of deliberative_rules_message) {
            const deliberative_rule = new Rule(deliberative_rule_message.id, deliberative_rule_message.name, deliberative_rule_message.content);
            this.deliberative_rules.set(deliberative_rule.id, deliberative_rule);
        }
        this.listeners.forEach(listener => listener.deliberative_rules(Array.from(this.deliberative_rules.values())));
    }

    add_deliberative_rule(created_deliberative_rule_message: any): void {
        const deliberative_rule = new Rule(created_deliberative_rule_message.id, created_deliberative_rule_message.name, created_deliberative_rule_message.content);
        this.deliberative_rules.set(deliberative_rule.id, deliberative_rule);
        this.listeners.forEach(listener => listener.deliberative_rule_added(deliberative_rule));
    }

    update_deliberative_rule(updated_deliberative_rule_message: any): void {
        const deliberative_rule = this.deliberative_rules.get(updated_deliberative_rule_message.id)!;
        if (updated_deliberative_rule_message.name)
            deliberative_rule.name = updated_deliberative_rule_message.name;
        if (updated_deliberative_rule_message.content)
            deliberative_rule.content = updated_deliberative_rule_message.content;
        this.listeners.forEach(listener => listener.deliberative_rule_updated(deliberative_rule));
    }

    remove_deliberative_rule(removed_deliberative_rule_id: string): void {
        const deliberative_rule = this.deliberative_rules.get(removed_deliberative_rule_id)!;
        this.deliberative_rules.delete(removed_deliberative_rule_id);
        this.listeners.forEach(listener => listener.deliberative_rule_removed(deliberative_rule.id));
    }

    set_solvers(solvers_message: any): void {
        this.solvers.clear();
        for (let solver_message of solvers_message) {
            const solver = new Solver(solver_message.id, solver_message.name, SolverState[solver_message.state as keyof typeof SolverState]);
            this.solvers.set(solver.id, solver);
        }
        this.listeners.forEach(listener => listener.solvers(Array.from(this.solvers.values())));
    }

    add_solver(created_solver_message: any): void {
        const solver = new Solver(created_solver_message.id, created_solver_message.name, SolverState[created_solver_message.state as keyof typeof SolverState]);
        this.solvers.set(solver.id, solver);
        this.listeners.forEach(listener => listener.solver_added(solver));
    }

    remove_solver(removed_solver_id: string): void {
        const solver = this.solvers.get(removed_solver_id)!;
        this.solvers.delete(removed_solver_id);
        this.listeners.forEach(listener => listener.solver_removed(solver.id));
    }

    add_listener(listener: KnowledgeListener): void {
        this.listeners.add(listener);
        listener.taxonomy(Array.from(this.types.values()));
        listener.items(Array.from(this.items.values()));
        listener.reactive_rules(Array.from(this.reactive_rules.values()));
        listener.deliberative_rules(Array.from(this.deliberative_rules.values()));
        listener.solvers(Array.from(this.solvers.values()));
    }

    remove_listener(listener: KnowledgeListener): void {
        this.listeners.delete(listener);
    }
}