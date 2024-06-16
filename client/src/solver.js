export class SolverListener {

    state(state) { }

    graph(graph) { }
    flaw_created(flaw) { }
    flaw_state_changed(flaw) { }
    flaw_cost_changed(flaw) { }
    flaw_position_changed(flaw) { }
    current_flaw_changed(flaw) { }
    resolver_created(resolver) { }
    resolver_state_changed(resolver) { }
    resolver_cost_changed(resolver) { }
    current_resolver_changed(resolver) { }
    causal_link_added(link) { }

    executor_state_changed(state) { }
    tick(time) { }
    starting(tasks) { }
    ending(tasks) { }
    start(tasks) { }
    end(tasks) { }
}

export class Solver {

    constructor(id, name, state) {
        this.id = id;
        this.name = name;
        this.state = state;

        this.items = new Map();
        this.atoms = new Map();

        this.timelines = new Map();
        this.origin = 0;
        this.horizon = 1;

        this.flaws = new Map();
        this.resolvers = new Map();
        this.current_flaw;
        this.current_resolver;

        this.current_time = 0;
        this.executing_tasks = new Set();

        this.listeners = new Set();
    }

    /**
     * Handles the state change message.
     * 
     * @param {Object} message - The state change message.
     */
    state_changed(message) {
        this.items.clear(); if (message.items) for (const itm of message.items) this.items.set(parseInt(itm.id), itm);
        this.atoms.clear(); if (message.atoms) for (const atm of message.atoms) this.atoms.set(parseInt(atm.id), atm);

        this.exprs = this.exprs_to_map(message.exprs);
        for (const itm of this.items.values())
            if (itm.exprs)
                itm.exprs = this.exprs_to_map(itm.exprs);
        for (const atm of this.atoms.values())
            if (atm.exprs)
                atm.exprs = this.exprs_to_map(atm.exprs);

        const origin_var = this.exprs.get('origin');
        const horizon_var = this.exprs.get('horizon');
        this.origin = origin_var.num / origin_var.den;
        this.horizon = horizon_var.num / horizon_var.den;

        this.timelines.clear();
        if (message.timelines)
            for (const tl of message.timelines)
                this.timelines.set(tl.id, tl);

        this.executing_tasks.clear();
        if (message.executing)
            for (const atm of message.executing)
                this.executing_tasks.add(this.atoms.get(atm));

        this.current_time = message.time.num / message.time.den;

        this.listeners.forEach(l => l.state(this));
    }

    graph(message) {
        this.flaws.clear();
        this.edges.clear();
        this.current_flaw = undefined;
        this.current_resolver = undefined;

        for (const f of message.flaws) {
            const flaw = {
                reasoner: this,
                id: f.id,
                phi: f.phi,
                causes: f.causes,
                state: f.state,
                cost: f.cost.num / f.cost.den,
                pos: f.pos,
                data: f.data
            };
            flaw.label = this.flaw_label(flaw);
            flaw.title = this.flaw_tooltip(flaw);
            this.flaws.set(flaw.id, flaw);
        }

        for (const r of message.resolvers) {
            const resolver = {
                reasoner: this,
                id: r.id,
                rho: r.rho,
                preconditions: r.preconditions,
                flaw: r.flaw,
                state: r.state,
                intrinsic_cost: r.intrinsic_cost.num / r.intrinsic_cost.den,
                data: r.data
            };
            resolver.cost = this.estimate_cost(resolver);
            resolver.label = this.resolver_label(resolver);
            resolver.title = this.resolver_tooltip(resolver);
            this.resolvers.set(resolver.id, resolver);
        }

        if (message.current_flaw) {
            this.current_flaw = this.nodes.get(message.current_flaw);
            this.current_flaw.current = true;
            if (message.current_resolver) {
                this.current_resolver = this.nodes.get(message.current_resolver);
                this.current_resolver.current = true;
            }
        }

        this.listeners.forEach(l => l.graph(this));
    }

    flaw_created(message) {
        const flaw = {
            reasoner: this,
            id: message.id,
            phi: message.phi,
            causes: message.causes,
            state: message.state,
            cost: message.cost.num / message.cost.den,
            pos: { lb: 0 },
            data: message.data
        };
        flaw.label = this.flaw_label(flaw);
        flaw.title = this.flaw_tooltip(flaw);
        this.flaws.set(flaw.id, flaw);
        for (const c_id of flaw.causes) {
            const cause = this.resolvers.get(c_id);
            cause.preconditions.push(flaw.id);
            const c_res_cost = this.estimate_cost(cause);
            if (cause.cost != c_res_cost) {
                cause.cost = c_res_cost;
                cause.title = this.resolver_tooltip(cause);
                this.listeners.forEach(l => l.resolver_cost_changed(cause));
            }
        }
    }

