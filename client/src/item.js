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

    /**
     * Updates the type.
     * 
     * @param {string} name - The name of the type.
     * @param {string} description - The description of the type.
     * @param {Array} static_parameters - The static parameters of the type.
     * @param {Array} dynamic_parameters - The dynamic parameters of the type.
     */
    update(name, description, static_parameters, dynamic_parameters) {
        this.name = name;
        this.description = description;
        this.static_parameters = static_parameters;
        this.dynamic_parameters = dynamic_parameters;
    }
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
        this.values_listeners = new Set();
        this.value_listeners = new Set();
    }

    /**
     * Updates the item.
     * 
     * @param {string} name - The name of the item.
     * @param {string} type - The type of the item.
     * @param {string} description - The description of the item.
     * @param {Object} parameters - The parameters of the item.
     */
    update(name, type, description, parameters) {
        this.name = name;
        this.type = type;
        this.description = description;
        this.parameters = parameters;
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
        this.values_listeners.forEach(l => l(values, timestamps));
    }

    /**
     * Adds a value and timestamp to the item.
     * 
     * @param {*} value - The value to add.
     * @param {number} [timestamp=new Date().getTime()] - The timestamp of the value (optional).
     */
    add_value(value, timestamp = new Date().getTime()) {
        this.lastValue = value;
        this.lastUpdate = timestamp;
        this.values.push(value);
        this.valueTimestamps.push(timestamp);
        this.value_listeners.forEach(l => l(value, timestamp));
    }

    /**
     * Adds a listener for values changes.
     * 
     * @param {Function} callback - The callback function to be called when values change.
     */
    add_values_listener(callback) {
        this.values_listeners.add(callback);
        callback(this.values, this.valueTimestamps);
    }

    /**
     * Removes a listener for values changes.
     * 
     * @param {Function} callback - The callback function to be removed.
     */
    remove_values_listener(callback) { this.values_listeners.delete(callback); }

    /**
     * Adds a listener for value changes.
     * 
     * @param {Function} callback - The callback function to be called when a value changes.
     */
    add_value_listener(callback) { this.value_listeners.add(callback); }

    /**
     * Removes a listener for value changes.
     * 
     * @param {Function} callback - The callback function to be removed.
     */
    remove_value_listener(callback) { this.value_listeners.delete(callback); }
}

function get_parameter_type(par) {
    switch (par.type) {
        case 'int':
            return new IntegerParameter(par.name, par.min === undefined ? -Infinity : par.min, par.max === undefined ? Infinity : par.max, par.default_value);
        case 'real':
            return new RealParameter(par.name, par.min === undefined ? -Infinity : par.min, par.max === undefined ? Infinity : par.max, par.default_value);
        case 'bool':
            return new BooleanParameter(par.name, par.default_value);
        case 'symbol':
            return new SymbolParameter(par.name, par.symbols, par.multiple, par.default_value);
        case 'string':
            return new StringParameter(par.name, par.default_value);
        case 'array':
            return new ArrayParameter(par.name, get_parameter_type(par.array_type), par.shape, par.default_value);
        case 'geometry':
            return new GeometryParameter(par.name, par.default_value);
        default:
            throw 'Unknown parameter type: ' + par;
    }
}

function get_parameters(pars) {
    let par_map = new Map();
    pars.forEach(par => par_map.set(par.name, get_parameter_type(par)));
    return par_map;
}

/**
 * Retrieves a map of types based on the provided array of types.
 *
 * @param {Array} types - The array of types to be processed.
 * @returns {Map} - A map of types, where the type ID is the key and the Type object is the value.
 */
export function get_types(types) {
    let type_map = new Map();
    types.forEach(type => type_map.set(type.id, new Type(type.id, type.name, type.description, get_parameters(type.static_parameters), get_parameters(type.dynamic_parameters))));
    return type_map;
}

/**
 * Creates a map of items based on the provided items array and types map.
 *
 * @param {Array} items - The array of items.
 * @param {Map} types - The map of item types.
 * @returns {Map} - A map of items with item IDs as keys and Item objects as values.
 */
export function get_items(items, types) {
    let item_map = new Map();
    items.forEach(item => item_map.set(item.id, new Item(item.id, item.name, types.get(item.type), item.description, item.parameters)));
    return item_map;
}