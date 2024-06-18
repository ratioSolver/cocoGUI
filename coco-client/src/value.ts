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
}

export class Rational {

    num: number;
    den: number;

    constructor(num: number, den: number) {
        this.num = num;
        this.den = den;
    }
}

export class InfRational extends Rational {

    inf: Rational;

    constructor(num: number, den: number, inf: Rational) {
        super(num, den);
        this.inf = inf;
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
    val: Rational;
    lb?: Rational;
    ub?: Rational;

    constructor(lin: string, val: Rational, lb?: Rational, ub?: Rational) {
        this.lin = lin;
        this.val = val;
        this.lb = lb;
        this.ub = ub;
    }
}

export class Real {

    lin: string;
    val: Rational;
    lb?: Rational;
    ub?: Rational;

    constructor(lin: string, val: Rational, lb?: Rational, ub?: Rational) {
        this.lin = lin;
        this.val = val;
        this.lb = lb;
        this.ub = ub;
    }
}

export class Time {

    lin: string;
    val: Rational;
    lb?: Rational;
    ub?: Rational;

    constructor(lin: string, val: Rational, lb?: Rational, ub?: Rational) {
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
            return { lin: value.lin, val: { num: value.val.num, den: value.val.den }, lb: value.lb ? { num: value.lb.num, den: value.lb.den } : undefined, ub: value.ub ? { num: value.ub.num, den: value.ub.den } : undefined };
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