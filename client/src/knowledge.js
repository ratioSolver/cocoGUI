import { Type, IntegerParameter, RealParameter, BooleanParameter, SymbolParameter, StringParameter, ArrayParameter, GeometryParameter, Item } from '@/type';
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

/**
 * Represents the CoCo knowledge base.
 */
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

    /**
     * Sets the types based on the given types_message.
     * 
     * @param {Array} types_message - The array of type messages.
     */
    set_types(types_message) {
        this.types.clear();
        types_message.forEach(type_message => this.types.set(type_message.id, new Type(type_message.id, type_message.name, type_message.description, json_to_par_types(type_message.static_parameters), json_to_par_types(type_message.dynamic_parameters))));

        this.listeners.forEach(listener => listener.types(this.types));
    }

    /**
     * Adds a new type to the knowledge base.
     * 
     * @param {Object} created_type_message - The message containing the details of the created type.
     * @param {string} created_type_message.id - The ID of the created type.
     * @param {string} created_type_message.name - The name of the created type.
     * @param {string} created_type_message.description - The description of the created type.
     * @param {Array} created_type_message.static_parameters - The static parameters of the created type.
     * @param {Array} created_type_message.dynamic_parameters - The dynamic parameters of the created type.
     */
    add_type(created_type_message) {
        const type = new Type(created_type_message.id, created_type_message.name, created_type_message.description, json_to_par_types(created_type_message.static_parameters), json_to_par_types(created_type_message.dynamic_parameters));
        this.types.set(type.id, type);
        this.listeners.forEach(listener => listener.type_added(type));
    }

    /**
     * Updates the type with the provided information.
     * 
     * @param {Object} updated_type_message - The updated type message.
     * @param {string} updated_type_message.id - The ID of the type to update.
     * @param {string} [updated_type_message.name] - The new name for the type.
     * @param {string} [updated_type_message.description] - The new description for the type.
     * @param {Array} [updated_type_message.static_parameters] - The new static parameters for the type.
     * @param {Array} [updated_type_message.dynamic_parameters] - The new dynamic parameters for the type.
     */
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

    /**
     * Removes a type from the knowledge.
     * 
     * @param {Object} removed_type_message - The message containing the information of the type to be removed.
     * @param {string} removed_type_message.id - The ID of the type to be removed.
     */
    remove_type(removed_type_message) {
        this.types.delete(removed_type_message.id);
        this.listeners.forEach(listener => listener.type_removed(removed_type_message.id));
    }

    /**
     * Sets the items based on the provided items message.
     * 
     * @param {Array} items_message - The items message containing information about the items.
     */
    set_items(items_message) {
        this.items.clear();
        items_message.forEach(item_message => this.items.set(item_message.id, new Item(item_message.id, item_message.name, this.types.get(item_message.type), item_message.description, json_to_par_types(item_message.parameters))));

        this.listeners.forEach(listener => listener.items(this.items));
    }

    /**
     * Adds an item to the knowledge base.
     * 
     * @param {Object} created_item_message - The message containing the details of the created item.
     * @param {string} created_item_message.id - The ID of the created item.
     * @param {string} created_item_message.name - The name of the created item.
     * @param {string} created_item_message.type - The type of the created item.
     * @param {string} created_item_message.description - The description of the created item.
     * @param {Array} created_item_message.parameters - The parameters of the created item.
     */
    add_item(created_item_message) {
        const item = new Item(created_item_message.id, created_item_message.name, this.types.get(created_item_message.type), created_item_message.description, json_to_par_types(created_item_message.parameters));
        this.items.set(item.id, item);
        this.listeners.forEach(listener => listener.item_added(item));
    }

    /**
     * Updates an item with the provided information.
     * 
     * @param {Object} updated_item_message - The updated item message.
     * @param {string} updated_item_message.id - The ID of the item to update.
     * @param {string} [updated_item_message.name] - The new name for the item.
     * @param {string} [updated_item_message.type] - The new type for the item.
     * @param {string} [updated_item_message.description] - The new description for the item.
     * @param {Array} [updated_item_message.parameters] - The new parameters for the item.
     */
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

    /**
     * Removes an item from the knowledge.
     * 
     * @param {Object} removed_item_message - The message containing the removed item's ID.
     * @param {string} removed_item_message.id - The ID of the item to be removed.
     */
    remove_item(removed_item_message) {
        this.items.delete(removed_item_message.id);
        this.listeners.forEach(listener => listener.item_removed(removed_item_message.id));
    }

    /**
     * Sets the reactive rules based on the provided reactive rules message.
     * 
     * @param {Array} reactive_rules_message - The message containing the reactive rules.
     */
    set_reactive_rules(reactive_rules_message) {
        this.reactive_rules.clear();
        reactive_rules_message.forEach(rule_message => this.reactive_rules.set(rule_message.id, new Rule(rule_message.id, rule_message.name, rule_message.content)));

        this.listeners.forEach(listener => listener.reactive_rules(this.reactive_rules));
    }

    /**
     * Adds a reactive rule to the knowledge base.
     * 
     * @param {Object} created_reactive_rule_message - The message containing the details of the reactive rule.
     * @param {string} created_reactive_rule_message.id - The ID of the reactive rule.
     * @param {string} created_reactive_rule_message.name - The name of the reactive rule.
     * @param {string} created_reactive_rule_message.content - The content of the reactive rule.
     */
    add_reactive_rule(created_reactive_rule_message) {
        const rule = new Rule(created_reactive_rule_message.id, created_reactive_rule_message.name, created_reactive_rule_message.content);
        this.reactive_rules.set(rule.id, rule);
        this.listeners.forEach(listener => listener.reactive_rule_added(rule));
    }

    /**
     * Updates a reactive rule based on the provided message.
     * 
     * @param {Object} updated_reactive_rule_message - The message containing the updated reactive rule information.
     * @param {string} updated_reactive_rule_message.id - The ID of the reactive rule.
     * @param {string} [updated_reactive_rule_message.name] - The name of the reactive rule.
     * @param {string} [updated_reactive_rule_message.content] - The content of the reactive rule.
     */
    update_reactive_rule(updated_reactive_rule_message) {
        if (updated_reactive_rule_message.name !== undefined)
            this.reactive_rules.get(updated_reactive_rule_message.id).name = updated_reactive_rule_message.name;
        if (updated_reactive_rule_message.content !== undefined)
            this.reactive_rules.get(updated_reactive_rule_message.id).content = updated_reactive_rule_message.content;
        this.listeners.forEach(listener => listener.reactive_rule_updated(this.reactive_rules.get(updated_reactive_rule_message.id)));
    }

    /**
     * Removes a reactive rule from the knowledge.
     *
     * @param {Object} removed_reactive_rule_message - The message containing the removed reactive rule.
     * @param {string} removed_reactive_rule_message.id - The ID of the reactive rule to be removed.
     */
    remove_reactive_rule(removed_reactive_rule_message) {
        this.reactive_rules.delete(removed_reactive_rule_message.id);
        this.listeners.forEach(listener => listener.reactive_rule_removed(removed_reactive_rule_message.id));
    }

    /**
     * Sets the deliberative rules based on the provided message.
     *
     * @param {Array} deliberative_rules_message - The message containing the deliberative rules.
     */
    set_deliberative_rules(deliberative_rules_message) {
        this.deliberative_rules.clear();
        deliberative_rules_message.forEach(rule_message => this.deliberative_rules.set(rule_message.id, new Rule(rule_message.id, rule_message.name, rule_message.content)));

        this.listeners.forEach(listener => listener.deliberative_rules(this.deliberative_rules));
    }

    /**
     * Adds a deliberative rule to the knowledge base.
     * 
     * @param {Object} created_deliberative_rule_message - The message containing the information of the created deliberative rule.
     * @param {string} created_deliberative_rule_message.id - The ID of the deliberative rule.
     * @param {string} created_deliberative_rule_message.name - The name of the deliberative rule.
     * @param {string} created_deliberative_rule_message.content - The content of the deliberative rule.
     */
    add_deliberative_rule(created_deliberative_rule_message) {
        const rule = new Rule(created_deliberative_rule_message.id, created_deliberative_rule_message.name, created_deliberative_rule_message.content);
        this.deliberative_rules.set(rule.id, rule);
        this.listeners.forEach(listener => listener.deliberative_rule_added(rule));
    }

    /**
     * Updates a deliberative rule with the provided information.
     * 
     * @param {Object} updated_deliberative_rule_message - The updated information for the deliberative rule.
     * @param {string} updated_deliberative_rule_message.id - The ID of the deliberative rule.
     * @param {string} [updated_deliberative_rule_message.name] - The name of the deliberative rule.
     * @param {string} [updated_deliberative_rule_message.content] - The content of the deliberative rule.
     */
    update_deliberative_rule(updated_deliberative_rule_message) {
        if (updated_deliberative_rule_message.name !== undefined)
            this.deliberative_rules.get(updated_deliberative_rule_message.id).name = updated_deliberative_rule_message.name;
        if (updated_deliberative_rule_message.content !== undefined)
            this.deliberative_rules.get(updated_deliberative_rule_message.id).content = updated_deliberative_rule_message.content;
        this.listeners.forEach(listener => listener.deliberative_rule_updated(this.deliberative_rules.get(updated_deliberative_rule_message.id)));
    }

    /**
     * Removes a deliberative rule from the knowledge.
     * 
     * @param {Object} removed_deliberative_rule_message - The message containing the information of the rule to be removed.
     * @param {string} removed_deliberative_rule_message.id - The ID of the deliberative rule to be removed.
     */
    remove_deliberative_rule(removed_deliberative_rule_message) {
        this.deliberative_rules.delete(removed_deliberative_rule_message.id);
        this.listeners.forEach(listener => listener.deliberative_rule_removed(removed_deliberative_rule_message.id));
    }

    /**
     * Sets the solvers based on the provided solvers message.
     * 
     * @param {Array} solvers_message - The solvers message containing information about the solvers.
     */
    set_solvers(solvers_message) {
        this.solvers.clear();
        solvers_message.forEach(solver_message => this.solvers.set(solver_message.id, new Solver(solver_message.id, solver_message.name, solver_message.state)));

        this.listeners.forEach(listener => listener.solvers(this.solvers));
    }

    /**
     * Adds a solver to the knowledge base.
     * 
     * @param {Object} created_solver_message - The message containing the details of the created solver.
     * @param {string} created_solver_message.id - The ID of the solver.
     * @param {string} created_solver_message.name - The name of the solver.
     * @param {string} created_solver_message.state - The state of the solver.
     */
    add_solver(created_solver_message) {
        const solver = new Solver(created_solver_message.id, created_solver_message.name, created_solver_message.state);
        this.solvers.set(solver.id, solver);
        this.listeners.forEach(listener => listener.solver_added(solver));
    }

    /**
     * Removes a solver from the knowledge base.
     * 
     * @param {Object} removed_solver_message - The message containing information about the solver to be removed.
     * @param {string} removed_solver_message.id - The ID of the solver to be removed.
     */
    remove_solver(removed_solver_message) {
        this.solvers.delete(removed_solver_message.id);
        this.listeners.forEach(listener => listener.solver_removed(removed_solver_message.id));
    }

    /**
     * Adds a listener to the set of listeners.
     * 
     * @param {KnowledgeListener} listener - The listener function to add.
     */
    add_listener(listener) {
        this.listeners.add(listener);
    }

    /**
     * Removes a listener from the set of listeners.
     *
     * @param {KnowledgeListener} listener - The listener function to remove.
     */
    remove_listener(listener) {
        this.listeners.delete(listener);
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
     * @param {string} id - The ID of the rule.
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
