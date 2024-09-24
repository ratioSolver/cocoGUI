export namespace taxonomy {

    /**
     * Represents a property.
     */
    export class Property {

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

        /**
         * Returns the tooltip for the property.
         */
        tooltip(): string {
            return "<em>" + this.name + "</em>" + (this.default_value ? ` (${this.default_value})` : "");
        }
    }

    /**
     * Represents a boolean property.
     */
    export class BooleanProperty extends Property {

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
    export class IntegerProperty extends Property {

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
            this.min = (min === undefined) ? -Infinity : min;
            this.max = (max === undefined) ? Infinity : max;
        }

        /**
         * Returns the tooltip for the property.
         */
        tooltip(): string {
            return "<em>" + this.name + "</em>" + ` [${this.min}, ${this.max}]` + (this.default_value ? ` (${this.default_value})` : "");
        }
    }

    /**
     * Represents a real property.
     */
    export class RealProperty extends Property {

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
            this.min = (min === undefined) ? -Infinity : min;
            this.max = (max === undefined) ? Infinity : max;
        }

        /**
         * Returns the tooltip for the property.
         */
        tooltip(): string {
            return "<em>" + this.name + "</em>" + ` [${this.min}, ${this.max}]` + (this.default_value ? ` (${this.default_value})` : "");
        }
    }

    /**
     * Represents a string property.
     */
    export class StringProperty extends Property {

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
    export class SymbolProperty extends Property {

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

        /**
         * Returns the tooltip for the property.
         */
        tooltip(): string {
            return "<em>" + this.name + "</em>" + (this.multiple ? " multiple" : "") + (this.symbols ? ` {${this.symbols.join(", ")}}` : "") + (this.default_value ? ` (${this.default_value})` : "");
        }
    }

    /**
     * Represents an item property.
     */
    export class ItemProperty extends Property {

        type: Type;
        multiple: boolean;

        /**
         * Creates a new ItemProperty instance.
         *
         * @param name The name of the property.
         * @param type The type of the property.
         * @param multiple Whether the property can have multiple values.
         * @param default_value The default value of the property.
         */
        constructor(name: string, type: Type, multiple: boolean = false, default_value?: Item) {
            super(name, default_value);
            this.multiple = multiple;
            this.type = type;
        }

        /**
         * Returns the tooltip for the property.
         */
        tooltip(): string {
            return "<em>" + this.name + "</em>" + (this.multiple ? " multiple" : "") + ` (${this.type.name})` + (this.default_value ? ` (${this.default_value.name})` : "");
        }
    }

    /**
     * Represents a JSON property.
     */
    export class JSONProperty extends Property {

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

    /**
     * Retrieves all static properties of a given type and its parent types.
     * 
     * @param type - The type to retrieve static properties from.
     * @returns A map of static property names to their corresponding Property objects.
     */
    export function static_properties(type: taxonomy.Type): Map<string, taxonomy.Property> {
        const props = new Map<string, taxonomy.Property>();
        const q = [type];
        while (q.length > 0) {
            const t = q.shift()!;
            for (const [name, property] of t.static_properties)
                props.set(name, property);
            for (const parent of t.parents.values())
                q.push(parent);
        }
        return props;
    }

    /**
     * Retrieves all dynamic properties of a given type and its parent types.
     * 
     * @param type - The type to retrieve dynamic properties from.
     * @returns A map of dynamic properties, where the key is the property name and the value is the property object.
     */
    export function dynamic_properties(type: taxonomy.Type): Map<string, taxonomy.Property> {
        const props = new Map<string, taxonomy.Property>();
        const q = [type];
        while (q.length > 0) {
            const t = q.shift()!;
            for (const [name, property] of t.dynamic_properties)
                props.set(name, property);
            for (const parent of t.parents.values())
                q.push(parent);
        }
        return props;
    }

    /**
     * Represents a type of item.
     */
    export class Type {

        id: string;
        name: string;
        description: string;
        properties: Record<string, any>;
        parents: Map<string, Type>;
        static_properties: Map<string, Property>;
        dynamic_properties: Map<string, Property>;
        instances: Set<Item>;

        /**
         * Creates a new Type instance.
         *
         * @param id The ID of the type.
         * @param name The name of the type.
         * @param description The description of the type.
         * @param properties The properties of the type.
         * @param parents The parents of the type.
         * @param static_properties The static properties of the type.
         * @param dynamic_properties The dynamic properties of the type.
         */
        constructor(id: string, name: string, description: string, properties: Record<string, any> = {}, parents: Map<string, Type> = new Map(), static_properties: Map<string, Property> = new Map(), dynamic_properties: Map<string, Property> = new Map()) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.properties = properties;
            this.parents = parents;
            this.static_properties = static_properties;
            this.dynamic_properties = dynamic_properties;
            this.instances = new Set();
        }

        is_instance_of(type: Type): boolean {
            if (this === type)
                return true;
            for (const parent of this.parents.values())
                if (parent.is_instance_of(type))
                    return true;
            return false;
        }

        /**
         * Returns the tooltip for a given Type.
         * 
         * @param type - The Type object for which to generate the tooltip.
         * @returns The tooltip as an HTML string.
         */
        static type_tooltip(type: Type): string {
            let tooltip = "<html>" + type.description;
            if (type.static_properties.size > 0) {
                tooltip += "<br><b>Static Properties:</b>";
                for (const property of type.static_properties.values())
                    tooltip += `<br>${property.tooltip()}`;
            }
            if (type.dynamic_properties.size > 0) {
                tooltip += "<br><b>Dynamic Properties:</b>";
                for (const property of type.dynamic_properties.values())
                    tooltip += `<br>${property.tooltip()}`;
            }
            return tooltip + "</html>";
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
        values(values: Data[]): void { }

        /**
         * Adds a new value for an item.
         *
         * @param value - The value of the item.
         */
        new_value(value: Data): void { }
    }

    /**
     * Represents a data object with a timestamp and a data payload.
     */
    export type Data = {

        timestamp: Date; // The timestamp of the data.
        data: Record<string, any>; // The data payload.
    }

    /**
     * Represents an item.
     */
    export class Item {

        id: string;
        type: Type;
        properties: Record<string, any>; // The static properties of the item.
        values: Data[]; // The historical dynamic properties of the item.
        value: Data; // The dynamic properties of the item.
        listeners: Set<ItemListener>;

        /**
         * Creates a new Item instance.
         *
         * @param id The ID of the item.
         * @param type The type of the item.
         * @param properties The properties of the item.
         * @param value The value of the item.
         */
        constructor(id: string, type: Type, properties: Record<string, any>, value: Data) {
            this.id = id;
            this.type = type;
            this.properties = properties;
            this.values = [];
            this.listeners = new Set();
            this.value = value;

            const q = [type];
            while (q.length > 0) {
                const t = q.shift()!;
                t.instances.add(this);
                for (const parent of t.parents.values())
                    q.push(parent);
            }
        }

        /**
         * Retrieves the name of the item.
         * If the "name" property is defined, it returns the value of the property.
         * Otherwise, it returns the ID of the item.
         * 
         * @returns The name of the item.
         */
        get_name(): string {
            return this.properties["name"] || this.id;
        }

        /**
         * Sets the values for the item.
         * 
         * @param values The values of the item.
         */
        set_values(values: Data[]) {
            console.debug("Setting values for item", this.get_name(), values);
            this.values = values;
            this.listeners.forEach(listener => listener.values(values));
        }

        /**
         * Adds a new value for the item.
         * 
         * @param value The value of the item.
         */
        add_value(value: Data) {
            console.debug("Adding value for item", this.get_name(), value);
            this.value = value;
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
            listener.values(this.values);
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