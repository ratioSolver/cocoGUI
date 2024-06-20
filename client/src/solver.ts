import { Flaw, Resolver, State } from "./graph";
import { ratio } from "./value";
import { Timeline, TimelineValue, get_timeline } from "./timelines";

/**
 * Represents a listener for solver events.
 */
export class SolverListener {

    constructor() { }

    /**
     * Notifies the listener that the solver state has changed.
     * 
     * @param items The items in the solver.
     * @param atoms The atoms in the solver.
     * @param exprs The expressions in the solver.
     * @param timelines The timelines in the solver.
     * @param executing_tasks The tasks that are executing.
     * @param time The current time.
     * @param state The new solver state.
     */
    state(items: Map<string, ratio.Item>, atoms: Map<string, ratio.Atom>, exprs: Map<string, ratio.Value>, timelines: Map<string, Timeline<TimelineValue>>, executing_tasks: Set<ratio.Atom>, time: ratio.Rational, state: SolverState): void { }

    /**
     * Notifies the listener that the solver graph has changed.
     * 
     * @param flaws The flaws in the graph.
     * @param resolvers The resolvers in the graph.
     * @param current_flaw The current flaw.
     * @param current_resolver The current resolver.
     */
    graph(flaws: Flaw[], resolvers: Resolver[], current_flaw: Flaw, current_resolver: Resolver): void { }

    /**
     * Notifies the listener that a flaw has been created.
     * 
     * @param flaw The created flaw.
     */
    flaw_created(flaw: Flaw): void { }
    /**
     * Notifies the listener that a flaw has changed state.
     * 
     * @param flaw The flaw that changed state.
     */
    flaw_state_changed(flaw: Flaw): void { }
    /**
     * Notifies the listener that a flaw has changed cost.
     * 
     * @param flaw The flaw that changed cost.
     */
    flaw_cost_changed(flaw: Flaw): void { }
    /**
     * Notifies the listener that a flaw has changed position.
     * 
     * @param flaw The flaw that changed position.
     */
    flaw_position_changed(flaw: Flaw): void { }
    /**
     * Notifies the listener that the current flaw has been set.
     * 
     * @param flaw The current flaw.
     */
    current_flaw_changed(flaw: Flaw): void { }
    /**
     * Notifies the listener that the current resolver has been set.
     * 
     * @param resolver The current resolver.
     */
    resolver_created(resolver: Resolver): void { }
    /**
     * Notifies the listener that a resolver has changed state.
     * 
     * @param resolver The resolver that changed state.
     */
    resolver_state_changed(resolver: Resolver): void { }
    /**
     * Notifies the listener that a resolver has changed cost.
     * 
     * @param resolver The resolver that changed cost.
     */
    resolver_cost_changed(resolver: Resolver): void { }
    /**
     * Notifies the listener that the current resolver has been set.
     * 
     * @param resolver The current resolver.
     * @param old_resolver The old current resolver.
     */
    current_resolver_changed(resolver: Resolver): void { }
    /**
     * Notifies the listener that a causal link has been added.
     * 
     * @param flaw The flaw that has a new causal link.
     * @param resolver The resolver that is the cause of the new causal link.
     */
    causal_link_added(flaw: Flaw, resolver: Resolver): void { }

    /**
     * Notifies the listener that the solver's state has changed.
     * 
     * @param state The new solver state.
     */
    executor_state_changed(state: SolverState): void { }
    /**
     * Notifies the listener that the solver's time has changed.
     * 
     * @param time The new solver time.
     */
    tick(time: ratio.Rational): void { }
    /**
     * Notifies the listener that some tasks are starting.
     * 
     * @param tasks The tasks that are starting.
     */
    starting(tasks: Set<ratio.Atom>): void { }
    /**
     * Notifies the listener that some tasks are ending.
     * 
     * @param tasks The tasks that are ending.
     */
    ending(tasks: Set<ratio.Atom>): void { }
    /**
     * Notifies the listener that some tasks are executing.
     * 
     * @param tasks The tasks that are executing.
     */
    start(tasks: Set<ratio.Atom>): void { }
    /**
     * Notifies the listener that some tasks are finishing.
     * 
     * @param tasks The tasks that are finishing.
     */
    end(tasks: Set<ratio.Atom>): void { }
}

export enum SolverState {
    reasoning,
    idle,
    adapting,
    executing,
    finished,
    failed
}

export class Solver {

    id: string;
    name: string;
    state: SolverState;

    items: Map<string, ratio.Item>;
    atoms: Map<string, ratio.Atom>;
    exprs: Map<string, ratio.Value>;
    timelines: Map<string, Timeline<TimelineValue>>;
    executing_tasks: Set<ratio.Atom>;
    current_time: ratio.Rational = new ratio.Rational(0, 1);

    flaws: Map<string, Flaw>;
    resolvers: Map<string, Resolver>;
    current_flaw?: Flaw;
    current_resolver?: Resolver;

    listeners: Set<SolverListener> = new Set();

