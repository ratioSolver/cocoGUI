import { Knowledge } from '@/knowledge';
import { Solver } from '@/solver';
import { defineStore } from 'pinia'

export const useCoCoStore = defineStore('CoCo', {
  state: () => ({
    knowledge: new Knowledge(),
    solvers: new Map()
  }),
  actions: {
    update(data) {
      switch (data.type) {
        case 'types':
          this.knowledge.set_types(data.types);
          return true;
        case 'new_type':
          this.knowledge.add_type(data);
          return true;
        case 'updated_type':
          this.knowledge.update_type(data);
          return true;
        case 'deleted_type':
          this.knowledge.remove_type(data.id);
          return true;
        case 'items':
          this.knowledge.set_items(data.items);
          return true;
        case 'new_item':
          this.knowledge.add_item(data);
          return true;
        case 'updated_item':
          this.knowledge.update_item(data);
          return true;
        case 'deleted_item':
          this.knowledge.remove_item(data.id);
          return true;
        case 'reactive_rules':
          this.knowledge.set_reactive_rules(data.rules);
          return true;
        case 'new_reactive_rule':
          this.knowledge.add_reactive_rule(data);
          return true;
        case 'updated_reactive_rule':
          this.knowledge.update_reactive_rule(data);
          return true;
        case 'deleted_reactive_rule':
          this.knowledge.remove_reactive_rule(data.id);
          return true;
        case 'deliberative_rules':
          this.knowledge.set_deliberative_rules(data.rules);
          return true;
        case 'new_deliberative_rule':
          this.knowledge.add_deliberative_rule(data);
          return true;
        case 'updated_deliberative_rule':
          this.knowledge.update_deliberative_rule(data);
          return true;
        case 'deleted_deliberative_rule':
          this.knowledge.remove_deliberative_rule(data.id);
          return true;
        case 'solvers':
          this.solvers.clear();
          for (let solver of data.solvers)
            this.solvers.set(solver.id, new Solver(solver.id, solver.name, solver.state));
          return true;
        case 'new_solver':
          this.solvers.set(data.id, new Solver(data.id, data.name, data.state));
          return true;
        case 'deleted_solver':
          this.solvers.delete(data.id);
          return true;
        case 'solver_state':
          this.solvers.get(data.id).set_state(data);
          return true;
        case 'solver_graph':
          this.solvers.get(data.id).set_graph(data);
          return true;
        case 'flaw_created':
          this.solvers.get(data.solver_id).flaw_created(data);
          return true;
        case 'flaw_state_changed':
          this.solvers.get(data.solver_id).flaw_state_changed(data);
          return true;
        case 'flaw_cost_changed':
          this.solvers.get(data.solver_id).flaw_cost_changed(data);
          return true;
        case 'flaw_position_changed':
          this.solvers.get(data.solver_id).flaw_position_changed(data);
          return true;
        case 'current_flaw':
          this.solvers.get(data.solver_id).current_flaw_changed(data);
          return true;
        case 'resolver_created':
          this.solvers.get(data.solver_id).resolver_created(data);
          return true;
        case 'resolver_state_changed':
          this.solvers.get(data.solver_id).resolver_state_changed(data);
          return true;
        case 'current_resolver':
          this.solvers.get(data.solver_id).current_resolver_changed(data);
          return true;
        case 'causal_link_added':
          this.solvers.get(data.solver_id).causal_link_added(data);
          return true;
        case 'solver_execution_state_changed':
          this.solvers.get(data.id).set_execution_state(data);
          return true;
        case 'tick':
          this.solvers.get(data.id).tick(data);
          return true;
        case 'starting':
          this.solvers.get(data.id).starting(data);
          return true;
        case 'ending':
          this.solvers.get(data.id).ending(data);
          return true;
        case 'start':
          this.solvers.get(data.id).start(data);
          return true;
        case 'end':
          this.solvers.get(data.id).end(data);
          return true;
        default:
          return false;
      }
    }
  }
});