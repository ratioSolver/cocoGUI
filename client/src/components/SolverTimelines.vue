<template>
  <v-container :id='get_timelines_id(solver)' />
</template>

<script setup>
import { Solver, SolverListener } from '@/solver';
import { onMounted, onUnmounted } from 'vue';
import Plotly from 'plotly.js-dist-min';

const props = defineProps({
  solver: {
    type: Solver,
    required: true
  }
});

const get_timelines_id = (solver) => 'slv-' + solver.id + '-timelines';

class TimelinesListener extends SolverListener {

  constructor(solver) {
    super();
    this.y_axes = new Map();
    this.traces = new Map();

    this.layout = {
      autosize: true,
      xaxis: { title: 'Time' },
      showlegend: false,
      shapes: [
        {
          type: 'line',
          x0: props.solver.origin,
          y0: 0,
          x1: props.solver.origin,
          y1: 1,
          xref: 'x',
          yref: 'paper',
          line: {
            color: 'darkgrey',
            width: 2
          }
        }
      ]
    };
    this.config = { responsive: true };

    solver.add_listener(this);
  }

  state(state) {
    this.recompute_timelines();
    Plotly.react(get_timelines_id(props.solver), Array.from(this.traces.values()).flat(), this.layout, this.config);
  }


  tick(time) {
    this.layout.shapes[0].x0 = time;
    this.layout.shapes[0].x1 = time;
    this.layout.datarevision = Date.now();
    Plotly.relayout(get_timelines_id(props.solver), this.layout);
  }