    constructor(id: string, name: string, state: SolverState) {
        this.id = id;
        this.name = name;
        this.state = state;

        this.items = new Map();
        this.atoms = new Map();
        this.exprs = new Map();
        this.timelines = new Map();
        this.executing_tasks = new Set();

        this.flaws = new Map();
        this.resolvers = new Map();
    }

    set_state(state_message: any): void {
        this.items.clear();
        this.atoms.clear();
        this.exprs.clear();

        if (state_message.items) {
            for (const item of state_message.items)
                this.items.set(item.id, { id: item.id, type: item.type, name: item.name, exprs: new Map() });
            for (const item of state_message.items)
                if (item.exprs)
                    for (const [id, xpr] of Object.entries(item.exprs))
                        this.items.get(item.id)!.exprs.set(id, ratio.get_value(xpr, this.items));
        }
        if (state_message.atoms) {
            for (const atom of state_message.atoms)
                this.atoms.set(atom.id, { id: atom.id, type: atom.type, name: atom.name, exprs: new Map(), is_fact: atom.is_fact, sigma: atom.sigma, state: ratio.AtomState[atom.state as keyof typeof ratio.AtomState] });
            for (const atom of state_message.atoms)
                if (atom.exprs)
                    for (const [id, xpr] of Object.entries(atom.exprs))
                        this.atoms.get(atom.id)!.exprs.set(id, ratio.get_value(xpr, this.items));
        }
        for (const [id, xpr] of Object.entries(state_message.exprs))
            this.exprs.set(id, ratio.get_value(xpr, this.items));

        this.timelines.clear();
        if (state_message.timelines)
            for (const timeline of state_message.timelines)
                this.timelines.set(timeline.id, get_timeline(timeline, this.atoms));

        this.executing_tasks.clear();
        if (state_message.executing_tasks)
            for (const task of state_message.executing_tasks)
                this.executing_tasks.add(this.atoms.get(task)!);

        this.current_time = new ratio.Rational(state_message.time.num, state_message.time.den);

        for (const listener of this.listeners)
            listener.state(this.items, this.atoms, this.exprs, this.timelines, this.executing_tasks, this.current_time, this.state);
    }

    set_graph(graph_message: any): void {
        this.flaws.clear();
        this.resolvers.clear();
        for (const flaw of graph_message.flaws)
            this.flaws.set(flaw.id, new Flaw(flaw.id, flaw.phi, [], State[flaw.state as keyof typeof State], flaw.cost.num / flaw.cost.den, flaw.pos, flaw.data));
        for (const resolver of graph_message.resolvers)
            this.resolvers.set(resolver.id, new Resolver(resolver.id, resolver.rho, [], this.flaws.get(resolver.flaw)!, State[resolver.state as keyof typeof State], resolver.intrinsic_cost.num / resolver.intrinsic_cost.den, resolver.data));
        for (const flaw of graph_message.flaws)
            this.flaws.get(flaw.id)!.causes = flaw.causes.map((cause: string) => this.resolvers.get(cause)!);
        for (const resolver of graph_message.resolvers)
            this.resolvers.get(resolver.id)!.preconditions = resolver.preconditions.map((precondition: string) => this.flaws.get(precondition)!);
        this.current_flaw = graph_message.current_flaw ? this.flaws.get(graph_message.current_flaw)! : undefined;
        this.current_resolver = graph_message.current_resolver ? this.resolvers.get(graph_message.current_resolver)! : undefined;

        for (const listener of this.listeners)
            listener.graph(Array.from(this.flaws.values()), Array.from(this.resolvers.values()), this.current_flaw!, this.current_resolver!);
    }

    create_flaw(flaw_created_message: any): void {
        const flaw = new Flaw(flaw_created_message.id, flaw_created_message.phi, [], State[flaw_created_message.state as keyof typeof State], flaw_created_message.cost.num / flaw_created_message.cost.den, flaw_created_message.pos, flaw_created_message.data);
        for (const cause of flaw_created_message.causes)
            flaw.causes.push(this.resolvers.get(cause)!);
        this.flaws.set(flaw_created_message.id, flaw);
        this.listeners.forEach(listener => listener.flaw_created(flaw));
    }

    set_flaw_state(flaw_state_changed_message: any): void {
        const flaw = this.flaws.get(flaw_state_changed_message.id)!;
        flaw.set_state(State[flaw_state_changed_message.state as keyof typeof State]);
        this.listeners.forEach(listener => listener.flaw_state_changed(flaw));
    }

    set_flaw_cost(flaw_cost_changed_message: any): void {
        const flaw = this.flaws.get(flaw_cost_changed_message.id)!;
        flaw.set_cost(flaw_cost_changed_message.cost.num / flaw_cost_changed_message.cost.den);
        this.listeners.forEach(listener => listener.flaw_cost_changed(flaw));
    }

    set_flaw_position(flaw_position_changed_message: any): void {
        const flaw = this.flaws.get(flaw_position_changed_message.id)!;
        flaw.set_pos(flaw_position_changed_message.position);
        this.listeners.forEach(listener => listener.flaw_position_changed(flaw));
    }

