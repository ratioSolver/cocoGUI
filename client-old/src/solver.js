/**
 * Represents a listener for solver events.
 */
export class SolverListener {

    /**
     * Sets the state of the solver.
     *
     * @param {any} state - The state to set.
     */
    state(state) { }

    /**
     * Sets the graph data for the solver.
     *
     * @param {Graph} graph - The graph object.
     */
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

    constructor(id, name, executor_state) {
        this.id = id;
        this.name = name;
        this.executor_state = executor_state;

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
     * Sets the state of the solver based on the given state message.
     * 
     * @param {Object} state_message - The state message containing the updated state information.
     */
    set_state(state_message) {
        this.items.clear(); if (state_message.items) for (const itm of state_message.items) this.items.set(parseInt(itm.id), itm);
        this.atoms.clear(); if (state_message.atoms) for (const atm of state_message.atoms) this.atoms.set(parseInt(atm.id), atm);

        this.exprs = this.exprs_to_map(state_message.exprs);
        for (const itm of this.items.values())
            if (itm.exprs)
                itm.exprs = this.exprs_to_map(itm.exprs);
        for (const atm of this.atoms.values())
            if (atm.exprs)
                atm.exprs = this.exprs_to_map(atm.exprs);

        const origin_var = this.exprs.get('origin');
        const horizon_var = this.exprs.get('horizon');
        this.origin = origin_var.val.num / origin_var.val.den;
        this.horizon = horizon_var.val.num / horizon_var.val.den;

        this.timelines.clear();
        if (state_message.timelines)
            for (const tl of state_message.timelines)
                this.timelines.set(tl.id, tl);

        this.executing_tasks.clear();
        if (state_message.executing)
            for (const atm of state_message.executing)
                this.executing_tasks.add(this.atoms.get(atm));

        this.current_time = state_message.time.num / state_message.time.den;

        this.listeners.forEach(l => l.state(this));
    }

    /**
     * Sets the graph data for the solver.
     * 
     * @param {Object} graph_message - The graph message containing the flaws and resolvers.
     */
    set_graph(graph_message) {
        this.flaws.clear();
        this.edges.clear();
        this.current_flaw = undefined;
        this.current_resolver = undefined;

        for (const f of graph_message.flaws) {
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

        for (const r of graph_message.resolvers) {
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
            resolver.cost = this._estimate_cost(resolver);
            resolver.label = this.resolver_label(resolver);
            resolver.title = this.resolver_tooltip(resolver);
            this.resolvers.set(resolver.id, resolver);
        }

        if (graph_message.current_flaw) {
            this.current_flaw = this.nodes.get(graph_message.current_flaw);
            this.current_flaw.current = true;
            if (graph_message.current_resolver) {
                this.current_resolver = this.nodes.get(graph_message.current_resolver);
                this.current_resolver.current = true;
            }
        }

        this.listeners.forEach(l => l.graph(this));
    }

    /**
     * Creates a flaw based on the provided flaw_created_message.
     * 
     * @param {Object} flaw_created_message - The message containing the flaw details.
     * @param {string} flaw_created_message.id - The ID of the flaw.
     * @param {string} flaw_created_message.phi - The phi value of the flaw.
     * @param {string[]} flaw_created_message.causes - The causes of the flaw.
     * @param {string} flaw_created_message.state - The state of the flaw.
     * @param {Object} flaw_created_message.cost - The cost of the flaw.
     * @param {Object} flaw_created_message.data - The data of the flaw.
     */
    create_flaw(flaw_created_message) {
        const flaw = {
            reasoner: this,
            id: flaw_created_message.id,
            phi: flaw_created_message.phi,
            causes: flaw_created_message.causes,
            state: flaw_created_message.state,
            cost: flaw_created_message.cost.num / flaw_created_message.cost.den,
            pos: { lb: 0 },
            data: flaw_created_message.data
        };
        flaw.label = this.flaw_label(flaw);
        flaw.title = this.flaw_tooltip(flaw);
        this.flaws.set(flaw.id, flaw);
        for (const c_id of flaw.causes) {
            const cause = this.resolvers.get(c_id);
            cause.preconditions.push(flaw.id);
            const c_res_cost = this._estimate_cost(cause);
            if (cause.cost != c_res_cost) {
                cause.cost = c_res_cost;
                cause.title = this.resolver_tooltip(cause);
                this.listeners.forEach(l => l.resolver_cost_changed(cause));
            }
        }
        this.listeners.forEach(l => l.flaw_created(flaw));
    }

    /**
     * Sets the state of a flaw based on the provided flaw state changed message.
     *
     * @param {Object} flaw_state_changed_message - The message containing the flaw ID and the new state.
     * @param {string} flaw_state_changed_message.id - The ID of the flaw.
     * @param {string} flaw_state_changed_message.state - The new state of the flaw.
     */
    set_flaw_state(flaw_state_changed_message) {
        const flaw = this.flaws.get(flaw_state_changed_message.id);
        flaw.state = flaw_state_changed_message.state;
        this.listeners.forEach(l => l.flaw_state_changed(flaw));
    }

    /**
     * Sets the cost of a flaw and updates the costs of its causes.
     *
     * @param {Object} flaw_cost_changed_message - The message containing the flaw ID and the new cost.
     * @param {string} flaw_cost_changed_message.id - The ID of the flaw.
     * @param {Object} flaw_cost_changed_message.cost - The new cost of the flaw.
     */
    set_flaw_cost(flaw_cost_changed_message) {
        const flaw = this.flaws.get(flaw_cost_changed_message.id);
        flaw.cost = flaw_cost_changed_message.cost.num / flaw_cost_changed_message.cost.den;
        flaw.title = this.flaw_tooltip(flaw);

        for (const c_id of flaw.causes) {
            const cause = this.resolvers.get(c_id);
            const c_res_cost = this._estimate_cost(cause);
            if (cause.cost != c_res_cost) {
                cause.cost = c_res_cost;
                cause.title = this.resolver_tooltip(cause);
                this.listeners.forEach(l => l.resolver_cost_changed(cause));
            }
        }
        this.listeners.forEach(l => l.flaw_cost_changed(flaw));
    }

    /**
     * Sets the position of a flaw and updates its title.
     * 
     * @param {Object} flaw_position_changed_message - The message containing the flaw ID and new position.
     * @param {string} flaw_position_changed_message.id - The ID of the flaw.
     * @param {Object} flaw_position_changed_message.pos - The new position of the flaw.
     */
    set_flaw_position(flaw_position_changed_message) {
        const flaw = this.flaws.get(flaw_position_changed_message.id);
        flaw.pos = flaw_position_changed_message.pos;
        flaw.title = this.flaw_tooltip(flaw);
        this.listeners.forEach(l => l.flaw_position_changed(flaw));
    }

    /**
     * Sets the current flaw and updates the listeners accordingly.
     * 
     * @param {Object} current_flaw_message - The current flaw message object.
     * @param {string} current_flaw_message.id - The ID of the current flaw.
     */
    set_current_flaw(current_flaw_message) {
        if (this.current_flaw) {
            this.current_flaw.current = false;
            this.listeners.forEach(l => l.current_flaw_changed(this.current_flaw));
        }
        if (this.current_resolver) {
            this.current_resolver.current = false;
            this.listeners.forEach(l => l.current_resolver_changed(this.current_resolver));
        }
        this.current_resolver = undefined;
        this.current_flaw = this.flaws.get(current_flaw_message.id);
        this.current_flaw.current = true;
        this.listeners.forEach(l => l.current_flaw_changed(this.current_flaw));
    }

    /**
     * Creates a resolver object and adds it to the resolvers collection.
     * 
     * @param {Object} resolver_created_message - The message containing the details of the resolver to be created.
     * @param {string} resolver_created_message.id - The ID of the resolver.
     * @param {string} resolver_created_message.rho - The rho value of the resolver.
     * @param {string[]} resolver_created_message.preconditions - The preconditions of the resolver.
     * @param {string} resolver_created_message.flaw - The flaw that the resolver is for.
     * @param {string} resolver_created_message.state - The state of the resolver.
     * @param {Object} resolver_created_message.intrinsic_cost - The intrinsic cost of the resolver.
     * @param {Object} resolver_created_message.data - The data of the resolver.
     */
    create_resolver(resolver_created_message) {
        const resolver = {
            reasoner: this,
            id: resolver_created_message.id,
            rho: resolver_created_message.rho,
            preconditions: resolver_created_message.preconditions,
            flaw: resolver_created_message.flaw,
            state: resolver_created_message.state,
            intrinsic_cost: resolver_created_message.intrinsic_cost.num / resolver_created_message.intrinsic_cost.den,
            data: resolver_created_message.data
        };
        resolver.cost = this._estimate_cost(resolver);
        resolver.label = this.resolver_label(resolver);
        resolver.title = this.resolver_tooltip(resolver);
        this.resolvers.set(resolver.id, resolver);
        this.listeners.forEach(l => l.resolver_created(resolver));
    }

    /**
     * Sets the state of a resolver based on the provided resolver_state_changed_message.
     *
     * @param {Object} resolver_state_changed_message - The message containing the resolver ID and new state.
     * @param {string} resolver_state_changed_message.id - The ID of the resolver.
     * @param {string} resolver_state_changed_message.state - The new state of the resolver.
     */
    set_resolver_state(resolver_state_changed_message) {
        const resolver = this.resolvers.get(resolver_state_changed_message.id);
        resolver.state = resolver_state_changed_message.state;
        resolver.cost = this._estimate_cost(resolver);
        resolver.title = this.resolver_tooltip(resolver);
        this.listeners.forEach(l => l.resolver_state_changed(resolver));
    }

    /**
     * Sets the current resolver based on the provided current_resolver_changed_message.
     *
     * @param {Object} current_resolver_changed_message - The message containing the ID of the new current resolver.
     * @param {string} current_resolver_changed_message.id - The ID of the new current resolver.
     */
    set_current_resolver(current_resolver_changed_message) {
        if (this.current_resolver) {
            this.current_resolver.current = false;
            this.listeners.forEach(l => l.current_resolver_changed(this.current_resolver));
        }
        this.current_resolver = this.resolvers.get(current_resolver_changed_message.id);
        this.current_resolver.current = true;
        this.listeners.forEach(l => l.current_resolver_changed(this.current_resolver));
    }

    /**
     * Adds a causal link between a flaw and a resolver.
     * 
     * @param {Object} causal_link_added_message - The message containing information about the causal link.
     * @param {string} causal_link_added_message.flaw_id - The ID of the flaw.
     * @param {string} causal_link_added_message.resolver_id - The ID of the resolver.
     */
    add_causal_link(causal_link_added_message) {
        const flaw = this.flaws.get(causal_link_added_message.flaw_id);
        const resolver = this.resolvers.get(causal_link_added_message.resolver_id);
        resolver.preconditions.push(flaw.id);
        flaw.causes.push(resolver.id);
        this.listeners.forEach(l => l.causal_link_added({ from: flaw, to: resolver }));
        resolver.cost = this._estimate_cost(resolver);
        resolver.title = this.resolver_tooltip(resolver);
        this.listeners.forEach(l => l.resolver_cost_changed(resolver));
    }

    _estimate_cost(res) {
        if (!res.state) return Number.POSITIVE_INFINITY;
        return (res.preconditions.length ? Math.max.apply(this, res.preconditions.map(f_id => this.nodes.get(f_id).cost)) : 0) + res.intrinsic_cost;
    }

    /**
     * Sets the execution state of the solver.
     * 
     * @param {Object} message - The message containing the state information.
     * @param {string} message.state - The new state of the solver.
     */
    set_execution_state(message) {
        this.executor_state = message.state;

        switch (this.executor_state) {
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

    /**
     * Updates the current time and notifies all listeners.
     * 
     * @param {Object} tick_message - The tick message containing the time information.
     * @param {number} tick_message.time - The time of the tick.
     * @returns {void}
     */
    tick(tick_message) {
        this.current_time = tick_message.time.num / tick_message.time.den;
        this.listeners.forEach(l => l.tick(this.current_time));
    }

    /**
     * Handles the starting event.
     *
     * @param {Object} starting_message - The starting message object.
     * @param {string[]} starting_message.starting - The IDs of the starting tasks.
     */
    starting(starting_message) {
        console.log('starting');
        for (const atm of starting_message.starting)
            console.log(this.atom_content(this.atoms.get(atm)));
        this.listeners.forEach(l => l.starting(starting_message.starting.map(atm => this.atoms.get(atm))));
    }

    /**
     * Starts the solver with the given start message.
     * 
     * @param {Object} start_message - The start message containing the atoms to be executed.
     * @param {string[]} start_message.start - The IDs of the atoms to be executed.
     */
    start(start_message) {
        for (const atm of start_message.start)
            this.executing_tasks.add(this.atoms.get(atm));
        this.listeners.forEach(l => l.start(start_message.start.map(atm => this.atoms.get(atm))));
    }

    /**
     * Handles the ending of the solver.
     * 
     * @param {Object} ending_message - The ending message object.
     * @param {string[]} ending_message.ending - The IDs of the ending tasks.
     */
    ending(ending_message) {
        console.log('ending');
        for (const atm of ending_message.ending)
            console.log(this.atom_content(this.atoms.get(atm)));
        this.listeners.forEach(l => l.ending(ending_message.ending.map(atm => this.atoms.get(atm))));
    }

    /**
     * Handles the end of the solver execution.
     *
     * @param {Object} end_message - The end message containing the atoms to be removed.
     * @param {string[]} end_message.end - The IDs of the atoms to be removed.
     */
    end(end_message) {
        for (const atm of end_message.end)
            this.executing_tasks.delete(this.atoms.get(atm));
        this.listeners.forEach(l => l.end(end_message.end.map(atm => this.atoms.get(atm))));
    }

    /**
     * Returns the name of a timeline.
     * 
     * @param {Timeline} tl - The timeline object.
     * @returns {string} The name of the timeline.
     */
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
    add_listener(listener) {
        this.listeners.add(listener);
        listener.state(this);
        listener.graph(this);
    }

    /**
     * Removes a listener from the solver.
     * 
     * @param {SolverListener} listener - The listener to remove.
     */
    remove_listener(listener) { this.listeners.delete(listener); }
}