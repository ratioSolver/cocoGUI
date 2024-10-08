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
            return itm.type.split(':').pop() + '(' + Array.from(itm.exprs.keys()).join(', ') + ')';;
        }

        static item_content(itm: Item): string {
            const pars = [];
            for (const [name, val] of itm.exprs)
                pars.push('<br>' + name + ': ' + value_to_string(val, true));
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
            console.log(atm);
            return atm.type.split('.').pop() + '(' + Array.from(atm.exprs.keys()).filter(par => par != 'start' && par != 'end' && par != 'duration' && par != 'tau' && par != 'this').map(par => value_to_string(atm.exprs.get(par)!)).join(', ') + ')';
        }

        static atom_content(atm: Atom): string {
            const pars = [];
            for (const [name, val] of atm.exprs)
                pars.push('<br>' + name + ': ' + value_to_string(val, true));
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
        val: number;
        lb?: number;
        ub?: number;

        constructor(lin: string, val: number, lb?: number, ub?: number) {
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

    export function get_value(value: any, items: Map<number, Item>): Value {
        switch (value.type) {
            case 'bool':
                return new Bool(value.lit, Lit[value.val as keyof typeof Lit]);
            case 'int':
                return new Int(value.lin, value.val, value.lb, value.ub);
            case 'real':
                return new Real(value.lin, get_inf_rational(value.val), value.lb ? get_inf_rational(value.lb) : undefined, value.ub ? get_inf_rational(value.ub) : undefined);
            case 'time':
                return new Time(value.lin, get_inf_rational(value.val), value.lb ? get_inf_rational(value.lb) : undefined, value.ub ? get_inf_rational(value.ub) : undefined);
            case 'string':
                return new String(value.val);
            case 'enum':
                return new Enum(value.v, value.vals.map((item: any) => items.get(item)));
            case 'item':
                return items.get(value.id)!;
            default:
                throw new Error(`Unknown type: ${value.type}`);
        }
    }

    export function value_to_string(value: Value, expressive = false): string {
        console.log(value.constructor.name);
        if (value instanceof Bool) {
            switch (value.val) {
                case Lit.True:
                    return expressive ? 'true' : '⊤';
                case Lit.False:
                    return expressive ? 'false' : '⊥';
                default:
                    return expressive ? 'undefined' : 'U';
            }
        } else if (value instanceof Int) {
            if (expressive) {
                let res = `${value.val}`;
                if (value.lb || value.ub)
                    res += `[${value.lb?.toString() ?? '-∞'}, ${value.ub?.toString() ?? '+∞'}]`;
                return res + `(${value.lin})`;
            } else
                return value.val.toString();
        } else if (value instanceof Real || value instanceof Time) {
            if (expressive) {
                let res = `${value.val.to_number()}`;
                if (value.lb || value.ub)
                    res += `[${value.lb?.to_number() ?? '-∞'}, ${value.ub?.to_number() ?? '+∞'}]`;
                return res + `(${value.lin})`;
            } else
                return value.val.to_number().toString();
        } else if (value instanceof String) {
            return `'${value.val}'`;
        } else if (value instanceof Enum) {
            if (expressive)
                return (value.vals.length == 1 ? value.vals[0].name : `{${value.vals.map((item: Item) => item.name).join(', ')}}`) + ` (${value.v})`;
            else
                return value.vals.length == 1 ? value.vals[0].name : `{${value.vals.map((item: Item) => item.name).join(', ')}}`;
        } else
            return value.name;
    }
}