import { Item, Type } from "./type";

export class KnowledgeListener {

    constructor() {
    }

    types(types: Type[]) { }
    type_added(type: Type) { }
    type_updated(type: Type) { }
    type_removed(id: string) { }

    items(items: Item[]) { }
    item_added(item: Item) { }
    item_updated(item: Item) { }
    item_removed(id: string) { }

    reactive_rules(rules: Rule[]) { }
    reactive_rule_added(rule: Rule) { }
    reactive_rule_updated(rule: Rule) { }
    reactive_rule_removed(id: string) { }

    deliberative_rules(rules: Rule[]) { }
    deliberative_rule_added(rule: Rule) { }
    deliberative_rule_updated(rule: Rule) { }
    deliberative_rule_removed(id: string) { }

    solvers(solvers) { }
    solver_added(solver) { }
    solver_removed(id) { }
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