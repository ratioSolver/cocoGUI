import { Type, IntegerParameter, RealParameter, BooleanParameter, SymbolParameter, StringParameter, ArrayParameter, GeometryParameter } from '@/type';
import { Solver } from '@/solver';

export class KnowledgeListener {

    constructor() {
    }

    types(types) { }
    type_added(type) { }
    type_updated(type) { }
    type_removed(id) { }

    items(items) { }
    item_added(item) { }
    item_updated(item) { }
    item_removed(id) { }

    reactive_rules(rules) { }
    reactive_rule_added(rule) { }
    reactive_rule_updated(rule) { }
    reactive_rule_removed(id) { }

    deliberative_rules(rules) { }
    deliberative_rule_added(rule) { }
    deliberative_rule_updated(rule) { }
    deliberative_rule_removed(id) { }

    solvers(solvers) { }
    solver_added(solver) { }
    solver_removed(id) { }
}

export class Knowledge {

    constructor(name) {
        this.name = name;

        this.types = new Map();
        this.items = new Map();
        this.reactive_rules = new Map();
        this.deliberative_rules = new Map();

        this.solvers = new Map();

        this.listeners = new Set();
    }

    update(message) {
        switch (message.type) {
            case 'types':
                this.set_types(message.types);
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
            case 'new_solver':
                this.add_solver(message);
                return true;
            case 'deleted_solver':
                this.remove_solver(message.id);
                return true;
            case 'solver_state':
                this.solvers.get(data.id).set_state(data);
                return true;
            case 'solver_graph':
                this.solvers.get(data.id).set_graph(data);
                return true;
            case 'flaw_created':
                this.solvers.get(data.solver_id).flaw_created(data);
                return true;
            case 'flaw_state_changed':
                this.solvers.get(data.solver_id).flaw_state_changed(data);
                return true;
            case 'flaw_cost_changed':
                this.solvers.get(data.solver_id).flaw_cost_changed(data);
                return true;
            case 'flaw_position_changed':
                this.solvers.get(data.solver_id).flaw_position_changed(data);
                return true;
            case 'current_flaw':
                this.solvers.get(data.solver_id).current_flaw_changed(data);
                return true;
            case 'resolver_created':
                this.solvers.get(data.solver_id).resolver_created(data);
                return true;
            case 'resolver_state_changed':
                this.solvers.get(data.solver_id).resolver_state_changed(data);
                return true;
            case 'current_resolver':
                this.solvers.get(data.solver_id).current_resolver_changed(data);
                return true;
            case 'causal_link_added':
                this.solvers.get(data.solver_id).causal_link_added(data);
                return true;
            case 'solver_execution_state_changed':
                this.solvers.get(data.id).set_execution_state(data);
                return true;
            case 'tick':
                this.solvers.get(data.id).tick(data);
                return true;
            case 'starting':
                this.solvers.get(data.id).starting(data);
                return true;
            case 'ending':
                this.solvers.get(data.id).ending(data);
                return true;
            case 'start':
                this.solvers.get(data.id).start(data);
                return true;
            case 'end':
                this.solvers.get(data.id).end(data);
                return true;
            default:
                return false;
        }
    }

    set_types(types_message) {
        this.types.clear();
        types_message.forEach(type_message => this.types.set(type_message.id, new Type(type_message.id, type_message.name, type_message.description, json_to_par_types(type_message.static_parameters), json_to_par_types(type_message.dynamic_parameters))));

        this.listeners.forEach(listener => listener.types(this.types));
    }

    add_type(created_type_message) {
        const type = new Type(created_type_message.id, created_type_message.name, created_type_message.description, json_to_par_types(created_type_message.static_parameters), json_to_par_types(created_type_message.dynamic_parameters));
        this.types.set(type.id, type);
        this.listeners.forEach(listener => listener.type_added(type));
    }

    update_type(updated_type_message) {
        if (updated_type_message.name !== undefined)
            this.types.get(updated_type_message.id).name = updated_type_message.name;
        if (updated_type_message.description !== undefined)
            this.types.get(updated_type_message.id).description = updated_type_message.description;
        if (updated_type_message.static_parameters !== undefined)
            this.types.get(updated_type_message.id).static_parameters = json_to_par_types(updated_type_message.static_parameters);
        if (updated_type_message.dynamic_parameters !== undefined)
            this.types.get(updated_type_message.id).dynamic_parameters = json_to_par_types(updated_type_message.dynamic_parameters);
        this.listeners.forEach(listener => listener.type_updated(this.types.get(updated_type_message.id)));
    }

    remove_type(removed_type_message) {
        this.types.delete(removed_type_message.id);
        this.listeners.forEach(listener => listener.type_removed(removed_type_message.id));
    }

    set_items(items_message) {
        this.items.clear();
        items_message.forEach(item_message => this.items.set(item_message.id, new Item(item_message.id, item_message.name, this.types.get(item_message.type), item_message.description, json_to_par_types(item_message.parameters))));

        this.listeners.forEach(listener => listener.items(this.items));
    }

    add_item(created_item_message) {
        const item = new Item(created_item_message.id, created_item_message.name, this.types.get(created_item_message.type), created_item_message.description, json_to_par_types(created_item_message.parameters));
        this.items.set(item.id, item);
        this.listeners.forEach(listener => listener.item_added(item));
    }

    update_item(updated_item_message) {
        if (updated_item_message.name !== undefined)
            this.items.get(updated_item_message.id).name = updated_item_message.name;
        if (updated_item_message.type !== undefined)
            this.items.get(updated_item_message.id).type = this.types.get(updated_item_message.type);
        if (updated_item_message.description !== undefined)
            this.items.get(updated_item_message.id).description = updated_item_message.description;
        if (updated_item_message.parameters !== undefined)
            this.items.get(updated_item_message.id).parameters = json_to_par_types(updated_item_message.parameters);
        this.listeners.forEach(listener => listener.item_updated(this.items.get(updated_item_message.id)));
    }

