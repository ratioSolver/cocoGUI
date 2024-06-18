import { Atom, Rational } from './value';

type Impulse = { at: Date };
type Interval = { from: Date, to: Date };
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
}

type SolverTimelineValue = Atom & (Impulse | Interval);

export class SolverTimeline extends Timeline<SolverTimelineValue> {

    constructor(id: string, name: string, values: SolverTimelineValue[]) {
        super(id, name, values);
    }
}

type AgentTimelineValue = Atom & (Impulse | Interval);

export class AgentTimeline extends Timeline<AgentTimelineValue> {

    constructor(id: string, name: string, values: AgentTimelineValue[]) {
        super(id, name, values);
    }
}

type StateVariableTimelineValue = { atoms: Atom[] } & Interval;

export class StateVariableTimeline extends Timeline<StateVariableTimelineValue> {

    constructor(id: string, name: string, values: StateVariableTimelineValue[]) {
        super(id, name, values);
    }
}

type ReusableResourceTimelineValue = { atoms: Atom[], amount: Rational } & Interval;

export class ReusableResourceTimeline extends Timeline<ReusableResourceTimelineValue> {

    capacity: Rational;

    constructor(id: string, name: string, capacity: Rational, values: ReusableResourceTimelineValue[]) {
        super(id, name, values);
        this.capacity = capacity;
    }
}

type ConsumableResourceTimelineValue = { atoms: Atom[], start: Rational, end: Rational } & Interval;

export class ConsumableResourceTimeline extends Timeline<ConsumableResourceTimelineValue> {

    capacity: Rational;
    initial_amount: Rational;

    constructor(id: string, name: string, capacity: Rational, initial_amount: Rational, values: ConsumableResourceTimelineValue[]) {
        super(id, name, values);
        this.capacity = capacity;
        this.initial_amount = initial_amount;
    }
}

export function get_timeline(timeline: any, atoms: Map<string, Atom>): Timeline<TimelineValue> {
    switch (timeline.type) {
        case "solver":
            return new SolverTimeline(timeline.id, timeline.name, timeline.values.map((value: any) => { if (value.at) return { at: new Date(value.at), ...atoms.get(value.atom) }; else return { from: new Date(value.from), to: new Date(value.to), ...atoms.get(value.atom) }; }));
        case "agent":
            return new AgentTimeline(timeline.id, timeline.name, timeline.values.map((value: any) => { if (value.at) return { at: new Date(value.at), ...atoms.get(value.atom) }; else return { from: new Date(value.from), to: new Date(value.to), ...atoms.get(value.atom) }; }));
        case "state_variable":
            return new StateVariableTimeline(timeline.id, timeline.name, timeline.values.map((value: any) => { return { from: new Date(value.from), to: new Date(value.to), atoms: value.atoms.map((atom: any) => atoms.get(atom)) }; }));
        case "reusable_resource":
            return new ReusableResourceTimeline(timeline.id, timeline.name, { num: timeline.capacity.num, den: timeline.capacity.den }, timeline.values.map((value: any) => { return { from: new Date(value.from), to: new Date(value.to), atoms: value.atoms.map((atom: any) => atoms.get(atom)), amount: { num: value.amount.num, den: value.amount.den } }; }));
        case "consumable_resource":
            return new ConsumableResourceTimeline(timeline.id, timeline.name, { num: timeline.capacity.num, den: timeline.capacity.den }, { num: timeline.initial_amount.num, den: timeline.initial_amount.den }, timeline.values.map((value: any) => { return { from: new Date(value.from), to: new Date(value.to), atoms: value.atoms.map((atom: any) => atoms.get(atom)), start: { num: value.start.num, den: value.start.den }, end: { num: value.end.num, den: value.end.den } }; }));
        default:
            throw new Error(`Unknown timeline type: ${timeline.type}`);
    }
}