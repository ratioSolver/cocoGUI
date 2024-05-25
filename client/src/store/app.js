import { Solver, Rule } from '@/solver';
import { Type, BooleanParameter, IntegerParameter, RealParameter, StringParameter, SymbolParameter, Item } from '@/item';
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    types: new Map(),
    items: new Map(),
    solvers: new Map(),
    reactive_rules: new Map(),
    deliberative_rules: new Map(),
    messages: [],
  }),
  actions: {
    connect(url = 'ws://localhost:8080/coco', timeout = 1000) {
      this.socket = new WebSocket(url);
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.socket.send(JSON.stringify({ 'type': 'login' }));
      };
      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        setTimeout(() => { this.connect(url, timeout); }, timeout);
      };
      this.socket.onerror = (error) => {
        console.log('WebSocket Error: ' + error);
      };
      this.socket.onmessage = (msg) => {
        let data = JSON.parse(msg.data);
        console.log(data);
        switch (data.type) {
          case 'types':
            this.types.clear();
            for (const type of data.types) {
              let static_parameters = new Map();
              for (const par of type.static_parameters)
                static_parameters[par.name] = get_parameter(par);
              let dynamic_parameters = new Map();
              for (const par of type.dynamic_parameters)
                dynamic_parameters[par.name] = get_parameter(par);
              this.types.set(type.id, new Type(type.id, type.name, type.description, static_parameters, dynamic_parameters));
            }
            break;
          case 'items':
            this.items.clear();
            for (const item of data.items) {
              let parameters = new Map();
              for (const par of item.parameters)
                parameters[par.name] = get_parameter(par);
              this.items.set(item.id, new Item(item.id, item.name, this.types.get(item.type), item.description, parameters));
            }
            break;
          case 'reactive_rules':
            this.reactive_rules.clear();
            for (const rule of data.rules)
              this.reactive_rules.set(rule.id, new Rule(rule.id, rule.name, rule.content));
            break;
          case 'deliberative_rules':
            this.deliberative_rules.clear();
            for (const rule of data.rules)
              this.deliberative_rules.set(rule.id, new Rule(rule.id, rule.name, rule.content));
            break;
          case 'solvers':
            this.solvers.clear();
            for (const solver of data.solvers)
              this.solvers.set(solver.id, new Solver(solver.id, solver.name, solver.state));
            break;
          case 'new_executor':
            this.solvers.set(data.id, new Solver(data.id, data.name, data.state));
            break;
          case 'deleted_executor':
            this.solvers.delete(data.id);
            break;
          case 'executor_state':
            this.solvers.get(data.id).state_changed(data);
            break;
          case 'graph':
            this.solvers.get(data.id).graph(data);
            break;
          case 'flaw_created':
            this.solvers.get(data.solver_id).flaw_created(data);
            break;
          case 'flaw_state_changed':
            this.solvers.get(data.solver_id).flaw_state_changed(data);
            break;
          case 'flaw_cost_changed':
            this.solvers.get(data.solver_id).flaw_cost_changed(data);
            break;
          case 'flaw_position_changed':
            this.solvers.get(data.solver_id).flaw_position_changed(data);
            break;
          case 'current_flaw':
            this.solvers.get(data.solver_id).current_flaw_changed(data);
            break;
          case 'resolver_created':
            this.solvers.get(data.solver_id).resolver_created(data);
            break;
          case 'resolver_state_changed':
            this.solvers.get(data.solver_id).resolver_state_changed(data);
            break;
          case 'current_resolver':
            this.solvers.get(data.solver_id).current_resolver_changed(data);
            break;
          case 'causal_link_added':
            this.solvers.get(data.solver_id).causal_link_added(data);
            break;
          case 'executor_state_changed':
            this.solvers.get(data.id).state = data.state;
            break;
          case 'tick':
            this.solvers.get(data.id).tick(data);
            break;
          case 'starting':
            this.solvers.get(data.id).starting(data);
            break;
          case 'ending':
            this.solvers.get(data.id).ending(data);
            break;
          case 'start':
            this.solvers.get(data.id).start(data);
            break;
          case 'end':
            this.solvers.get(data.id).end(data);
            break;
        }
      };
    },
    send_message(message) {
      this.messages.push({ 'me': true, 'timestamp': new Date(), 'text': message });
    }
  }
})

function get_parameter(par) {
  switch (par.type) {
    case 'boolean': return new BooleanParameter(par.name);
    case 'integer': return new IntegerParameter(par.name, par.min === undefined ? -Infinity : par.min, par.max === undefined ? Infinity : par.max);
    case 'real': return new RealParameter(par.name, par.min === undefined ? -Infinity : par.min, par.max === undefined ? Infinity : par.max);
    case 'string': return new StringParameter(par.name);
    case 'symbol': return new SymbolParameter(par.name, par.symbols);
    default: throw new Error('Unknown parameter type: ' + par.type);
  }
}