    remove_item(removed_item_message) {
        this.items.delete(removed_item_message.id);
        this.listeners.forEach(listener => listener.item_removed(removed_item_message.id));
    }

    set_reactive_rules(reactive_rules_message) {
        this.reactive_rules.clear();
        reactive_rules_message.forEach(rule_message => this.reactive_rules.set(rule_message.id, new Rule(rule_message.id, rule_message.name, rule_message.content)));

        this.listeners.forEach(listener => listener.reactive_rules(this.reactive_rules));
    }

    add_reactive_rule(created_reactive_rule_message) {
        const rule = new Rule(created_reactive_rule_message.id, created_reactive_rule_message.name, created_reactive_rule_message.content);
        this.reactive_rules.set(rule.id, rule);
        this.listeners.forEach(listener => listener.reactive_rule_added(rule));
    }

    update_reactive_rule(updated_reactive_rule_message) {
        if (updated_reactive_rule_message.name !== undefined)
            this.reactive_rules.get(updated_reactive_rule_message.id).name = updated_reactive_rule_message.name;
        if (updated_reactive_rule_message.content !== undefined)
            this.reactive_rules.get(updated_reactive_rule_message.id).content = updated_reactive_rule_message.content;
        this.listeners.forEach(listener => listener.reactive_rule_updated(this.reactive_rules.get(updated_reactive_rule_message.id)));
    }

    remove_reactive_rule(removed_reactive_rule_message) {
        this.reactive_rules.delete(removed_reactive_rule_message.id);
        this.listeners.forEach(listener => listener.reactive_rule_removed(removed_reactive_rule_message.id));
    }

    set_deliberative_rules(deliberative_rules_message) {
        this.deliberative_rules.clear();
        deliberative_rules_message.forEach(rule_message => this.deliberative_rules.set(rule_message.id, new Rule(rule_message.id, rule_message.name, rule_message.content)));

        this.listeners.forEach(listener => listener.deliberative_rules(this.deliberative_rules));
    }

    add_deliberative_rule(created_deliberative_rule_message) {
        const rule = new Rule(created_deliberative_rule_message.id, created_deliberative_rule_message.name, created_deliberative_rule_message.content);
        this.deliberative_rules.set(rule.id, rule);
        this.listeners.forEach(listener => listener.deliberative_rule_added(rule));
    }

    update_deliberative_rule(updated_deliberative_rule_message) {
        if (updated_deliberative_rule_message.name !== undefined)
            this.deliberative_rules.get(updated_deliberative_rule_message.id).name = updated_deliberative_rule_message.name;
        if (updated_deliberative_rule_message.content !== undefined)
            this.deliberative_rules.get(updated_deliberative_rule_message.id).content = updated_deliberative_rule_message.content;
        this.listeners.forEach(listener => listener.deliberative_rule_updated(this.deliberative_rules.get(updated_deliberative_rule_message.id)));
    }

    remove_deliberative_rule(removed_deliberative_rule_message) {
        this.deliberative_rules.delete(removed_deliberative_rule_message.id);
        this.listeners.forEach(listener => listener.deliberative_rule_removed(removed_deliberative_rule_message.id));
    }

    set_solvers(solvers_message) {
        this.solvers.clear();
        solvers_message.forEach(solver_message => this.solvers.set(solver_message.id, new Solver(solver_message.id, solver_message.name, solver_message.state)));

        this.listeners.forEach(listener => listener.solvers(this.solvers));
    }

    add_solver(created_solver_message) {
        const solver = new Solver(created_solver_message.id, created_solver_message.name, created_solver_message.state);
        this.solvers.set(solver.id, solver);
        this.listeners.forEach(listener => listener.solver_added(solver));
    }

    remove_solver(removed_solver_message) {
        this.solvers.delete(removed_solver_message.id);
        this.listeners.forEach(listener => listener.solver_removed(removed_solver_message.id));
    }
}

/**
 * Represents a deliberative or a reactive rule.
 * @class
 */
export class Rule {

    /**
     * Creates a new instance of the Rule class.
     * @constructor
     * @param {number} id - The ID of the rule.
     * @param {string} name - The name of the rule.
     * @param {string} content - The content of the rule.
     */
    constructor(id, name, content) {
        this.id = id;
        this.name = name;
        this.content = content;
    }
}

function json_to_par_types(j_pars) {
    let par_map = new Map();
    j_pars.forEach(par => par_map.set(par.name, json_to_par_type(par)));
    return par_map;
}

function json_to_par_type(j_par) {
    switch (j_par.type) {
        case 'int':
            return new IntegerParameter(j_par.name, j_par.min === undefined ? -Infinity : j_par.min, j_par.max === undefined ? Infinity : j_par.max, j_par.default_value);
        case 'real':
            return new RealParameter(j_par.name, j_par.min === undefined ? -Infinity : j_par.min, j_par.max === undefined ? Infinity : j_par.max, j_par.default_value);
        case 'bool':
            return new BooleanParameter(j_par.name, j_par.default_value);
        case 'symbol':
            return new SymbolParameter(j_par.name, j_par.symbols, j_par.multiple, j_par.default_value);
        case 'string':
            return new StringParameter(j_par.name, j_par.default_value);
        case 'array':
            return new ArrayParameter(j_par.name, get_parameter_type(j_par.array_type), j_par.shape, j_par.default_value);
        case 'geometry':
            return new GeometryParameter(j_par.name, j_par.default_value);
        default:
            throw 'Unknown parameter type: ' + j_par;
    }
}
