export namespace rule {

    /**
     * Represents a reactive rule.
     */
    export class ReactiveRule {

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

    /**
     * Represents a deliberative rule.
     */
    export class DeliberativeRule {

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
}