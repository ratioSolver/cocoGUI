import { ratio } from "./value";

type Impulse = { at: ratio.InfRational };
type Interval = { from: ratio.InfRational, to: ratio.InfRational };
export type TimelineValue = Impulse | Interval;

export class Timeline<V extends TimelineValue> {

    id: string;
    name: string;
    values: V[];

    constructor(id: string, name: string, values: V[]) {
        this.id = id;
        this.name = name;
        this.values = values;
    }

    static timeline_name(tl: Timeline<any>): string {
        return tl.name;
    }
}

type SolverTimelineValue = ratio.Atom & (Impulse | Interval);

export class SolverTimeline extends Timeline<SolverTimelineValue> {

    constructor(id: string, name: string, values: SolverTimelineValue[]) {
        super(id, name, values);
    }

    static value_title(value: SolverTimelineValue): string {
        return ratio.Atom.atom_title(value);
    }

    static value_content(value: SolverTimelineValue): string {
        return ratio.Atom.atom_content(value);
    }
}

type AgentTimelineValue = ratio.Atom & (Impulse | Interval);

export class AgentTimeline extends Timeline<AgentTimelineValue> {

    constructor(id: string, name: string, values: AgentTimelineValue[]) {
        super(id, name, values);
    }

    static value_title(value: AgentTimelineValue): string {
        return ratio.Atom.atom_title(value);
    }

    static value_content(value: AgentTimelineValue): string {
        return ratio.Atom.atom_content(value);
    }
}

type StateVariableTimelineValue = { atoms: ratio.Atom[] } & Interval;

export class StateVariableTimeline extends Timeline<StateVariableTimelineValue> {

    constructor(id: string, name: string, values: StateVariableTimelineValue[]) {
        super(id, name, values);
    }

    static value_title(value: StateVariableTimelineValue): string {
        switch (value.atoms.length) {
            case 0:
                return "[]";
            case 1:
                return ratio.Atom.atom_title(value.atoms[0]);
            default:
                return `[${value.atoms.map(ratio.Atom.atom_title).join(", ")}]`;
        }
    }

    static value_content(value: StateVariableTimelineValue): string {
        switch (value.atoms.length) {
            case 0:
                return "[]";
            case 1:
                return ratio.Atom.atom_content(value.atoms[0]);
            default:
                return `[${value.atoms.map(ratio.Atom.atom_content).join(", ")}]`;
        }
    }
}

type ReusableResourceTimelineValue = { atoms: ratio.Atom[], usage: ratio.Rational } & Interval;

export class ReusableResourceTimeline extends Timeline<ReusableResourceTimelineValue> {

    capacity: ratio.InfRational;

    constructor(id: string, name: string, capacity: ratio.InfRational, values: ReusableResourceTimelineValue[]) {
        super(id, name, values);
        this.capacity = capacity;
    }

    static value_content(value: ReusableResourceTimelineValue): string {
        switch (value.atoms.length) {
            case 0:
                return `0 - [${value.from.to_number()}, ${value.to.to_number()}]`;
            case 1:
                return `${value.usage.to_number()} - [${value.from.to_number()}, ${value.to.to_number()}]<br> ${ratio.Atom.atom_content(value.atoms[0])}`;
            default:
                return `${value.usage.to_number()} - [${value.from.to_number()}, ${value.to.to_number()}]<br> [${value.atoms.map(ratio.Atom.atom_content).join(", ")}]`;
        }
    }
}

type ConsumableResourceTimelineValue = { atoms: ratio.Atom[], start: ratio.InfRational, end: ratio.InfRational } & Interval;

export class ConsumableResourceTimeline extends Timeline<ConsumableResourceTimelineValue> {

    capacity: ratio.InfRational;
    initial_amount: ratio.InfRational;

    constructor(id: string, name: string, capacity: ratio.InfRational, initial_amount: ratio.InfRational, values: ConsumableResourceTimelineValue[]) {
        super(id, name, values);
        this.capacity = capacity;
        this.initial_amount = initial_amount;
    }

    static value_content(value: ConsumableResourceTimelineValue): string {
        switch (value.atoms.length) {
            case 0:
                return `${value.start.to_number()} - ${value.end.to_number()} - [${value.from.to_number()}, ${value.to.to_number()}]`;
            case 1:
                return `${value.start.to_number()} - ${value.end.to_number()} - [${value.from.to_number()}, ${value.to.to_number()}]<br> ${ratio.Atom.atom_content(value.atoms[0])}`;
            default:
                return `${value.start.to_number()} - ${value.end.to_number()} - [${value.from.to_number()}, ${value.to.to_number()}]<br> [${value.atoms.map(ratio.Atom.atom_content).join(", ")}]`;
        }
    }
}

export function get_timeline(timeline: any, atoms: Map<string, ratio.Atom>): Timeline<TimelineValue> {
    switch (timeline.type) {
        case "solver":
            return new SolverTimeline(timeline.id, timeline.name, timeline.values.map((value: any) => { if (value.at) return { at: ratio.get_inf_rational(value.at), ...atoms.get(value.atom) }; else return { from: ratio.get_inf_rational(value.from), to: ratio.get_inf_rational(value.to), ...atoms.get(value.atom) }; }));
        case "agent":
            return new AgentTimeline(timeline.id, timeline.name, timeline.values.map((value: any) => { if (value.at) return { at: ratio.get_inf_rational(value.at), ...atoms.get(value.atom) }; else return { from: ratio.get_inf_rational(value.from), to: ratio.get_inf_rational(value.to), ...atoms.get(value.atom) }; }));
        case "state_variable":
            return new StateVariableTimeline(timeline.id, timeline.name, timeline.values.map((value: any) => { return { from: ratio.get_inf_rational(value.from), to: ratio.get_inf_rational(value.to), atoms: value.atoms.map((atom: any) => atoms.get(atom)) }; }));
        case "reusable_resource":
            return new ReusableResourceTimeline(timeline.id, timeline.name, ratio.get_inf_rational(timeline.capacity), timeline.values.map((value: any) => { return { from: ratio.get_inf_rational(value.from), to: ratio.get_inf_rational(value.to), atoms: value.atoms.map((atom: any) => atoms.get(atom)), usage: ratio.get_inf_rational(value.usage) }; }));
        case "consumable_resource":
            return new ConsumableResourceTimeline(timeline.id, timeline.name, ratio.get_inf_rational(timeline.capacity), ratio.get_inf_rational(timeline.initial_amount), timeline.values.map((value: any) => { return { from: ratio.get_inf_rational(value.from), to: ratio.get_inf_rational(value.to), atoms: value.atoms.map((atom: any) => atoms.get(atom)), start: ratio.get_inf_rational(value.start), end: ratio.get_inf_rational(value.end) }; }));
        default:
            throw new Error(`Unknown timeline type: ${timeline.type}`);
    }
}