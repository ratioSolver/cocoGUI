export class KnowledgeListener {

    constructor() {
    }

    knowledge(knowledge) { }

    type_added(type) { }
    type_updated(type) { }
    type_removed(id) { }

    item_added(item) { }
    item_updated(item) { }
    item_removed(id) { }
    item_data(item_id, data) { }

    reactive_rule_added(rule) { }
    reactive_rule_updated(rule) { }
    reactive_rule_removed(id) { }

    deliberative_rule_added(rule) { }
    deliberative_rule_updated(rule) { }
    deliberative_rule_removed(id) { }
}

export class Knowledge {

    constructor(name) {
        this.name = name;

        this.types = new Map();
        this.items = new Map();
        this.reactive_rules = new Map();
        this.deliberative_rules = new Map();

        this.listeners = new Set();
    }

    set_types(types_message) {
        this.types.clear();
        types_message.forEach(type_message => this.types.set(type_message.id, new Type(type_message.id, type_message.name, type_message.description, json_to_par_types(type_message.static_parameters), json_to_par_types(type_message.dynamic_parameters))));

        this.listeners.forEach(listener => listener.knowledge(this));
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

        this.listeners.forEach(listener => listener.knowledge(this));
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

        this.listeners.forEach(listener => listener.knowledge(this));
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

        this.listeners.forEach(listener => listener.knowledge(this));
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
}

/**
 * Represents a parameter.
 */
export class Parameter {
    /**
     * Creates a new Parameter instance.
     * 
     * @param {string} name - The name of the parameter.
     * @param {*} [default_value] - The default value of the parameter (optional).
     */
    constructor(name, default_value = undefined) {
        this.name = name;
        this.default_value = default_value;
    }
}

/**
 * Represents a boolean parameter.
 * @extends Parameter
 */
export class BooleanParameter extends Parameter {
    /**
     * Creates a new BooleanParameter instance.
     * 
     * @param {string} name - The name of the parameter.
     * @param {boolean} [default_value=false] - The default value of the parameter.
     */
    constructor(name, default_value = false) {
        super(name, default_value);
    }
}

/**
 * Represents an integer parameter.
 * @extends Parameter
 */
export class IntegerParameter extends Parameter {

    /**
     * Creates a new IntegerParameter instance.
     * 
     * @param {string} name - The name of the parameter.
     * @param {number} min - The minimum value of the parameter.
     * @param {number} max - The maximum value of the parameter.
     * @param {number} [default_value=min] - The default value of the parameter.
     */
    constructor(name, min, max, default_value = min) {
        super(name, default_value);
        this.min = min;
        this.max = max;
    }
}

/**
 * Represents a real parameter.
 * @extends Parameter
 */
export class RealParameter extends Parameter {

    /**
     * Creates a new instance of the RealParameter class.
     * 
     * @param {string} name - The name of the parameter.
     * @param {number} min - The minimum value of the parameter.
     * @param {number} max - The maximum value of the parameter.
     * @param {number} [default_value=min] - The default value of the parameter.
     */
    constructor(name, min, max, default_value = min) {
        super(name, default_value);
        this.min = min;
        this.max = max;
    }
}

/**
 * Represents a string parameter.
 * @extends Parameter
 */
export class StringParameter extends Parameter {
    /**
     * Creates a new instance of the StringParameter class.
     * 
     * @param {string} name - The name of the parameter.
     * @param {string} [default_value=""] - The default value of the parameter.
     */
    constructor(name, default_value = "") {
        super(name, default_value);
    }
}

/**
 * Represents a symbol parameter.
 * @extends Parameter
 */
export class SymbolParameter extends Parameter {

    /**
     * Creates a new SymbolParameter instance.
     * 
     * @param {string} name - The name of the parameter.
     * @param {Array} symbols - The symbols for the parameter.
     * @param {boolean} [multiple=false] - Whether the parameter can have multiple values.
     * @param {string} [default_value=symbols[0]] - The default value for the parameter.
     */
    constructor(name, symbols, multiple = false, default_value = symbols ? symbols[0] : "") {
        super(name, default_value);
        this.symbols = symbols;
        this.multiple = multiple;
    }
}

function create_default_array(shape, array_type) {
    if (shape.length === 0) return array_type.default_value;
    let array = new Array(shape[0]);
    for (let i = 0; i < shape[0]; i++) array[i] = create_default_array(shape.slice(1), array_type);
    return array;
}

/**
 * Represents an array parameter.
 * @extends Parameter
 */
export class ArrayParameter extends Parameter {

