import { Knowledge } from "./knowledge";

export namespace coco {

    /**
     * Represents a property.
     */
    export class PropertyType {

        name: string;
        default_value: any;

        /**
         * Creates a new Property instance.
         *
         * @param name The name of the property.
         * @param default_value The default value of the property.
         */
        constructor(name: string, default_value?: any) {
            this.name = name;
            this.default_value = default_value;
        }
    }

    /**
     * Represents a boolean property.
     */
    export class BooleanProperty extends PropertyType {

        /**
         * Creates a new BooleanProperty instance.
         *
         * @param name The name of the property.
         * @param default_value The default value of the property.
         */
        constructor(name: string, default_value?: boolean) {
            super(name, default_value);
        }
    }

    /**
     * Represents an integer property.
     */
    export class IntegerProperty extends PropertyType {

        min: number;
        max: number;

        /**
         * Creates a new IntegerProperty instance.
         *
         * @param name The name of the property.
         * @param min The minimum value of the property.
         * @param max The maximum value of the property.
         * @param default_value The default value of the property.
         */
        constructor(name: string, min?: number, max?: number, default_value: number = min || 0) {
            super(name, default_value);
            this.min = min || -Infinity;
            this.max = max || Infinity;
        }
    }

    /**
     * Represents a real property.
     */
    export class RealProperty extends PropertyType {

        min: number;
        max: number;

        /**
         * Creates a new RealProperty instance.
         *
         * @param name The name of the property.
         * @param min The minimum value of the property.
         * @param max The maximum value of the property.
         * @param default_value The default value of the property.
         */
        constructor(name: string, min?: number, max?: number, default_value: number = min || 0) {
            super(name, default_value);
            this.min = min || -Infinity;
            this.max = max || Infinity;
        }
    }

    /**
     * Represents a string property.
     */
    export class StringProperty extends PropertyType {

        /**
         * Creates a new StringProperty instance.
         *
         * @param name The name of the property.
         * @param default_value The default value of the property.
         */
        constructor(name: string, default_value?: string) {
            super(name, default_value);
        }
    }

    /**
     * Represents a symbol property.
     */
    export class SymbolProperty extends PropertyType {

        symbols: string[];
        multiple: boolean;

        /**
         * Creates a new SymbolProperty instance.
         *
         * @param name The name of the property.
         * @param symbols The symbols of the property.
         * @param multiple Whether the property can have multiple values.
         * @param default_value The default value of the property.
         */
        constructor(name: string, symbols: string[], multiple: boolean = false, default_value?: string) {
            super(name, default_value);
            this.multiple = multiple;
            this.symbols = symbols;
        }
    }

    /**
     * Represents an item property.
     */
    export class ItemProperty extends PropertyType {

        type: Type;

        /**
         * Creates a new ItemProperty instance.
         *
         * @param name The name of the property.
         * @param type The type of the property.
         * @param default_value The default value of the property.
         */
        constructor(name: string, type: Type, default_value?: string) {
            super(name, default_value);
            this.type = type;
        }
    }

    /**
     * Represents a JSON property.
     */
    export class JSONProperty extends PropertyType {

        schema: any;

        /**
         * Creates a new JSONProperty instance.
         *
         * @param name The name of the property.
         * @param schema The schema of the property.
         * @param default_value The default value of the property.
         */
        constructor(name: string, schema: any, default_value?: any) {
            super(name, default_value);
            this.schema = schema;
        }
    }

    export function get_property(kb: Knowledge, property: any): PropertyType {
        switch (property.type) {
            case "boolean":
                return new BooleanProperty(property.name, property.default_value);
            case "integer":
                return new IntegerProperty(property.name, property.min, property.max, property.default_value);
            case "real":
                return new RealProperty(property.name, property.min, property.max, property.default_value);
            case "string":
                return new StringProperty(property.name, property.default_value);
            case "symbol":
                return new SymbolProperty(property.name, property.symbols, property.multiple, property.default_value);
            case "item":
                return new ItemProperty(property.name, kb.types.get(property.type_id)!, property.default_value);
            case "json":
                return new JSONProperty(property.name, property.schema, property.default_value);
            default:
                throw new Error(`Unknown property type: ${property.type}`);
        }
    }

    /**
     * Represents a type of item.
     */
    export class Type {

        id: string;
        name: string;
        description: string;
        parents: Map<string, Type>;
        static_properties: Map<string, PropertyType>;
        dynamic_properties: Map<string, PropertyType>;

        /**
         * Creates a new Type instance.
         *
         * @param id The ID of the type.
         * @param name The name of the type.
         * @param description The description of the type.
         * @param parents The parents of the type.
         * @param static_properties The static properties of the type.
         * @param dynamic_properties The dynamic properties of the type.
         */
        constructor(id: string, name: string, description: string, parents: Map<string, Type> = new Map(), static_properties: Map<string, PropertyType> = new Map(), dynamic_properties: Map<string, PropertyType> = new Map()) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.parents = parents;
            this.static_properties = static_properties;
            this.dynamic_properties = dynamic_properties;
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
        properties: Record<string, any>;
        values: Record<string, any>[];
        listeners: Set<ItemListener>;

        /**
         * Creates a new Item instance.
         *
         * @param id The ID of the item.
         * @param type The type of the item.
         * @param name The name of the item.
         * @param description The description of the item.
         * @param properties The properties of the item.
         */
        constructor(id: string, type: Type, name: string, description: string, properties: Record<string, any>) {
            this.id = id;
            this.type = type;
            this.name = name;
            this.description = description;
            this.properties = properties;
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