    flaw_state_changed(message) {
        const flaw = this.flaws.get(message.id);
        flaw.state = message.state;
        this.listeners.forEach(l => l.flaw_state_changed(flaw));
    }

    flaw_cost_changed(message) {
        const flaw = this.flaws.get(message.id);
        flaw.cost = message.cost.num / message.cost.den;
        flaw.title = this.flaw_tooltip(flaw);
        this.listeners.forEach(l => l.flaw_cost_changed(flaw));

        for (const c_id of flaw.causes) {
            const cause = this.resolvers.get(c_id);
            const c_res_cost = this.estimate_cost(cause);
            if (cause.cost != c_res_cost) {
                cause.cost = c_res_cost;
                cause.title = this.resolver_tooltip(cause);
                this.listeners.forEach(l => l.resolver_cost_changed(cause));
            }
        }
    }

    flaw_position_changed(message) {
        const flaw = this.flaws.get(message.id);
        flaw.pos = message.pos;
        flaw.title = this.flaw_tooltip(flaw);
        this.listeners.forEach(l => l.flaw_position_changed(flaw));
    }

    current_flaw_changed(message) {
        if (this.current_flaw) {
            this.current_flaw.current = false;
            this.listeners.forEach(l => l.current_flaw_changed(this.current_flaw));
        }
        this.current_flaw = this.flaws.get(message.id);
        this.current_flaw.current = true;
        this.listeners.forEach(l => l.current_flaw_changed(this.current_flaw));
        if (this.current_resolver) {
            this.current_resolver.current = false;
            this.listeners.forEach(l => l.current_resolver_changed(this.current_resolver));
        }
        this.current_resolver = undefined;
    }

    resolver_created(message) {
        const resolver = {
            reasoner: this,
            id: message.id,
            rho: message.rho,
            preconditions: message.preconditions,
            flaw: message.flaw,
            state: message.state,
            intrinsic_cost: message.intrinsic_cost.num / message.intrinsic_cost.den,
            data: message.data
        };
        resolver.cost = this.estimate_cost(resolver);
        resolver.label = this.resolver_label(resolver);
        resolver.title = this.resolver_tooltip(resolver);
        this.resolvers.set(resolver.id, resolver);
        this.listeners.forEach(l => l.resolver_created(resolver));
    }

    resolver_state_changed(message) {
        const resolver = this.resolvers.get(message.id);
        resolver.state = message.state;
        resolver.cost = this.estimate_cost(resolver);
        resolver.title = this.resolver_tooltip(resolver);
        this.listeners.forEach(l => l.resolver_state_changed(resolver));
    }

    current_resolver_changed(message) {
        if (this.current_resolver) {
            this.current_resolver.current = false;
            this.listeners.forEach(l => l.current_resolver_changed(this.current_resolver));
        }
        this.current_resolver = this.resolvers.get(message.id);
        this.current_resolver.current = true;
        this.listeners.forEach(l => l.current_resolver_changed(this.current_resolver));
    }

    causal_link_added(message) {
        const flaw = this.flaws.get(message.flaw_id);
        const resolver = this.resolvers.get(message.resolver_id);
        resolver.preconditions.push(flaw.id);
        flaw.causes.push(resolver.id);
        this.listeners.forEach(l => l.causal_link_added({ from: flaw, to: resolver }));
        resolver.cost = this.estimate_cost(resolver);
        resolver.title = this.resolver_tooltip(resolver);
        this.listeners.forEach(l => l.resolver_cost_changed(resolver));
    }

    estimate_cost(res) {
        if (!res.state) return Number.POSITIVE_INFINITY;
        return (res.preconditions.length ? Math.max.apply(this, res.preconditions.map(f_id => this.nodes.get(f_id).cost)) : 0) + res.intrinsic_cost;
    }

    executor_state_changed(message) {
        this.state = message.state;

        switch (this.state) {
            case 'idle':
            case 'executing':
            case 'finished':
            case 'failed':
                if (this.current_flaw) {
                    this.current_flaw.current = false;
                    this.listeners.forEach(l => l.current_flaw_changed(this.current_flaw));
                    this.current_flaw = undefined;
                }
                if (this.current_resolver) {
                    this.current_resolver.current = false;
                    this.listeners.forEach(l => l.current_resolver_changed(this.current_resolver));
                    this.current_resolver = undefined;
                }
        }
    }

    tick(message) {
        this.current_time = message.time.num / message.time.den;
        this.listeners.forEach(l => l.tick(this.current_time));
    }

