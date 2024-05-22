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

        this.nodes = new Map();
        this.edges = new Set();
        this.current_flaw;
        this.current_resolver;

        this.current_time = 0;
        this.executing_tasks = new Set();

        this.state_listeners = new Set();
        this.timelines_listeners = new Set();
        this.time_listeners = new Set();
        this.task_start_listeners = new Set();
        this.task_end_listeners = new Set();

        this.new_node_listeners = new Set();
        this.node_listeners = new Map();
        this.new_edge_listeners = new Set();
        this.edge_listeners = new Map();
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

        this.state_listeners.forEach(l => l(this));
        this.timelines_listeners.forEach(l => l(this.timelines));
    }

    solution_found() {
        if (this.current_flaw) {
            this.current_flaw.current = false;
            this.node_listeners.get(this.current_flaw.id).forEach(l => l(this.current_flaw));
        }
        this.current_flaw = undefined;
        if (this.current_resolver) {
            this.current_resolver.current = false;
            this.node_listeners.get(this.current_resolver.id).forEach(l => l(this.current_resolver));
        }
        this.current_resolver = undefined;
    }

    inconsistent_problem() {
        if (this.current_flaw) {
            this.current_flaw.current = false;
            this.node_listeners.get(this.current_flaw.id).forEach(l => l(this.current_flaw));
        }
        this.current_flaw = undefined;
        if (this.current_resolver) {
            this.current_resolver.current = false;
            this.node_listeners.get(this.current_resolver.id).forEach(l => l(this.current_resolver));
        }
        this.current_resolver = undefined;
    }

    executor_state_changed(message) {
        this.state = message.state;
    }

    tick(message) {
        this.current_time = message.time.num / message.time.den;
        this.time_listeners.forEach(l => l(this.current_time));
    }

    graph(message) {
        this.nodes.clear();
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
            this.nodes.set(flaw.id, flaw);
            this.node_listeners.set(flaw.id, new Set());
            this.new_node_listeners.forEach(l => l(flaw));
        }

        for (const r of message.resolvers) {
            const resolver = {
                reasoner: this,
                id: r.id,
                rho: r.rho,
                preconditions: r.preconditions,
                effect: r.effect,
                state: r.state,
                intrinsic_cost: r.intrinsic_cost.num / r.intrinsic_cost.den,
                data: r.data,
                edges: []
            };
            resolver.cost = this.estimate_cost(resolver);
            resolver.label = this.resolver_label(resolver);
            resolver.title = this.resolver_tooltip(resolver);
            this.nodes.set(resolver.id, resolver);
            this.node_listeners.set(resolver.id, new Set());
            this.new_node_listeners.forEach(l => l(resolver));

            const eff_edge = { from: r.id, to: r.effect, state: resolver.state };
            this.edges.add(eff_edge);
            this.edge_listeners.set(eff_edge, new Set());
            this.new_edge_listeners.forEach(l => l(eff_edge));
            resolver.edges.push(eff_edge);
            for (const f of resolver.preconditions) {
                const prec_edge = { from: f, to: resolver.id, state: resolver.state };
                this.edges.add(prec_edge);
                resolver.edges.push(prec_edge);
                this.edge_listeners.set(prec_edge, new Set());
                this.new_edge_listeners.forEach(l => l(prec_edge));
            }
        }

        if (message.current_flaw) {
            this.current_flaw = this.nodes.get(message.current_flaw);
            this.current_flaw.current = true;
            if (message.current_resolver) {
                this.current_resolver = this.nodes.get(message.current_resolver);
                this.current_resolver.current = true;
            }
        }
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
        this.nodes.set(flaw.id, flaw);
        this.node_listeners.set(flaw.id, new Set());
        this.new_node_listeners.forEach(l => l(flaw));
        for (const c_id of flaw.causes) {
            const cause = this.nodes.get(c_id);
            cause.preconditions.push(flaw.id);
            const c_res_cost = this.estimate_cost(cause);
            if (cause.cost != c_res_cost) {
                cause.cost = c_res_cost;
                cause.title = this.resolver_tooltip(cause);
            }
            const cause_edge = { from: flaw.id, to: cause.id, state: cause.state };
            cause.edges.push(cause_edge);
            this.edges.add(cause_edge);
            this.edge_listeners.set(cause_edge, new Set());
            this.new_edge_listeners.forEach(l => l(cause_edge));
        }
    }

    flaw_state_changed(message) {
        const flaw = this.nodes.get(message.id);
        flaw.state = message.state;
        this.node_listeners.get(flaw.id).forEach(l => l(flaw));
    }

    flaw_cost_changed(message) {
        const flaw = this.nodes.get(message.id);
        flaw.cost = message.cost.num / message.cost.den;
        flaw.title = this.flaw_tooltip(flaw);
        this.node_listeners.get(flaw.id).forEach(l => l(flaw));

        for (const c_id of flaw.causes) {
            const cause = this.nodes.get(c_id);
            const c_res_cost = this.estimate_cost(cause);
            if (cause.cost != c_res_cost) {
                cause.cost = c_res_cost;
                cause.title = this.resolver_tooltip(cause);
                this.node_listeners.get(cause.id).forEach(l => l(cause));
            }
        }
    }

    flaw_position_changed(message) {
        const flaw = this.nodes.get(message.id);
        flaw.pos = message.pos;
        flaw.title = this.flaw_tooltip(flaw);
        this.node_listeners.get(flaw.id).forEach(l => l(flaw));
    }

    current_flaw_changed(message) {
        if (this.current_flaw) {
            this.current_flaw.current = false;
            this.node_listeners.get(this.current_flaw.id).forEach(l => l(this.current_flaw));
        }
        this.current_flaw = this.nodes.get(message.id);
        this.current_flaw.current = true;
        this.node_listeners.get(this.current_flaw.id).forEach(l => l(this.current_flaw));
        if (this.current_resolver) {
            this.current_resolver.current = false;
            this.node_listeners.get(this.current_resolver.id).forEach(l => l(this.current_resolver));
        }
        this.current_resolver = undefined;
    }

    resolver_created(message) {
        const resolver = {
            reasoner: this,
            id: message.id,
            rho: message.rho,
            preconditions: message.preconditions,
            effect: message.effect,
            state: message.state,
            intrinsic_cost: message.intrinsic_cost.num / message.intrinsic_cost.den,
            data: message.data,
            edges: []
        };
        resolver.cost = this.estimate_cost(resolver);
        resolver.label = this.resolver_label(resolver);
        resolver.title = this.resolver_tooltip(resolver);
        this.nodes.set(resolver.id, resolver);
        this.node_listeners.set(resolver.id, new Set());
        this.new_node_listeners.forEach(l => l(resolver));
        const eff_edge = { from: message.id, to: message.effect, state: resolver.state };
        resolver.edges.push(eff_edge);
        this.edges.add(eff_edge);
        this.edge_listeners.set(eff_edge, new Set());
        this.new_edge_listeners.forEach(l => l(eff_edge));
    }

    resolver_state_changed(message) {
        const resolver = this.nodes.get(message.id);
        resolver.state = message.state;
        resolver.cost = this.estimate_cost(resolver);
        resolver.title = this.resolver_tooltip(resolver);
        this.node_listeners.get(resolver.id).forEach(l => l(resolver));
        for (const edge of resolver.edges) {
            edge.state = resolver.state;
            this.edge_listeners.get(edge).forEach(l => l(edge));
        }
    }

    current_resolver_changed(message) {
        if (this.current_resolver) {
            this.current_resolver.current = false;
            this.node_listeners.get(this.current_resolver.id).forEach(l => l(this.current_resolver));
        }
        this.current_resolver = this.nodes.get(message.id);
        this.current_resolver.current = true;
        this.node_listeners.get(this.current_resolver.id).forEach(l => l(this.current_resolver));
    }

    causal_link_added(message) {
        const flaw = this.nodes.get(message.flaw_id);
        const resolver = this.nodes.get(message.resolver_id);
        resolver.preconditions.push(flaw.id);
        flaw.causes.push(resolver.id);
        const cause_edge = { from: flaw.id, to: resolver.id, state: resolver.state };
        this.edges.add(cause_edge);
        resolver.edges.push(cause_edge);
        this.edge_listeners.set(cause_edge, new Set());
        this.new_edge_listeners.forEach(l => l(cause_edge));
        resolver.cost = this.estimate_cost(resolver);
        resolver.title = this.resolver_tooltip(resolver);
        this.node_listeners.get(resolver.id).forEach(l => l(resolver));
    }

    estimate_cost(res) {
        if (!res.state) return Number.POSITIVE_INFINITY;
        return (res.preconditions.length ? Math.max.apply(this, res.preconditions.map(f_id => this.nodes.get(f_id).cost)) : 0) + res.intrinsic_cost;
    }

    starting(message) {
        console.log('starting');
        for (const atm of message.starting)
            console.log(this.atom_content(this.atoms.get(atm)));
    }

    start(message) {
        for (const atm of message.start)
            this.executing_tasks.add(this.atoms.get(atm));
        this.task_start_listeners.forEach(l => l(message.start.map(atm => this.atoms.get(atm))));
    }

    ending(message) {
        console.log('ending');
        for (const atm of message.ending)
            console.log(this.atom_content(this.atoms.get(atm)));
    }

    end(message) {
        for (const atm of message.end)
            this.executing_tasks.delete(this.atoms.get(atm));
        this.task_end_listeners.forEach(l => l(message.end.map(atm => this.atoms.get(atm))));
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

    add_state_listener(listener) { this.state_listeners.add(listener); }
    add_timelines_listener(listener) { this.timelines_listeners.add(listener); }
    add_time_listener(listener) { this.time_listeners.add(listener); }
    add_task_start_listener(listener) { this.task_start_listeners.add(listener); }
    add_task_end_listener(listener) { this.task_end_listeners.add(listener); }

    remove_state_listener(listener) { this.state_listeners.delete(listener); }
    remove_timelines_listener(listener) { this.timelines_listeners.delete(listener); }
    remove_time_listener(listener) { this.time_listeners.delete(listener); }
    remove_task_start_listener(listener) { this.task_start_listeners.delete(listener); }
    remove_task_end_listener(listener) { this.task_end_listeners.delete(listener); }

    add_new_node_listener(listener) { this.new_node_listeners.add(listener); }
    add_node_listener(node, listener) { this.node_listeners.get(node.id).add(listener); }
    add_new_edge_listener(listener) { this.new_edge_listeners.add(listener); }
    add_edge_listener(edge, listener) { this.edge_listeners.get(edge).add(listener); }

    remove_new_node_listener(listener) { this.new_node_listeners.delete(listener); }
    remove_node_listener(node, listener) { this.node_listeners.get(node.id).delete(listener); }
    remove_new_edge_listener(listener) { this.new_edge_listeners.delete(listener); }
    remove_edge_listener(edge, listener) { this.edge_listeners.get(edge).delete(listener); }
}

export class Rule {

    constructor(id, name, content) {
        this.id = id;
        this.name = name;
        this.content = content;
    }
}