    /**
     * Creates a new ArrayParameter instance.
     * 
     * @param {string} name - The name of the parameter.
     * @param {string} array_type - The type of the elements in the array.
     * @param {Array<number>} shape - The shape of the array.
     * @param {Array<any>} [default_value=create_default_array(shape, array_type)] - The default value of the parameter.
     */
    constructor(name, array_type, shape, default_value = create_default_array(shape, array_type)) {
        super(name, default_value);
        this.array_type = array_type;
        this.shape = shape;
    }
}

/**
 * Represents a geometry parameter.
 * @extends Parameter
 */
export class GeometryParameter extends Parameter {

    /**
     * Creates a new GeometryParameter instance.
     * 
     * @param {string} name - The name of the parameter.
     * @param {string} [default_value=""] - The default value of the parameter.
     */
    constructor(name, default_value = undefined) {
        super(name, default_value);
    }
}

/**
 * Represents a type of item.
 */
export class Type {

    /**
     * Creates a new instance of the Type class.
     * 
     * @param {number} id - The ID of the type.
     * @param {string} name - The name of the type.
     * @param {string} description - The description of the type.
     * @param {Array} static_parameters - The static parameters of the type.
     * @param {Array} dynamic_parameters - The dynamic parameters of the type.
     */
    constructor(id, name, description, static_parameters, dynamic_parameters) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.static_parameters = static_parameters;
        this.dynamic_parameters = dynamic_parameters;
    }
}

export class ItemListener {

    constructor() {
    }

    values(item_id, values, timestamps) { }
    new_value(item_id, value, timestamp) { }
}

/**
 * Represents an item.
 */
export class Item {

    /**
     * Creates a new instance of the Item class.
     * 
     * @param {string} id - The ID of the item.
     * @param {string} name - The name of the item.
     * @param {string} type - The type of the item.
     * @param {string} [description=""] - The description of the item (optional).
     * @param {Object} [parameters={}] - The parameters of the item (optional).
     */
    constructor(id, name, type, description = "", parameters = {}) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.description = description;
        this.parameters = parameters;
        this.lastValue = undefined;
        this.lastUpdate = undefined;
        this.values = [];
        this.valueTimestamps = [];
        this.listeners = new Set();
    }

    /**
     * Sets the values and timestamps of the item.
     * 
     * @param {Array} values - The values of the item.
     * @param {Array} timestamps - The timestamps of the values.
     */
    set_values(values, timestamps) {
        this.values = values;
        this.valueTimestamps = timestamps;
        this.lastValue = values[values.length - 1];
        this.lastUpdate = timestamps[timestamps.length - 1];
        this.listeners.forEach(l => l.values(this.id, values, timestamps));
    }

    /**
     * Adds a value and timestamp to the item.
     * 
     * @param {*} value - The value to add.
     * @param {number} timestamp - The timestamp of the value.
     */
    add_value(value, timestamp) {
        this.values.push(value);
        this.valueTimestamps.push(timestamp);
        this.lastValue = value;
        this.lastUpdate = timestamp;
        this.listeners.forEach(l => l.new_value(this.id, value, timestamp));
    }

    /**
     * Adds a listener to the item.
     * 
     * @param {ItemListener} listener - The listener to add.
     */
    add_listener(listener) {
        this.listeners.add(listener);
        listener.values(this.id, this.values, this.valueTimestamps);
    }

    /**
     * Removes a listener from the item.
     * 
     * @param {ItemListener} listener - The listener to remove.
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
     * @param {number} id - The ID of the rule.
     * @param {string} name - The name of the rule.
     * @param {string} content - The content of the rule.
     */
    constructor(id, name, content) {
        this.id = id;
        this.name = name;
        this.content = content;
    }

    /**
     * Updates the name and content of the rule.
     * @param {string} name - The new name of the rule.
     * @param {string} content - The new content of the rule.
     */
    update(name, content) {
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