    starting(message) {
        console.log('starting');
        for (const atm of message.starting)
            console.log(this.atom_content(this.atoms.get(atm)));
        this.listeners.forEach(l => l.starting(message.starting.map(atm => this.atoms.get(atm))));
    }

    start(message) {
        for (const atm of message.start)
            this.executing_tasks.add(this.atoms.get(atm));
        this.listeners.forEach(l => l.start(message.start.map(atm => this.atoms.get(atm))));
    }

    ending(message) {
        console.log('ending');
        for (const atm of message.ending)
            console.log(this.atom_content(this.atoms.get(atm)));
        this.listeners.forEach(l => l.ending(message.ending.map(atm => this.atoms.get(atm))));
    }

    end(message) {
        for (const atm of message.end)
            this.executing_tasks.delete(this.atoms.get(atm));
        this.listeners.forEach(l => l.end(message.end.map(atm => this.atoms.get(atm))));
    }

    timeline_name(tl) { return tl.name; }

    /**
     * Returns the title of the given solver value.
     *
     * @param {any} ag_val - The value to get the title for.
     * @returns {string} The title of the value.
     */
    slv_value_title(ag_val) { return this.atom_title(ag_val); }

    /**
     * Returns the content of the given solver value.
     *
     * @param {any} ag_val - The solver value to get the content of.
     * @returns {any} The content of the given solver value.
     */
    slv_value_content(ag_val) { return this.atom_content(ag_val); }

    /**
     * Returns the title of the given agent value.
     *
     * @param {any} ag_val - The value to get the title for.
     * @returns {string} The title of the agent value.
     */
    ag_value_title(ag_val) { return this.atom_title(ag_val); }

    /**
     * Returns the content of the given agent value.
     *
     * @param {any} ag_val - The agent value.
     * @returns {any} The content of the agent value.
     */
    ag_value_content(ag_val) { return this.atom_content(ag_val); }

    /**
     * Returns the title of a state-variable value object.
     * 
     * @param {Object} sv_val - The state-variable value object.
     * @returns {string} The title of the state-variable value object.
     */
    sv_value_title(sv_val) {
        switch (sv_val.atoms.length) {
            case 0: return '';
            case 1: return this.atom_title(this.atoms.get(sv_val.atoms[0]));
            default: return Array.from(sv_val.atoms, atm => this.atom_title(this.atoms.get(atm))).join(', ');
        }
    }

    /**
     * Returns the content of a state-variable value object.
     *
     * @param {Object} sv_val - The state-variable value object.
     * @returns {string} The content of the state-variable value object.
     */
    sv_value_content(sv_val) {
        switch (sv_val.atoms.length) {
            case 0: return '';
            case 1: return this.atom_content(sv_val.atoms[0]);
            default: return Array.from(sv_val.atoms, atm => '<br>' + this.atom_content(atm)).join(', ');
        }
    }

    /**
     * Returns the content of a reusable-resource value object.
     *
     * @param {Object} sv_val - The reusable-resource value object.
     * @returns {string} The content of the reusable-resource value object.
     */
    rr_value_content(rr_val) {
        switch (rr_val.atoms.length) {
            case 0: return '0: [' + rr_val.from + ', ' + rr_val.to + ']';
            case 1: return rr_val.usage + ': [' + rr_val.from + ', ' + rr_val.to + ']<br>' + this.atom_content(rr_val.atoms[0]);
            default: return rr_val.usage + ': [' + rr_val.from + ', ' + rr_val.to + ']' + Array.from(rr_val.atoms, atm => '<br>' + this.atom_content(atm)).join(', ');
        }
    }

    /**
     * Returns the content of a consumable-resource value object.
     *
     * @param {Object} sv_val - The consumable-resource value object.
     * @returns {string} The content of the consumable-resource value object.
     */
    cr_value_content(cr_val) {
        switch (cr_val.atoms.length) {
            case 0: return cr_val.start + ': [' + cr_val.from + ', ' + cr_val.to + ']';
            case 1: return cr_val.start + ' -> ' + cr_val.end + ': [' + cr_val.from + ', ' + cr_val.to + ']<br>' + this.atom_content(cr_val.atoms[0]);
            default: return cr_val.start + ' -> ' + cr_val.end + ': [' + cr_val.from + ', ' + cr_val.to + ']' + Array.from(cr_val.atoms, atm => '<br>' + this.atom_content(atm)).join(', ');
        }
    }

    item_title(itm) { return itm.type.split(":").pop() + '(' + Array.from(itm.exprs.keys()).join(', ') + ')'; }

