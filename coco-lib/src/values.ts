export namespace values {

    export class Rational {

        num: number;
        den: number;

        constructor(num: number, den: number) {
            this.num = num;
            this.den = den;
        }

        to_number(): number {
            return this.num / this.den;
        }
    }

    export class InfRational extends Rational {

        inf: Rational;

        constructor(num: number, den: number, inf: Rational = new Rational(0, 1)) {
            super(num, den);
            this.inf = inf;
        }
    }

    export function get_rational(val: any): Rational {
        return new Rational(val.num, val.den);
    }

    export function get_inf_rational(val: any): InfRational {
        return new InfRational(val.num, val.den, val.inf ? get_rational(val.inf) : new Rational(0, 1));
    }

    export class Item {

        id: string;
        type: string;
        name: string;
        exprs: Map<string, Bool | Int | Real | Time | String | Enum | Item>;

        constructor(id: string, type: string, name: string, exprs: Map<string, Bool | Int | Real | Time | String | Enum | Item>) {
            this.id = id;
            this.type = type;
            this.name = name;
            this.exprs = exprs;
        }

        static item_title(itm: Item): string {
            return itm.type.split(":").pop() + '(' + Array.from(itm.exprs.keys()).join(', ') + ')';;
        }

        static item_content(itm: Item): string {
            const pars = [];
            for (const [name, val] of itm.exprs)
                pars.push('<br>' + name + ': ' + value_to_string(val));
            return itm.type + '(' + pars.join(',') + '<br>)';
        }
    }

    export enum AtomState {
        Active,
        Inactive,
        Unified
    }

    export class Atom extends Item {

        is_fact: boolean;
        sigma: string;
        state: AtomState;

        constructor(id: string, type: string, name: string, exprs: Map<string, Bool | Int | Real | Time | String | Enum | Item>, is_fact: boolean, sigma: string, state: AtomState) {
            super(id, type, name, exprs);
            this.is_fact = is_fact;
            this.sigma = sigma;
            this.state = state;
        }

        static atom_title(atm: Atom): string {
            return atm.type.split(":").pop() + '(' + Array.from(atm.exprs.keys()).filter(par => par != 'start' && par != 'end' && par != 'duration' && par != 'tau' && par != 'this').map(par => value_to_string(atm.exprs.get(par)!)).join(', ') + ')';
        }

        static atom_content(atm: Atom): string {
            const pars = [];
            for (const [name, val] of atm.exprs)
                pars.push('<br>' + name + ': ' + value_to_string(val));
            return '\u03C3' + atm.sigma + ' ' + atm.type + '(' + pars.join(',') + '<br>)';
        }
    }

    export enum Lit {

        True,
        False,
        Undefined
    }

    export class Bool {

        lit: string;
        val: Lit;

        constructor(lit: string, val: Lit) {
            this.lit = lit;
            this.val = val;
        }
    }

    export class Int {

        lin: string;
        val: InfRational;
        lb?: InfRational;
        ub?: InfRational;

        constructor(lin: string, val: InfRational, lb?: InfRational, ub?: InfRational) {
            this.lin = lin;
            this.val = val;
            this.lb = lb;
            this.ub = ub;
        }
    }

    export class Real {

        lin: string;
        val: InfRational;
        lb?: InfRational;
        ub?: InfRational;

        constructor(lin: string, val: InfRational, lb?: InfRational, ub?: InfRational) {
            this.lin = lin;
            this.val = val;
            this.lb = lb;
            this.ub = ub;
        }
    }

    export class Time {

        lin: string;
        val: InfRational;
        lb?: InfRational;
        ub?: InfRational;

        constructor(lin: string, val: InfRational, lb?: InfRational, ub?: InfRational) {
            this.lin = lin;
            this.val = val;
            this.lb = lb;
            this.ub = ub;
        }
    }

    export class String {

        val: string;

        constructor(val: string) {
            this.val = val;
        }
    }

    export class Enum {

        v: string;
        vals: Item[];

        constructor(v: string, vals: Item[]) {
            this.v = v;
            this.vals = vals;
        }
    }

    export type Value = Bool | Int | Real | Time | String | Enum | Item;

    export function get_value(value: any, items: Map<string, Item>): Value {
        switch (value.type) {
            case "bool":
                return { lit: value.lit, val: Lit[value.val as keyof typeof Lit] };
            case "int":
            case "real":
            case "time":
                return { lin: value.lin, val: get_inf_rational(value.val), lb: value.lb ? get_inf_rational(value.lb) : new InfRational(-1, 0), ub: value.ub ? get_inf_rational(value.ub) : new InfRational(1, 0) };
            case "string":
                return { val: value.val };
            case "enum":
                return { v: value.v, vals: value.vals.map((item: any) => items.get(item)) };
            case "item":
                return items.get(value.id)!;
            default:
                throw new Error(`Unknown evalueession type: ${value.type}`);
        }
    }

    export function value_to_string(value: Value): string {
        if (value instanceof Bool) {
            return value.val === Lit.True ? "true" : value.val === Lit.False ? "false" : "undefined";
        } else if (value instanceof Int || value instanceof Real || value instanceof Time) {
            return `${value.lin} = ${value.val.num}/${value.val.den}${value.lb ? ` [${value.lb.num}/${value.lb.den}, ${value.ub!.num}/${value.ub!.den}]` : ""}`;
        } else if (value instanceof String) {
            return `"${value.val}"`;
        } else if (value instanceof Enum) {
            return `${value.v} = ${value.vals.map((item: Item) => item.name).join(", ")}`;
        } else {
            return value.name;
        }
    }
}