    set_current_flaw(current_flaw_changed_message: any): void {
        if (this.current_resolver) {
            this.current_resolver.current = false;
            this.listeners.forEach(listener => listener.current_resolver_changed(this.current_resolver!));
            this.current_resolver = undefined;
        }
        this.current_flaw = this.flaws.get(current_flaw_changed_message.id)!;
        this.listeners.forEach(listener => listener.current_flaw_changed(this.current_flaw!));
    }

    create_resolver(resolver_created_message: any): void {
        const resolver = new Resolver(resolver_created_message.id, resolver_created_message.rho, [], this.flaws.get(resolver_created_message.flaw)!, State[resolver_created_message.state as keyof typeof State], resolver_created_message.intrinsic_cost.num / resolver_created_message.intrinsic_cost.den, resolver_created_message.data);
        for (const precondition of resolver_created_message.preconditions)
            resolver.preconditions.push(this.flaws.get(precondition)!);
        this.resolvers.set(resolver_created_message.id, resolver);
        this.listeners.forEach(listener => listener.resolver_created(resolver));
    }

    set_resolver_state(resolver_state_changed_message: any): void {
        const resolver = this.resolvers.get(resolver_state_changed_message.id)!;
        resolver.set_state(State[resolver_state_changed_message.state as keyof typeof State]);
        this.listeners.forEach(listener => listener.resolver_state_changed(resolver));
    }

    set_resolver_cost(resolver_cost_changed_message: any): void {
        const resolver = this.resolvers.get(resolver_cost_changed_message.id)!;
        resolver.set_cost(resolver_cost_changed_message.cost.num / resolver_cost_changed_message.cost.den);
        this.listeners.forEach(listener => listener.resolver_cost_changed(resolver));
    }

    set_current_resolver(current_resolver_changed_message: any): void {
        this.current_resolver = this.resolvers.get(current_resolver_changed_message.id)!;
        this.listeners.forEach(listener => listener.current_resolver_changed(this.current_resolver!));
    }

    add_causal_link(causal_link_added_message: any): void {
        const flaw = this.flaws.get(causal_link_added_message.flaw)!;
        const resolver = this.resolvers.get(causal_link_added_message.resolver)!;
        flaw.causes.push(resolver);
        resolver.preconditions.push(flaw);
        this.listeners.forEach(listener => listener.causal_link_added(flaw, resolver));
        resolver.cost = Resolver.estimate_cost(resolver);
        resolver.tooltip = Resolver.resolver_tooltip(resolver);
        this.listeners.forEach(listener => listener.resolver_cost_changed(resolver));
    }

    set_execution_state(message: any): void {
        this.state = SolverState[message.state as keyof typeof SolverState];
        this.listeners.forEach(listener => listener.executor_state_changed(this.state));
        switch (this.state) {
            case SolverState.idle:
            case SolverState.executing:
            case SolverState.finished:
            case SolverState.failed:
                if (this.current_resolver) {
                    this.current_resolver.current = false;
                    this.listeners.forEach(listener => listener.current_resolver_changed(this.current_resolver!));
                    this.current_resolver = undefined;
                    this.current_flaw!.current = false;
                    this.listeners.forEach(listener => listener.current_flaw_changed(this.current_flaw!));
                    this.current_flaw = undefined;
                }
        }
    }

    tick(tick_message: any): void {
        this.current_time = new ratio.Rational(tick_message.time.num, tick_message.time.den);
        this.listeners.forEach(listener => listener.tick(tick_message.time));
    }

    starting(starting_message: any): void {
        const tasks: Set<ratio.Atom> = new Set(starting_message.tasks.map((task: string) => this.atoms.get(task)!));
        this.listeners.forEach(listener => listener.starting(tasks));
    }

    ending(ending_message: any): void {
        const tasks: Set<ratio.Atom> = new Set(ending_message.tasks.map((task: string) => this.atoms.get(task)!));
        this.listeners.forEach(listener => listener.ending(tasks));
    }

    start(start_message: any): void {
        const tasks: Set<ratio.Atom> = new Set(start_message.tasks.map((task: string) => this.atoms.get(task)!));
        this.listeners.forEach(listener => listener.start(tasks));
    }

    end(end_message: any): void {
        const tasks: Set<ratio.Atom> = new Set(end_message.tasks.map((task: string) => this.atoms.get(task)!));
        this.listeners.forEach(listener => listener.end(tasks));
    }

    add_listener(listener: SolverListener): void {
        this.listeners.add(listener);
        listener.state(this.items, this.atoms, this.exprs, this.timelines, this.executing_tasks, this.current_time, this.state);
        listener.graph(Array.from(this.flaws.values()), Array.from(this.resolvers.values()), this.current_flaw!, this.current_resolver!);
    }

    remove_listener(listener: SolverListener): void {
        this.listeners.delete(listener);
    }
}