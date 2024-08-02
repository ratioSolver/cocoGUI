<template>
  <v-container fluid :id="get_data_id(item)" :style="{ height: dynamic_properties.size * 200 + 'px' }" />
</template>

<script setup lang="ts">
import { coco } from '@/type';
import Plotly from 'plotly.js-dist-min';
import chroma from 'chroma-js'
import { onMounted, onUnmounted } from 'vue';

const props = defineProps<{ item: coco.Item; }>();
const dynamic_properties = coco.Type.dynamic_properties(props.item.type);

const get_data_id = (item: coco.Item) => 'itm-' + item.id + '-data';

class ItemChart extends coco.ItemListener {

  vals_xs: Date[];
  vals_ys: Map<string, any[]>;
  y_axes: Map<string, string>;
  traces: Map<string, any[]>;
  private layout: any;
  private config: any;
  colors: Map<string, Map<string, string>>;

  constructor(item: coco.Item) {
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

  values(values: coco.Data[]): void {
    for (const par_name of dynamic_properties.keys())
      this.vals_ys.set(par_name, []);

    for (const val of values) {
      this.vals_xs.push(val.timestamp);
      for (const [par_name, par] of dynamic_properties)
        if (val.data.hasOwnProperty(par_name))
          this.vals_ys.get(par_name)!.push(val.data[par_name]);
        else if (this.vals_ys.get(par_name)!.length > 0)
          this.vals_ys.get(par_name)!.push(this.vals_ys.get(par_name)![this.vals_ys.get(par_name)!.length - 1]);
        else
          this.vals_ys.get(par_name)!.push(par.default_value);
    }

    let i = 1;
    let start_domain = 0;
    const domain_size = 1 / dynamic_properties.size;
    const domain_separator = 0.05 * domain_size;
    for (const [par_name, par] of dynamic_properties) {
      if (par instanceof coco.RealProperty || par instanceof coco.IntegerProperty) {
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
      else if (par instanceof coco.BooleanProperty || par instanceof coco.StringProperty || par instanceof coco.SymbolProperty || par instanceof coco.ItemProperty) {
        this.traces.set(par_name, []);
        let c_colors: Map<string, string> = new Map();
        if (par instanceof coco.BooleanProperty) {
          c_colors.set('true', '#00ff00');
          c_colors.set('false', '#ff0000');
          this.colors.set(par_name, c_colors);
        } else if (par instanceof coco.SymbolProperty && par.symbols) {
          const color_scale = chroma.scale(['#ff0000', '#00ff00']).mode('lch').colors(par.symbols.length);
          for (let j = 0; j < par.symbols.length; j++)
            c_colors.set(par.symbols[j], color_scale[j]);
          this.colors.set(par_name, c_colors);
        } else if (par instanceof coco.ItemProperty) {
          const color_scale = chroma.scale(['#ff0000', '#00ff00']).mode('lch').colors(par.type.instances.size);
          c_colors.set('null', '#000000');
          let j = 0;
          for (const item of par.type.instances.values())
            c_colors.set(item.id, color_scale[j++]);
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

        for (let j = 0; j < this.vals_ys.get(par_name)!.length; j++) {
          if (j > 0) // Update the end of the previous trace
            this.traces.get(par_name)![this.traces.get(par_name)!.length - 1].x[1] = this.vals_xs[j];
          const c_val = this.vals_ys.get(par_name)![j];
          let trace = { x: [this.vals_xs[j], this.vals_xs[j]], y: [1, 1], name: undefined as string | undefined, type: 'scatter', opacity: 0.7, mode: 'lines', line: { width: 30, color: undefined as string | undefined }, yaxis: this.y_axes.get(par_name) };
          if (par instanceof coco.BooleanProperty || par instanceof coco.StringProperty || par instanceof coco.SymbolProperty) {
            trace.name = c_val;
            if (c_colors.has(c_val))
              trace.line.color = c_colors.get(c_val);
            if (!trace.name) {
              trace.name = '';
              trace.line.color = 'rgba(0, 0, 0, 0)';
            }
          } else if (par instanceof coco.ItemProperty) {
            trace.name = c_val.name;
            trace.line.color = c_colors.get(c_val.id);
            if (!trace.name) {
              trace.name = '';
              trace.line.color = 'rgba(0, 0, 0, 0)';
            }
          }
          this.traces.get(par_name)!.push(trace);
        }
      }

      start_domain += domain_size;
      i++;
    }

    Plotly.newPlot(get_data_id(props.item), Array.from(this.traces.values()).flat(), this.layout, this.config);
  }

  new_value(value: coco.Data): void {
    this.vals_xs.push(value.timestamp);
    for (const [par_name, par] of dynamic_properties) {
      let c_value;
      if (value.data.hasOwnProperty(par_name))
        c_value = value.data[par_name];
      else if (this.vals_ys.get(par_name)!.length > 0)
        c_value = this.vals_ys.get(par_name)![this.vals_ys.get(par_name)!.length - 1];
      else
        c_value = par.default_value;
      if (par instanceof coco.RealProperty || par instanceof coco.IntegerProperty)
        this.traces.get(par_name)![0].y.push(c_value);
      else if (par instanceof coco.BooleanProperty || par instanceof coco.StringProperty || par instanceof coco.SymbolProperty || par instanceof coco.ItemProperty) {
        if (this.traces.get(par_name)!.length > 0) // Update the end of the previous trace
          this.traces.get(par_name)![this.traces.get(par_name)!.length - 1].x[1] = value.timestamp;
        let trace = { x: [value.timestamp, value.timestamp], y: [1, 1], name: undefined as string | undefined, type: 'scatter', opacity: 0.7, mode: 'lines', line: { width: 30, color: undefined as string | undefined }, yaxis: this.y_axes.get(par_name) };
        if (par instanceof coco.BooleanProperty || par instanceof coco.StringProperty || par instanceof coco.SymbolProperty) {
          trace.name = c_value;
          if (this.colors.get(par_name)!.has(c_value))
            trace.line.color = this.colors.get(par_name)!.get(c_value);
        } else if (par instanceof coco.ItemProperty) {
          trace.name = c_value.name;
          trace.line.color = this.colors.get(par_name)!.get(c_value.id);
        }
        this.traces.get(par_name)!.push(trace);
      }
    }
    this.layout.datarevision = value.timestamp;
    Plotly.react(get_data_id(props.item), Array.from(this.traces.values()).flat(), this.layout, this.config);
  }
}

let item_chart: ItemChart | null = null

onMounted(() => {
  item_chart = new ItemChart(props.item);
});

onUnmounted(() => {
  props.item.remove_listener(item_chart!);
  Plotly.purge(get_data_id(props.item));
  item_chart = null;
});
</script>