    item_content(itm) {
        const pars = [];
        for (const [name, val] of itm.exprs)
            pars.push('<br>' + name + ': ' + this.val_to_string(val));
        return itm.type + '(' + pars.join(',') + '<br>)';
    }

    atom_title(atm) { return atm.type.split(":").pop() + '(' + Array.from(atm.exprs.keys()).filter(par => par != 'start' && par != 'end' && par != 'duration' && par != 'tau' && par != 'this').map(par => this.val_to_string(atm.exprs.get(par))).join(', ') + ')'; }

    atom_content(atm) {
        const pars = [];
        for (const [name, val] of atm.exprs)
            if (name != 'tau')
                pars.push('<br>' + name + ': ' + this.val_to_string(val));
        return '\u03C3' + atm.sigma + ' ' + atm.type + '(' + pars.join(',') + '<br>)';
    }

    /**
     * Converts a value to its string representation.
     * 
     * @param {object} val - The value to convert.
     * @returns {string} The string representation of the value.
     */
    val_to_string(val) {
        switch (val.type) {
            case 'bool': return val.val;
            case 'int':
            case 'real':
            case 'time':
                const lb = val.lb ? val.lb.num / val.lb.den : Number.NEGATIVE_INFINITY;
                const ub = val.ub ? val.ub.num / val.ub.den : Number.POSITIVE_INFINITY;
                if (lb == ub)
                    return val.val.num / val.val.den;
                else
                    return val.val.num / val.val.den + ' [' + lb + ', ' + ub + ']';
            case 'string': return val.val;
            case 'enum':
                return '[' + val.map(itm => itm.name).sort().join(',') + ']';
            case 'object':
                return val.name;
            default: // should not happen
                return val;
        }
    }

    /**
     * Converts an object of expressions to a Map.
     *
     * @param {Object} xprs - The object of expressions to be converted.
     * @returns {Map} - The converted Map.
     */
    exprs_to_map(xprs) {
        const c_xprs = new Map();
        for (const key in xprs) {
            const xpr = xprs[key];
            switch (xpr.type) {
                case 'bool':
                case 'int':
                case 'real':
                case 'time':
                case 'string':
                    c_xprs.set(key, xpr);
                    break;
                default: // enum or object, we replace the id with the object
                    if (xpr.vals) {
                        if (xpr.vals.length == 1)
                            c_xprs.set(key, this.items.has(xpr.vals[0]) ? this.items.get(xpr.vals[0]) : this.atoms.get(xpr.vals[0]));
                        else
                            c_xprs.set(key, xpr.vals.map(itm_id => this.items.has(itm_id) ? this.items.get(itm_id) : this.atoms.get(itm_id)));
                    } else
                        c_xprs.set(key, this.items.has(xpr.val) ? this.items.get(xpr) : this.atoms.get(xpr));
                    break;
            }
        }
        return c_xprs;
    }

    flaw_label(flaw) {
        switch (flaw.data.type) {
            case 'atom':
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

    flaw_tooltip(flaw) {
        switch (flaw.phi) {
            case 'b0':
            case '\u00ACb0':
                return 'cost: ' + flaw.cost + ', pos: ' + flaw.pos.lb;
            default:
                return flaw.phi.replace('b', '\u03C6') + ', cost: ' + flaw.cost + ', pos: ' + flaw.pos.lb;
        }
    }

    resolver_label(resolver) {
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
                            return resolver.data.value.num / resolver.data.value.den;
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

    resolver_tooltip(resolver) {
        switch (resolver.rho) {
            case 'b0':
            case '\u00ACb0':
                return 'cost: ' + resolver.cost;
            default:
                return resolver.rho.replace('b', '\u03C1') + ', cost: ' + resolver.cost;
        }
    }

    /**
     * Adds a listener to the solver.
     * 
     * @param {SolverListener} listener - The listener to add.
     */
    add_listener(listener) { this.listeners.add(listener); }

    /**
     * Removes a listener from the solver.
     * 
     * @param {SolverListener} listener - The listener to remove.
     */
    remove_listener(listener) { this.listeners.delete(listener); }
}

/**
 * Represents a deliberative or a reactive rule.
 * @class
 */
export class Rule {

    /**
     * Creates a new instance of the Rule class.
     * @constructor
     * @param {number} id - The ID of the rule.
     * @param {string} name - The name of the rule.
     * @param {string} content - The content of the rule.
     */
    constructor(id, name, content) {
        this.id = id;
        this.name = name;
        this.content = content;
    }

    /**
     * Updates the name and content of the rule.
     * @param {string} name - The new name of the rule.
     * @param {string} content - The new content of the rule.
     */
    update(name, content) {
        this.name = name;
        this.content = content;
    }
}