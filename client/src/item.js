export class Parameter {

    constructor(name, default_value = undefined) { this.name = name; this.default_value = default_value; }
}

export class BooleanParameter extends Parameter {

    constructor(name, default_value = false) { super(name, default_value); }
}

export class IntegerParameter extends Parameter {

    constructor(name, min, max, default_value = min) {
        super(name, default_value);
        this.min = min;
        this.max = max;
    }
}

export class RealParameter extends Parameter {

    constructor(name, min, max, default_value = min) {
        super(name, default_value);
        this.min = min;
        this.max = max;
    }
}

export class StringParameter extends Parameter {

    constructor(name, default_value = "") { super(name, default_value); }
}

export class SymbolParameter extends Parameter {

    constructor(name, symbols, default_value = symbols ? symbols[0] : "") {
        super(name, default_value);
        this.symbols = symbols;
    }
}

export class Type {

    constructor(id, name, description, static_parameters, dynamic_parameters) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.static_parameters = static_parameters;
        this.dynamic_parameters = dynamic_parameters;
    }
}

export class Item {

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

    set_values(values, timestamps) {
        this.values = values;
        this.valueTimestamps = timestamps;
        this.lastValue = values[values.length - 1];
        this.lastUpdate = timestamps[timestamps.length - 1];
        this.values_listeners.forEach(l => l(values, timestamps));
    }

    add_value(value, timestamp = new Date().getTime()) {
        this.lastValue = value;
        this.lastUpdate = timestamp;
        this.values.push(value);
        this.valueTimestamps.push(timestamp);
        this.value_listeners.forEach(l => l(value, timestamp));
    }

    add_values_listener(callback) { this.values_listeners.add(callback); callback(this.values, this.valueTimestamps); }
    add_value_listener(callback) { this.value_listeners.add(callback); }

    remove_values_listener(callback) { this.values_listeners.delete(callback); }
    remove_value_listener(callback) { this.value_listeners.delete(callback); }
}