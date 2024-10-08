<template>
  <div :id="get_timelines_id(props.slv)"></div>
</template>

<script setup lang="ts">
import { solver } from '@/solver';
import { values } from '@/values';
import { timelines } from '@/timelines';
import { onMounted, onUnmounted } from 'vue';
import Plotly from 'plotly.js-dist-min';

const props = defineProps<{ slv: solver.Solver; }>();

const get_timelines_id = (solver: solver.Solver) => 'slv-' + solver.id + '-timelines';

class TimelinesChart extends solver.SolverListener {

  private origin: number;
  private horizon: number;
  private y_axes: Map<string, string>;
  private traces: Map<string, any[]>;
  private layout = {
    autosize: true,
    xaxis: { title: 'Time' },
    showlegend: false,
    shapes: [
      {
        type: 'line',
        x0: 0,
        y0: 0,
        x1: 0,
        y1: 1,
        xref: 'x',
        yref: 'paper',
        line: {
          color: 'darkgrey',
          width: 2
        }
      }
    ]
  } as any;
  private config = { responsive: true, displaylogo: false };

  constructor(solver: solver.Solver) {
    super();

    this.origin = 0;
    this.horizon = 1;
    this.y_axes = new Map();
    this.traces = new Map();

    solver.add_listener(this);
  }

  state(items: Map<number, values.Item>, atoms: Map<number, values.Atom>, exprs: Map<string, values.Value>, timelines: Map<string, timelines.Timeline<timelines.TimelineValue>>, executing_tasks: Set<values.Atom>, time: values.Rational, state: solver.State): void {
    if (exprs.size == 0) {
      this.origin = 0;
      this.horizon = 1;
    } else {
      this.origin = (exprs.get('origin') as values.Real).val.to_number();
      this.horizon = (exprs.get('horizon') as values.Real).val.to_number();
    }
    this.recompute_timelines(timelines);
    Plotly.react(get_timelines_id(props.slv), Array.from(this.traces.values()).flat(), this.layout, this.config);
  }

  tick(time: values.Rational): void {
    this.layout.shapes[0].x0 = time.to_number();
    this.layout.shapes[0].x1 = time.to_number();
    this.layout.datarevision = Date.now();
    Plotly.relayout(get_timelines_id(props.slv), this.layout);
  }

