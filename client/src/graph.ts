
export enum State {
    active,
    inactive,
    forbidden
}

interface FlawData {

    type: string;
    atom?: {
        sigma: number;
        type: string;
        is_fact: boolean;
    };
}

export class Flaw {

    id: string;
    phi: string;
    causes: Resolver[];
    state: State;
    cost: number;
    pos: number;
    data: FlawData;
    label: string;
    tooltip: string;
    current: boolean = false;

    constructor(id: string, phi: string, causes: Resolver[], state: State, cost: number, pos: number, data: FlawData) {
        this.id = id;
        this.phi = phi;
        this.causes = causes;
        this.state = state;
        this.cost = cost;
        this.pos = pos;
        this.data = data;
        this.label = Flaw.flaw_label(this);
        this.tooltip = Flaw.flaw_tooltip(this);
    }

    set_state(state: State) {
        this.state = state;
    }

    set_cost(cost: number) {
        this.cost = cost;
        this.tooltip = Flaw.flaw_tooltip(this);
    }

    set_pos(pos: number) {
        this.pos = pos;
        this.tooltip = Flaw.flaw_tooltip(this);
    }

    static flaw_label(flaw: Flaw): string {
        switch (flaw.data.type) {
            case 'atom':
                if (!flaw.data.atom)
                    return 'atom';
                return (flaw.data.atom.is_fact ? 'fact' : 'goal') + ' \u03C3' + flaw.data.atom.sigma + ' ' + flaw.data.atom.type;
            case 'enum':
                return 'enum';
            case 'bool':
                return 'bool';
            default:
                switch (flaw.phi) {
                    case 'b0':
                    case '\u00ACb0':
                        return flaw.data.type;
                    default:
                        return flaw.phi.replace('b', '\u03C6') + ' ' + flaw.data.type;
                }
        }
    }

    static flaw_tooltip(flaw: Flaw): string {
        switch (flaw.phi) {
            case 'b0':
            case '\u00ACb0':
                return 'cost: ' + flaw.cost + ', pos: ' + flaw.pos;
            default:
                return flaw.phi.replace('b', '\u03C6') + ', cost: ' + flaw.cost + ', pos: ' + flaw.pos;
        }
    }
}

interface ResolverData {

    type: string;
    name?: string;
    value?: any;
}

export class Resolver {

    id: string;
    rho: string;
    preconditions: Flaw[];
    flaw: Flaw;
    state: State;
    intrinsic_cost: number;
    cost: number;
    data: ResolverData;
    label: string;
    tooltip: string;
    current: boolean = false;

    constructor(id: string, rho: string, preconditions: Flaw[], flaw: Flaw, state: State, intrinsic_cost: number, data: ResolverData) {
        this.id = id;
        this.rho = rho;
        this.preconditions = preconditions;
        this.flaw = flaw;
        this.state = state;
        this.intrinsic_cost = intrinsic_cost;
        this.cost = Resolver.estimate_cost(this);
        this.data = data;
        this.label = Resolver.resolver_label(this);
        this.tooltip = Resolver.resolver_tooltip(this);
    }

    set_state(state: State) {
        this.state = state;
        this.cost = Resolver.estimate_cost(this);
        this.tooltip = Resolver.resolver_tooltip(this);
    }

    set_cost(cost: number) {
        this.cost = cost;
        this.tooltip = Resolver.resolver_tooltip(this);
    }

    static resolver_label(resolver: Resolver): string {
        if (resolver.data.type)
            switch (resolver.data.type) {
                case 'activate_fact':
                case 'activate_goal':
                    return 'activate';
                case 'unify_atom':
                    return 'unify';
                case 'assignment':
                    if (resolver.data.name)
                        return resolver.data.name;
                    else if (resolver.data.value.lit)
                        return resolver.data.value.val;
                    else if (resolver.data.value.lin) {
                        const lb = resolver.data.value.lb ? resolver.data.value.lb.num / resolver.data.value.lb.den : Number.NEGATIVE_INFINITY;
                        const ub = resolver.data.value.ub ? resolver.data.value.ub.num / resolver.data.value.ub.den : Number.POSITIVE_INFINITY;
                        if (lb == ub)
                            return (resolver.data.value.num / resolver.data.value.den).toString();
                        else
                            return resolver.data.value.num / resolver.data.value.den + ' [' + lb + ', ' + ub + ']';
                    }
                    else if (resolver.data.value.var)
                        return JSON.stringify(resolver.data.value.vals);
                    else
                        return resolver.data.value;
                default:
                    switch (resolver.rho) {
                        case 'b0':
                        case '\u00ACb0':
                            return resolver.data.type;
                        default:
                            return resolver.rho.replace('b', '\u03C1') + ' ' + resolver.data.type;
                    }
            }
        switch (resolver.rho) {
            case 'b0':
                return '\u22A4';
            case '\u00ACb0':
                return '\u22A5';
            default:
                return resolver.rho.replace('b', '\u03C1');
        }
    }

    static resolver_tooltip(resolver: Resolver): string {
        switch (resolver.rho) {
            case 'b0':
            case '\u00ACb0':
                return 'cost: ' + resolver.cost;
            default:
                return resolver.rho.replace('b', '\u03C1') + ', cost: ' + resolver.cost;
        }
    }

    static estimate_cost(resolver: Resolver): number {
        if (resolver.state == State.forbidden)
            return Infinity;
        return (resolver.preconditions.length ? Math.max.apply(null, resolver.preconditions.map(flaw => flaw.cost)) : 0) + resolver.intrinsic_cost;
    }
}