export namespace coco {

    /**
     * Represents a parameter.
     */
    export class ParameterType {

        name: string;
        default_value: any;

        /**
         * Creates a new Parameter instance.
         *
         * @param name The name of the parameter.
         * @param default_value The default value of the parameter.
         */
        constructor(name: string, default_value?: any) {
            this.name = name;
            this.default_value = default_value;
        }
    }

    /**
     * Represents a boolean parameter.
     */
    export class BooleanParameter extends ParameterType {

        /**
         * Creates a new BooleanParameter instance.
         *
         * @param name The name of the parameter.
         * @param default_value The default value of the parameter.
         */
        constructor(name: string, default_value?: boolean) {
            super(name, default_value);
        }
    }

    /**
     * Represents an integer parameter.
     */
    export class IntegerParameter extends ParameterType {

        min: number;
        max: number;

        /**
         * Creates a new IntegerParameter instance.
         *
         * @param name The name of the parameter.
         * @param min The minimum value of the parameter.
         * @param max The maximum value of the parameter.
         * @param default_value The default value of the parameter.
         */
        constructor(name: string, min?: number, max?: number, default_value: number = min || 0) {
            super(name, default_value);
            this.min = min || -Infinity;
            this.max = max || Infinity;
        }
    }

    /**
     * Represents a real parameter.
     */
    export class RealParameter extends ParameterType {

        min: number;
        max: number;

        /**
         * Creates a new RealParameter instance.
         *
         * @param name The name of the parameter.
         * @param min The minimum value of the parameter.
         * @param max The maximum value of the parameter.
         * @param default_value The default value of the parameter.
         */
        constructor(name: string, min?: number, max?: number, default_value: number = min || 0) {
            super(name, default_value);
            this.min = min || -Infinity;
            this.max = max || Infinity;
        }
    }

    /**
     * Represents a string parameter.
     */
    export class StringParameter extends ParameterType {

        /**
         * Creates a new StringParameter instance.
         *
         * @param name The name of the parameter.
         * @param default_value The default value of the parameter.
         */
        constructor(name: string, default_value?: string) {
            super(name, default_value);
        }
    }

    /**
     * Represents a symbol parameter.
     */
    export class SymbolParameter extends ParameterType {

        symbols: string[];
        multiple: boolean;

        /**
         * Creates a new SymbolParameter instance.
         *
         * @param name The name of the parameter.
         * @param symbols The symbols of the parameter.
         * @param multiple Whether the parameter can have multiple values.
         * @param default_value The default value of the parameter.
         */
        constructor(name: string, symbols: string[], multiple: boolean = false, default_value?: string) {
            super(name, default_value);
            this.multiple = multiple;
            this.symbols = symbols;
        }
    }

    function create_default_array(shape: number[], element_type: any): any[] {
        if (shape.length == 1) {
            return new Array(shape[0]).fill(element_type.default_value);
        } else {
            return new Array(shape[0]).fill(null).map(() => create_default_array(shape.slice(1), element_type));
        }
    }

    /**
     * Represents an array parameter.
     */
    export class ArrayParameter extends ParameterType {

        element_type: ParameterType;
        shape: number[];

        /**
         * Creates a new ArrayParameter instance.
         *
         * @param name The name of the parameter.
         * @param element_type The element type of the parameter.
         * @param shape The shape of the parameter.
         * @param default_value The default value of the parameter.
         */
        constructor(name: string, element_type: ParameterType, shape: number[], default_value: any = create_default_array(shape, element_type)) {
            super(name, default_value);
            this.element_type = element_type;
            this.shape = shape;
        }
    }

    /**
     * Represents a geometry parameter.
     */
    export class GeometryParameter extends ParameterType {

        /**
         * Creates a new GeometryParameter instance.
         *
         * @param name The name of the parameter.
         * @param default_value The default value of the parameter.
         */
        constructor(name: string, default_value?: JSON) {
            super(name, default_value);
        }
    }

    export function get_parameter(parameter: any): ParameterType {
        switch (parameter.type) {
            case "boolean":
                return new BooleanParameter(parameter.name, parameter.default_value);
            case "integer":
                return new IntegerParameter(parameter.name, parameter.min, parameter.max, parameter.default_value);
            case "real":
                return new RealParameter(parameter.name, parameter.min, parameter.max, parameter.default_value);
            case "string":
                return new StringParameter(parameter.name, parameter.default_value);
            case "symbol":
                return new SymbolParameter(parameter.name, parameter.symbols, parameter.multiple, parameter.default_value);
            case "array":
                return new ArrayParameter(parameter.name, get_parameter(parameter.element_type), parameter.shape, parameter.default_value);
            case "geometry":
                return new GeometryParameter(parameter.name, parameter.default_value);
            default:
                throw new Error(`Unknown parameter type: ${parameter.type}`);
        }
    }

    /**
     * Represents a type of item.
     */
    export class Type {

        id: string;
        name: string;
        description: string;
        static_parameters: Map<string, ParameterType>;
        dynamic_parameters: Map<string, ParameterType>;

        /**
         * Creates a new Type instance.
         *
         * @param id The ID of the type.
         * @param name The name of the type.
         * @param description The description of the type.
         * @param static_parameters The static parameters of the type.
         * @param dynamic_parameters The dynamic parameters of the type.
         */
        constructor(id: string, name: string, description: string, static_parameters: Map<string, ParameterType>, dynamic_parameters: Map<string, ParameterType>) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.static_parameters = static_parameters;
            this.dynamic_parameters = dynamic_parameters;
        }

        static type_tooltip(type: Type): string {
            return type.description;
        }
    }

    /**
     * Represents an item listener.
     */
    export class ItemListener {

        constructor() {
        }

        /**
         * Sets the values for an item.
         *
         * @param values - The values of the item.
         */
        values(values: Record<string, any>[]): void { }

        /**
         * Adds a new value for an item.
         *
         * @param value - The value of the item.
         */
        new_value(value: Record<string, any>): void { }
    }

    /**
     * Represents an item.
     */
    export class Item {

        id: string;
        type: Type;
        name: string;
        description: string;
        parameters: Record<string, any>;
        values: Record<string, any>[];
        listeners: Set<ItemListener>;

        /**
         * Creates a new Item instance.
         *
         * @param id The ID of the item.
         * @param type The type of the item.
         * @param name The name of the item.
         * @param description The description of the item.
         * @param parameters The parameters of the item.
         */
        constructor(id: string, type: Type, name: string, description: string, parameters: Record<string, any>) {
            this.id = id;
            this.type = type;
            this.name = name;
            this.description = description;
            this.parameters = parameters;
            this.values = [];
            this.listeners = new Set();
        }

        /**
         * Sets the values for the item.
         * 
         * @param values The values of the item.
         */
        set_values(values: Record<string, any>[]) {
            this.values = values;
            this.listeners.forEach(listener => listener.values(values));
        }

        /**
         * Adds a new value for the item.
         * 
         * @param value The value of the item.
         */
        add_value(value: Record<string, any>) {
            this.values.push(value);
            this.listeners.forEach(listener => listener.new_value(value));
        }

        /**
         * Adds a listener to the item.
         * 
         * @param listener The listener to add.
         */
        add_listener(listener: ItemListener) {
            this.listeners.add(listener);
        }

        /**
         * Removes a listener from the item.
         * 
         * @param listener The listener to remove.
         */
        remove_listener(listener: ItemListener) {
            this.listeners.delete(listener);
        }
    }
}