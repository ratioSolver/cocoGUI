export class SensorType {

    constructor(id, name, description, parameters) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.parameters = parameters;
    }
}

export class Sensor {

    constructor(id, name, type, value, state) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.value = value;
        this.state = state;
        this.data = value ? [{ timestamp: value.timestamp, value: value }] : [];
    }

    set_data(data) {
        this.data = data;
        if (data.length > 0) {
            this.origin = data[0].timestamp;
            this.horizon = data[data.length - 1].timestamp;
            this.value = data[data.length - 1].value;
        } else {
            this.origin = 0;
            this.horizon = 1;
        }
    }

    add_value(value) {
        this.data.push(value);
        this.origin = this.data[0].timestamp;
        this.horizon = value.timestamp;
        this.value = value.value;
    }
}