  recompute_timelines(tls: Map<string, timelines.Timeline<timelines.TimelineValue>>): void {
    let i = 1;
    let start_domain = 0;
    this.y_axes.clear();
    this.traces.clear();
    if (tls.size == 0)
      return;

    let domain_size = 1 / tls.size;
    const domain_separator = 0.05 * domain_size;
    for (const [id, tl] of tls) {
      if (i == 1)
        this.y_axes.set(id, 'y');
      else
        this.y_axes.set(id, 'y' + i);
      this.traces.set(id, []);

      if (tl instanceof timelines.SolverTimeline) {
        const slv_ends = [0];
        for (const val of tl.values) {
          const from = val.exprs.has('at') ? (val.exprs.get('at') as values.Real).val.to_number() : (val.exprs.get('start') as values.Real).val.to_number();
          const to = val.exprs.has('at') ? from + 1 : (val.exprs.get('end') as values.Real).val.to_number();
          const y = values_y(from, from === to ? from + 0.1 : to, slv_ends);
          const text = timelines.SolverTimeline.value_title(val);
          this.traces.get(id)!.push({ x: [from, to], y: [y, y], name: text, text: [text], type: 'scatter', opacity: 0.7, mode: 'lines+text', line: { width: 30 }, textposition: 'middle right', yaxis: this.y_axes.get(id) });
        }
        if (i == 1)
          this.layout['yaxis'] = { title: timelines.Timeline.timeline_name(tl), domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, showticklabels: false, showgrid: false };
        else
          this.layout['yaxis' + i] = { title: timelines.Timeline.timeline_name(tl), domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, showticklabels: false, showgrid: false };
      }

      if (tl instanceof timelines.AgentTimeline) {
        const agnt_ends = [0];
        for (const val of tl.values) {
          const from = val.exprs.has('at') ? (val.exprs.get('at') as values.Real).val.to_number() : (val.exprs.get('start') as values.Real).val.to_number();
          const to = val.exprs.has('at') ? from + 1 : (val.exprs.get('end') as values.Real).val.to_number();
          const y = values_y(from, from === to ? from + 0.1 : to, agnt_ends);
          const text = timelines.AgentTimeline.value_title(val);
          this.traces.get(id)!.push({ x: [from, to], y: [y, y], name: text, text: [text], type: 'scatter', opacity: 0.7, mode: 'lines+text', line: { width: 30 }, textposition: 'middle right', yaxis: this.y_axes.get(id) });
        }
        if (i == 1)
          this.layout['yaxis'] = { title: timelines.Timeline.timeline_name(tl), domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, showticklabels: false, showgrid: false };
        else
          this.layout['yaxis' + i] = { title: timelines.Timeline.timeline_name(tl), domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, showticklabels: false, showgrid: false };
      }

      if (tl instanceof timelines.StateVariableTimeline) {
        for (const val of tl.values) {
          const text = timelines.StateVariableTimeline.value_title(val);
          this.traces.get(id)!.push({ x: [val.from, val.to], y: [i, i], name: text, text: [text], type: 'scatter', opacity: 0.7, mode: 'lines+text', line: { width: 30 }, textposition: 'middle right', yaxis: this.y_axes.get(id) });
        }
        if (i == 1)
          this.layout['yaxis'] = { title: timelines.Timeline.timeline_name(tl), domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, showticklabels: false, showgrid: false };
        else
          this.layout['yaxis' + i] = { title: timelines.Timeline.timeline_name(tl), domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, showticklabels: false, showgrid: false };
      }

      if (tl instanceof timelines.ReusableResourceTimeline) {
        const vals_xs = [this.origin];
        const vals_ys = [0];
        for (const val of tl.values) {
          vals_xs.push(val.from.to_number());
          vals_ys.push(val.usage.to_number());
          vals_xs.push(val.to.to_number());
          vals_ys.push(val.usage.to_number());
        }
        vals_xs.push(this.horizon);
        vals_ys.push(0);
        this.traces.get(id)!.push({ x: vals_xs, y: vals_ys, name: timelines.Timeline.timeline_name(tl), type: 'scatter', opacity: 0.7, mode: 'lines', fill: 'tozeroy', yaxis: this.y_axes.get(id) });
        this.traces.get(id)!.push({ x: [this.origin, this.horizon], y: [tl.capacity, tl.capacity], name: 'Capacity', type: 'scatter', opacity: 0.7, mode: 'lines', yaxis: this.y_axes.get(id) });
        if (i == 1)
          this.layout['yaxis'] = { title: timelines.Timeline.timeline_name(tl), domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, range: [0, tl.capacity] };
        else
          this.layout['yaxis' + i] = { title: timelines.Timeline.timeline_name(tl), domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, range: [0, tl.capacity] };
      }

      if (tl instanceof timelines.ConsumableResourceTimeline) {
        const vals_xs = [this.origin];
        const vals_ys = [tl.initial_amount.to_number()];
        for (const val of tl.values) {
          vals_xs.push(val.from.to_number());
          vals_ys.push(val.start.to_number());
          vals_xs.push(val.to.to_number());
          vals_ys.push(val.end.to_number());
        }
        vals_xs.push(this.horizon);
        if (tl.values.length > 0)
          vals_ys.push(tl.values[tl.values.length - 1].end.to_number());
        else
          vals_ys.push(tl.initial_amount.to_number());
        this.traces.get(id)!.push({ x: vals_xs, y: vals_ys, name: timelines.Timeline.timeline_name(tl), type: 'scatter', opacity: 0.7, mode: 'lines', fill: 'tozeroy', yaxis: this.y_axes.get(id) });
        this.traces.get(id)!.push({ x: [this.origin, this.horizon], y: [tl.capacity, tl.capacity], name: 'Capacity', type: 'scatter', opacity: 0.7, mode: 'lines', yaxis: this.y_axes.get(id) });
        if (i == 1)
          this.layout['yaxis'] = { title: timelines.Timeline.timeline_name(tl), domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, range: [0, tl.capacity] };
        else
          this.layout['yaxis' + i] = { title: timelines.Timeline.timeline_name(tl), domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, range: [0, tl.capacity] };
      }

      start_domain += domain_size;
      i++;
    }
  }
}

let timelines_chart = null as TimelinesChart | null;

onMounted(() => {
  timelines_chart = new TimelinesChart(props.slv);
});

onUnmounted(() => {
  props.slv.remove_listener(timelines_chart!);
});
</script>

<script lang="ts">
function values_y(start: number, end: number, ends: number[]): number {
  for (let i = 0; i < ends.length; i++)
    if (ends[i] <= start) {
      ends[i] = end;
      return i;
    }
  ends.push(end);
  return ends.length - 1;
}
</script>