  recompute_timelines() {
    let i = 1;
    let start_domain = 0;
    this.y_axes.clear();
    this.traces.clear();
    if (props.solver.timelines.size == 0)
      return;

    let domain_size = 1 / props.solver.timelines.size;
    const domain_separator = 0.05 * domain_size;
    for (const [id, tl] of props.solver.timelines) {
      if (i == 1)
        this.y_axes.set(id, 'y');
      else
        this.y_axes.set(id, 'y' + i);
      this.traces.set(id, []);
      switch (tl.type) {
        case 'Solver':
          tl.values = tl.values.map(atm_id => props.solver.atoms.get(atm_id));
          const slv_ends = [0];
          for (const val of tl.values) {
            if (val.exprs.has('at')) {
              val.from = val.exprs.get('at').value.num / val.exprs.get('at').value.den;
              val.to = val.from + 1;
            } else {
              val.from = val.exprs.get('start').value.num / val.exprs.get('start').value.den;
              val.to = val.exprs.get('end').value.num / val.exprs.get('end').value.den;
            }
            val.y = values_y(val.from, val.from === val.to ? val.from + 0.1 : val.to, slv_ends);
            val.text = props.solver.slv_value_title(val);
            this.traces.get(id).push({ x: [val.from, val.to], y: [val.y, val.y], name: val.text, text: [val.text], type: 'scatter', opacity: 0.7, mode: 'lines+text', line: { width: 30 }, textposition: 'middle right', yaxis: this.y_axes.get(id) });
          }
          if (i == 1)
            this.layout['yaxis'] = { title: props.solver.timeline_name(tl), domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, showticklabels: false, showgrid: false };
          else
            this.layout['yaxis' + i] = { title: props.solver.timeline_name(tl), domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, showticklabels: false, showgrid: false };
          break;
        case 'Agent':
          tl.values = tl.values.map(atm_id => props.solver.atoms.get(atm_id));
          const agnt_ends = [0];
          for (const val of tl.values) {
            if (val.exprs.has('at')) {
              val.from = val.exprs.get('at').value.num / val.exprs.get('at').value.den;
              val.to = val.from + 1;
            } else {
              val.from = val.exprs.get('start').value.num / val.exprs.get('start').value.den;
              val.to = val.exprs.get('end').value.num / val.exprs.get('end').value.den;
            }
            val.y = values_y(val.from, val.from === val.to ? val.from + 0.1 : val.to, agnt_ends);
            val.text = props.solver.ag_value_title(val);
            this.traces.get(id).push({ x: [val.from, val.to], y: [val.y, val.y], name: val.text, text: [val.text], type: 'scatter', opacity: 0.7, mode: 'lines+text', line: { width: 30 }, textposition: 'middle right', yaxis: this.y_axes.get(id) });
          }
          if (i == 1)
            this.layout['yaxis'] = { title: props.solver.timeline_name(tl), domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, showticklabels: false, showgrid: false };
          else
            this.layout['yaxis' + i] = { title: props.solver.timeline_name(tl), domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, showticklabels: false, showgrid: false };
          break;
        case 'StateVariable':
          for (const val of tl.values) {
            val.from = val.from.num / val.from.den;
            val.to = val.to.num / val.to.den;
            val.text = props.solver.sv_value_title(val);
            val.atoms = val.atoms.map(atm_id => props.solver.atoms.get(atm_id));
            this.traces.get(id).push({ x: [val.from, val.to], y: [i, i], name: val.text, text: [val.text], type: 'scatter', opacity: 0.7, mode: 'lines+text', line: { width: 30 }, textposition: 'middle right', yaxis: this.y_axes.get(id) });
          }
          if (i == 1)
            this.layout['yaxis'] = { title: props.solver.timeline_name(tl), domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, showticklabels: false, showgrid: false };
          else
            this.layout['yaxis' + i] = { title: props.solver.timeline_name(tl), domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, showticklabels: false, showgrid: false };
          break;
        case 'ReusableResource': {
          tl.capacity = tl.capacity.num / tl.capacity.den;
          const vals_xs = [props.solver.origin];
          const vals_ys = [0];
          for (const val of tl.values) {
            val.from = val.from.num / val.from.den;
            val.to = val.to.num / val.to.den;
            val.usage = val.usage.num / val.usage.den;
            val.atoms = val.atoms.map(atm_id => props.solver.atoms.get(atm_id));
            vals_xs.push(val.from);
            vals_ys.push(val.usage);
            vals_xs.push(val.to);
            vals_ys.push(val.usage);
          }
          vals_xs.push(props.solver.horizon);
          vals_ys.push(0);
          this.traces.get(id).push({ x: vals_xs, y: vals_ys, name: props.solver.timeline_name(tl), type: 'scatter', opacity: 0.7, mode: 'lines', fill: 'tozeroy', yaxis: this.y_axes.get(id) });
          this.traces.get(id).push({ x: [props.solver.origin, props.solver.horizon], y: [tl.capacity, tl.capacity], name: 'Capacity', type: 'scatter', opacity: 0.7, mode: 'lines', yaxis: this.y_axes.get(id) });
          if (i == 1)
            this.layout['yaxis'] = { title: props.solver.timeline_name(tl), domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, range: [0, tl.capacity] };
          else
            this.layout['yaxis' + i] = { title: props.solver.timeline_name(tl), domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, range: [0, tl.capacity] };
          break;
        }
        case 'ConsumableResource': {
          tl.initial_amount = tl.initial_amount.num / tl.initial_amount.den;
          tl.capacity = tl.capacity.num / tl.capacity.den;
          const vals_xs = [props.solver.origin];
          const vals_ys = [tl.initial_amount];
          for (const val of tl.values) {
            val.from = val.from.num / val.from.den;
            val.to = val.to.num / val.to.den;
            val.start = val.start.num / val.start.den;
            val.end = val.end.num / val.end.den;
            val.atoms = val.atoms.map(atm_id => this.atoms.get(atm_id));
            vals_xs.push(val.from);
            vals_ys.push(val.start);
            vals_xs.push(val.to);
            vals_ys.push(val.end);
          }
          vals_xs.push(props.solver.horizon);
          if (tl.values.length > 0)
            vals_ys.push(tl.values[tl.values.length - 1].end);
          else
            vals_ys.push(tl.initial_amount);
          this.traces.get(id).push({ x: vals_xs, y: vals_ys, name: props.solver.timeline_name(tl), type: 'scatter', opacity: 0.7, mode: 'lines', fill: 'tozeroy', yaxis: this.y_axes.get(id) });
          this.traces.get(id).push({ x: [props.solver.origin, props.solver.horizon], y: [tl.capacity, tl.capacity], name: 'Capacity', type: 'scatter', opacity: 0.7, mode: 'lines', yaxis: this.y_axes.get(id) });
          if (i == 1)
            this.layout['yaxis'] = { title: props.solver.timeline_name(tl), domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, range: [0, tl.capacity] };
          else
            this.layout['yaxis' + i] = { title: props.solver.timeline_name(tl), domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, range: [0, tl.capacity] };
          break;
        }
      }

      start_domain += domain_size;
      i++;
    }
  }
}

let listener;

onMounted(() => {
  listener = new TimelinesListener(props.solver);
});

onUnmounted(() => {
  props.solver.remove_listener(listener);
  Plotly.purge(get_timelines_id(props.solver));
  listener = null;
});
</script>

<script>
function values_y(start, end, ends) {
  for (let i = 0; i < ends.length; i++)
    if (ends[i] <= start) {
      ends[i] = end;
      return i;
    }
  ends.push(end);
  return ends.length - 1;
}
</script>