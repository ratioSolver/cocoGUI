<template>
  <n-grid y-gap="12" :cols="1">
    <n-grid-item>
      <n-date-picker v-model:value="range" type="daterange"
        :is-date-disabled="(date: number) => date <= new Date().getDate()" clearable
        @confirm="coco.KnowledgeBase.getInstance().load_data(item, range[0], range[1])" />
    </n-grid-item>
    <n-grid-item>
      <div :id="get_data_id(props.item)" :style="{ height: dynamic_props.size * 200 + 'px' }"></div>
    </n-grid-item>
  </n-grid>
</template>

<script setup lang="ts">
import { NGrid, NGridItem, NDatePicker } from 'naive-ui';
import { coco } from '@/coco';
import { taxonomy } from '@/taxonomy';
import Plotly from 'plotly.js-dist-min';
import chroma from 'chroma-js'
import { ref, onMounted, onUnmounted } from 'vue';

const range = ref<[number, number]>([new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).getTime(), new Date().getTime()]);

const props = defineProps<{ item: taxonomy.Item; }>();
if (!props.item.values.length)
  coco.KnowledgeBase.getInstance().load_data(props.item, range.value[0], range.value[1]);
const dynamic_props = taxonomy.dynamic_properties(props.item.type);

const get_data_id = (item: taxonomy.Item) => 'itm-' + item.id + '-data';

class ItemChart extends taxonomy.ItemListener {

  vals_xs: Date[];
  vals_ys: Map<string, any[]>;
  y_axes: Map<string, string>;
  traces: Map<string, any[]>;
  private layout: any;
  private config: any;
  colors: Map<string, Map<string, string>>;

  constructor(item: taxonomy.Item) {
    super();

    this.vals_xs = [];
    this.vals_ys = new Map();
    this.y_axes = new Map();
    this.traces = new Map();
    this.layout = { autosize: true, xaxis: { title: 'Time', type: 'date' }, showlegend: false };
    this.config = { responsive: true, displaylogo: false };
    this.colors = new Map();

    item.add_listener(this);
  }

  values(values: taxonomy.Data[]): void {
    for (const par_name of dynamic_props.keys())
      this.vals_ys.set(par_name, []);

    for (const val of values) {
      this.vals_xs.push(val.timestamp);
      for (const [par_name, par] of dynamic_props)
        if (val.data.hasOwnProperty(par_name))
          this.vals_ys.get(par_name)!.push(val.data[par_name]);
        else if (this.vals_ys.get(par_name)!.length > 0)
          this.vals_ys.get(par_name)!.push(this.vals_ys.get(par_name)![this.vals_ys.get(par_name)!.length - 1]);
        else
          this.vals_ys.get(par_name)!.push(par.default_value);
    }

    let i = 1;
    let start_domain = 0;
    const domain_size = 1 / dynamic_props.size;
    const domain_separator = 0.05 * domain_size;
    for (const [par_name, par] of dynamic_props) {
      if (par instanceof taxonomy.RealProperty || par instanceof taxonomy.IntegerProperty) {
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
      else if (par instanceof taxonomy.BooleanProperty || par instanceof taxonomy.StringProperty || par instanceof taxonomy.SymbolProperty || par instanceof taxonomy.ItemProperty) {
        this.traces.set(par_name, []);
        let c_colors: Map<string, string> = new Map();
        if (par instanceof taxonomy.BooleanProperty) {
          c_colors.set('true', '#00ff00');
          c_colors.set('false', '#ff0000');
          this.colors.set(par_name, c_colors);
        } else if (par instanceof taxonomy.SymbolProperty && par.symbols) {
          const color_scale = chroma.scale(['#ff0000', '#00ff00']).mode('lch').colors(par.symbols.length);
          for (let j = 0; j < par.symbols.length; j++)
            c_colors.set(par.symbols[j], color_scale[j]);
          this.colors.set(par_name, c_colors);
        } else if (par instanceof taxonomy.ItemProperty) {
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
          this.traces.get(par_name)!.push({ x: [this.vals_xs[j], this.vals_xs[j]], y: [1, 1], name: get_name(c_val, par), type: 'scatter', opacity: 0.7, mode: 'lines', line: { width: 30, color: get_color(c_val, par, c_colors) }, yaxis: this.y_axes.get(par_name) });
        }
      }

      start_domain += domain_size;
      i++;
    }

    Plotly.newPlot(get_data_id(props.item), Array.from(this.traces.values()).flat(), this.layout, this.config);
  }

  new_value(value: taxonomy.Data): void {
    this.vals_xs.push(value.timestamp);
    for (const [par_name, par] of dynamic_props) {
      let c_value;
      if (value.data.hasOwnProperty(par_name))
        c_value = value.data[par_name];
      else if (this.vals_ys.get(par_name)!.length > 0)
        c_value = this.vals_ys.get(par_name)![this.vals_ys.get(par_name)!.length - 1];
      else
        c_value = par.default_value;
      if (par instanceof taxonomy.RealProperty || par instanceof taxonomy.IntegerProperty)
        this.traces.get(par_name)![0].y.push(c_value);
      else if (par instanceof taxonomy.BooleanProperty || par instanceof taxonomy.StringProperty || par instanceof taxonomy.SymbolProperty || par instanceof taxonomy.ItemProperty) {
        if (this.traces.get(par_name)!.length > 0) // Update the end of the previous trace
          this.traces.get(par_name)![this.traces.get(par_name)!.length - 1].x[1] = value.timestamp;
        this.traces.get(par_name)!.push({ x: [value.timestamp, value.timestamp], y: [1, 1], name: get_name(c_value, par), type: 'scatter', opacity: 0.7, mode: 'lines', line: { width: 30, color: get_color(c_value, par, this.colors.get(par_name)!) }, yaxis: this.y_axes.get(par_name) });
      }
    }
    this.layout.datarevision = value.timestamp;
    Plotly.react(get_data_id(props.item), Array.from(this.traces.values()).flat(), this.layout, this.config);
  }
}

let item_chart: ItemChart | null = null

onMounted(() => {
  if (dynamic_props.size)
    item_chart = new ItemChart(props.item);
});

onUnmounted(() => {
  if (item_chart)
    props.item.remove_listener(item_chart);
});
</script>

<script lang="ts">
function get_name(val: any, prop: taxonomy.Property): string {
  if (val)
    if (prop instanceof taxonomy.SymbolProperty)
      return prop.multiple ? val.join(', ') : val;
    else if (prop instanceof taxonomy.ItemProperty)
      return prop.multiple ? val.map((c: string) => coco.KnowledgeBase.getInstance().items.get(c)!.name).join(', ') : coco.KnowledgeBase.getInstance().items.get(val)!.name;
    else
      return val;
  else
    return '';
}

function get_color(val: any, prop: taxonomy.Property, colors: Map<string, string>): string | undefined {
  if (val)
    if (prop instanceof taxonomy.SymbolProperty || prop instanceof taxonomy.ItemProperty)
      return prop.multiple ? undefined : colors.get(val);
    else
      return colors.get(val);
  else
    return 'rgba(0, 0, 0, 0)';
}
</script>