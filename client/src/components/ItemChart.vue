<template>
  <v-container fluid :id="get_data_id(item)" :style="{ height: item.type.dynamic_parameters.size * 200 + 'px' }" />
</template>

<script setup>
import { Item, BooleanParameter, IntegerParameter, RealParameter, StringParameter, SymbolParameter, ItemListener } from '@/type';
import { onMounted, onUnmounted } from 'vue';
import Plotly from 'plotly.js-dist-min';
import chroma from 'chroma-js'

const props = defineProps({
  item: {
    type: Item,
    required: true
  }
});

const get_data_id = (item) => 'itm-' + item.id + '-data';

class ItemChart extends ItemListener {

  constructor(item) {
    super();

    this.vals_xs = [];
    this.vals_ys = new Map();
    this.y_axes = new Map();
    this.traces = new Map();
    this.layout = { autosize: true, xaxis: { title: 'Time', type: 'date' }, showlegend: false };
    this.config = { responsive: true };
    this.colors = new Map();

    item.add_listener(this);
  }

  values(values, timestamps) {
    for (const [par_name, par] of props.item.type.dynamic_parameters)
      this.vals_ys.set(par_name, []);

    for (let i = 0; i < values.length; i++) {
      this.vals_xs.push(timestamps[i]);
      for (const [par_name, par] of props.item.type.dynamic_parameters)
        if (values[i].hasOwnProperty(par_name))
          this.vals_ys.get(par_name).push(values[i][par_name]);
        else if (this.vals_ys.get(par_name).length > 0)
          this.vals_ys.get(par_name).push(this.vals_ys.get(par_name)[this.vals_ys.get(par_name).length - 1]);
        else
          this.vals_ys.get(par_name).push(par.default_value);
    }

    let i = 1;
    let start_domain = 0;
    let domain_size = 1 / props.item.type.dynamic_parameters.size;
    const domain_separator = 0.05 * domain_size;
    for (const [par_name, par] of props.item.type.dynamic_parameters) {
      if (par instanceof RealParameter || par instanceof IntegerParameter) {
        if (i == 1) {
          this.y_axes.set(par_name, 'y');
          this.traces.set(par_name, [{ x: this.vals_xs, y: this.vals_ys.get(par_name), name: par_name, type: 'scatter', yaxis: this.y_axes.get(par_name) }]);
          this.layout['yaxis'] = { title: par_name, domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, range: [par.min, par.max] };
        }
        else {
          this.y_axes.set(par_name, 'y' + i);
          this.traces.set(par_name, [{ x: this.vals_xs, y: this.vals_ys.get(par_name), name: par_name, type: 'scatter', yaxis: this.y_axes.get(par_name) }]);
          this.layout['yaxis' + i] = { title: par_name, domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, range: [par.min, par.max] };
        }
      }
      else if (par instanceof BooleanParameter || par instanceof StringParameter || par instanceof SymbolParameter) {
        this.traces.set(par_name, []);
        let c_colors = new Map();
        if (par instanceof BooleanParameter) {
          c_colors.set('true', '#00ff00');
          c_colors.set('false', '#ff0000');
          this.colors.set(par_name, c_colors);
        } else if (par instanceof SymbolParameter && par.symbols) {
          const color_scale = chroma.scale(['#ff0000', '#00ff00']).mode('lch').colors(par.symbols.length);
          for (let j = 0; j < par.symbols.length; j++)
            c_colors.set(par.symbols[j], color_scale[j]);
          this.colors.set(par_name, c_colors);
        }

        if (i == 1) {
          this.y_axes.set(par_name, 'y');
          this.layout['yaxis'] = { title: par_name, domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, showticklabels: false, showgrid: false };
        }
        else {
          this.y_axes.set(par_name, 'y' + i);
          this.layout['yaxis' + i] = { title: par_name, domain: [start_domain + domain_separator, start_domain + domain_size - domain_separator], zeroline: false, showticklabels: false, showgrid: false };
        }

        for (let j = 0; j < this.vals_ys.get(par_name).length; j++) {
          if (j > 0)
            this.traces.get(par_name)[this.traces.get(par_name).length - 1].x[1] = this.vals_xs[j];
          if (j == 0 || String(this.vals_ys.get(par_name)[j]) != this.traces.get(par_name)[this.traces.get(par_name).length - 1].name) {
            let trace = { x: [this.vals_xs[j], this.vals_xs[j]], y: [1, 1], name: String(this.vals_ys.get(par_name)[j]), type: 'scatter', opacity: 0.7, mode: 'lines', line: { width: 30 }, yaxis: this.y_axes.get(par_name) };
            if ((par instanceof BooleanParameter || par instanceof SymbolParameter) && c_colors.has(String(this.vals_ys.get(par_name)[j])))
              trace.line.color = c_colors.get(String(this.vals_ys.get(par_name)[j]));
            this.traces.get(par_name).push(trace);
          }
        }
      }

      start_domain += domain_size;
      i++;
    }

    Plotly.newPlot(get_data_id(props.item), Array.from(this.traces.values()).flat(), this.layout, this.config);
  }

  new_value(value, timestamp) {
    this.vals_xs.push(timestamp);
    for (const [par_name, par] of props.item.type.dynamic_parameters) {
      let c_value;
      if (value.hasOwnProperty(par_name))
        c_value = value[par_name];
      else if (this.vals_ys.get(par_name).length > 0)
        c_value = this.vals_ys.get(par_name)[this.vals_ys.get(par_name).length - 1];
      else
        c_value = par.default_value;
      if (par instanceof RealParameter || par instanceof IntegerParameter)
        this.traces.get(par_name)[0].y.push(c_value);
      else if (par instanceof BooleanParameter || par instanceof StringParameter || par instanceof SymbolParameter) {
        if (this.traces.get(par_name).length > 0)
          this.traces.get(par_name)[this.traces.get(par_name).length - 1].x[1] = timestamp;
        if (this.traces.get(par_name).length == 0 || String(c_value) != this.traces.get(par_name)[this.traces.get(par_name).length - 1].name) {
          let trace = { x: [timestamp, timestamp], y: [1, 1], name: String(c_value), type: 'scatter', opacity: 0.7, mode: 'lines', line: { width: 30 }, yaxis: this.y_axes.get(par_name) };
          if (par instanceof BooleanParameter || (par instanceof SymbolParameter && this.colors.has(par_name)))
            trace.line.color = this.colors.get(par_name).get(String(c_value));
          this.traces.get(par_name).push(trace);
        }
      }
    }
    this.layout.datarevision = timestamp;
    Plotly.react(get_data_id(props.item), Array.from(this.traces.values()).flat(), this.layout, this.config);
  }
}

let item_chart;

onMounted(() => {
  item_chart = new ItemChart(props.item);
});

onUnmounted(() => {
  props.item.remove_listener(item_chart);
  Plotly.purge(get_data_id(props.item));
  item_chart = null;
});
</script>