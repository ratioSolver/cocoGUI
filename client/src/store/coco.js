import { Solver, Rule } from '@/solver';
import { Type, BooleanParameter, IntegerParameter, RealParameter, StringParameter, SymbolParameter, ArrayParameter, GeometryParameter, Item } from '@/item';
import { defineStore } from 'pinia'

export const cocoStore = defineStore('coco', {
  state: () => ({
    types: new Map(),
    items: new Map(),
    solvers: new Map(),
    reactive_rules: new Map(),
    deliberative_rules: new Map()
  }),
  actions: {
    set_knowledge(data) {
      switch (data.type) {
        case 'types':
          this.types.clear();
          for (const type of data.types)
            this.add_type(type);
          break;
        case 'items':
          this.items.clear();
          for (const item of data.items)
            this.add_item(item);
          break;
        case 'solvers':
          this.solvers.clear();
          for (const solver of data.solvers)
            this.add_solver(solver);
          break;
        case 'reactive_rules':
          this.reactive_rules.clear();
          for (const rule of data.rules)
            this.add_reactive_rule(rule);
          break;
        case 'deliberative_rules':
          this.deliberative_rules.clear();
          for (const rule of data.rules)
            this.add_deliberative_rule(rule);
          break;
        default: throw new Error('Unknown knowledge update type: ' + data.type);
      }
    },
    add_type(type) {
      let static_parameters = new Map();
      for (const par of type.static_parameters)
        static_parameters[par.name] = get_parameter(par);
      let dynamic_parameters = new Map();
      for (const par of type.dynamic_parameters)
        dynamic_parameters[par.name] = get_parameter(par);
      this.types.set(type.id, new Type(type.id, type.name, type.description, static_parameters, dynamic_parameters));
    },
    update_type(type) {
      let static_parameters = new Map();
      for (const par of type.static_parameters)
        static_parameters[par.name] = get_parameter(par);
      let dynamic_parameters = new Map();
      for (const par of type.dynamic_parameters)
        dynamic_parameters[par.name] = get_parameter(par);
      this.types.get(type.id).update(type.name, type.description, static_parameters, dynamic_parameters);
    },
    remove_type(id) {
      this.types.delete(id);
    },
    add_item(item) {
      this.items.set(item.id, new Item(item.id, item.name, this.types.get(item.type), item.description, item.parameters));
    },
    update_item(item) {
      this.items.get(item.id).update(item.name, this.types.get(item.type), item.description, item.parameters);
    },
    remove_item(id) {
      this.items.delete(id);
    },
    add_solver(solver) {
      this.solvers.set(solver.id, new Solver(solver.id, solver.name, solver.state));
    },
    remove_solver(id) {
      this.solvers.delete(id);
    },
    set_solver_state(data) {
      this.solvers.get(data.id).state_changed(data);
    },
    set_solver_graph(data) {
      this.solvers.get(data.id).graph(data);
    },
    update_solver_graph(data) {
      switch (data.type) {
        case 'flaw_created':
          this.add_flaw(data);
          break;
        case 'flaw_state_changed':
          this.update_flaw_state(data);
          break;
        case 'flaw_cost_changed':
          this.update_flaw_cost(data);
          break;
        case 'flaw_position_changed':
          this.update_flaw_position(data);
          break;
        case 'current_flaw':
          this.update_current_flaw(data);
          break;
        case 'resolver_created':
          this.add_resolver(data);
          break;
        case 'resolver_state_changed':
          this.update_resolver_state(data);
          break;
        case 'current_resolver':
          this.update_current_resolver(data);
          break;
        case 'causal_link_added':
          this.add_causal_link(data);
          break;
        default: throw new Error('Unknown graph update type: ' + data.type);
      }
    },
    add_flaw(data) {
      this.solvers.get(data.solver_id).flaw_created(data);
    },
    update_flaw_state(data) {
      this.solvers.get(data.solver_id).flaw_state_changed(data);
    },
    update_flaw_cost(data) {
      this.solvers.get(data.solver_id).flaw_cost_changed(data);
    },
    update_flaw_position(data) {
      this.solvers.get(data.solver_id).flaw_position_changed(data);
    },
    update_current_flaw(data) {
      this.solvers.get(data.solver_id).current_flaw_changed(data);
    },
    add_resolver(data) {
      this.solvers.get(data.solver_id).resolver_created(data);
    },
    update_resolver_state(data) {
      this.solvers.get(data.solver_id).resolver_state_changed(data);
    },
    update_current_resolver(data) {
      this.solvers.get(data.solver_id).current_resolver_changed(data);
    },
    add_causal_link(data) {
      this.solvers.get(data.solver_id).causal_link_added(data);
    },
    update_executor_state(data) {
      switch (data.type) {
        case 'executor_state_changed':
          this.set_executor_state(data);
          break;
        case 'tick':
          this.tick(data);
          break;
        case 'starting':
          this.starting(data);
          break;
        case 'ending':
          this.ending(data);
          break;
        case 'start':
          this.start(data);
          break;
        case 'end':
          this.end(data);
          break;
        default: throw new Error('Unknown executor state update type: ' + data.type);
      }
    },
    set_executor_state(data) {
      this.solvers.get(data.id).state_changed(data);
    },
    tick(data) {
      this.solvers.get(data.id).tick(data);
    },
    starting(data) {
      this.solvers.get(data.id).starting(data);
    },
    ending(data) {
      this.solvers.get(data.id).ending(data);
    },
    start(data) {
      this.solvers.get(data.id).start(data);
    },
    end(data) {
      this.solvers.get(data.id).end(data);
    },
    add_reactive_rule(rule) {
      this.reactive_rules.set(rule.id, new Rule(rule.id, rule.name, rule.content));
    },
    remove_reactive_rule(id) {
      this.reactive_rules.delete(id);
    },
    add_deliberative_rule(rule) {
      this.deliberative_rules.set(rule.id, new Rule(rule.id, rule.name, rule.content));
    },
    remove_deliberative_rule(id) {
      this.deliberative_rules.delete(id);
    }
  }
});

function get_parameter(par) {
  switch (par.type) {
    case 'boolean': return new BooleanParameter(par.name);
    case 'integer': return new IntegerParameter(par.name, par.min === undefined ? -Infinity : par.min, par.max === undefined ? Infinity : par.max);
    case 'real': return new RealParameter(par.name, par.min === undefined ? -Infinity : par.min, par.max === undefined ? Infinity : par.max);
    case 'string': return new StringParameter(par.name);
    case 'symbol': return new SymbolParameter(par.name, par.symbols);
    case 'array': return new ArrayParameter(par.name, get_parameter(par.element));
    case 'geometry': return new GeometryParameter(par.name);
    default: throw new Error('Unknown parameter type: ' + par.type);
  }
}