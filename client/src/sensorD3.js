import { Sensor } from "./sensor";

import { bisector, max, range } from "d3-array";
import { timeFormat } from "d3-time-format";
import { select, selectAll, pointer } from "d3-selection";
import { scaleLinear, scaleTime, scaleBand } from "d3-scale";
import { axisBottom } from "d3-axis";
import { line, curveMonotoneX } from 'd3-shape';
import { zoom } from "d3-zoom";

const d3 = {
    bisector, max, range,
    timeFormat,
    select, selectAll, pointer,
    scaleLinear, scaleTime, scaleBand,
    axisBottom,
    line, curveMonotoneX,
    zoom
};

const bisect_value = d3.bisector(d => d.time).left;
const font_size = 14;

export class SensorD3 extends Sensor {

    constructor(id, name, type, value, state) {
        super(id, name, type, value, state);
    }

    init(sensor_id, width, height) {
        this.sensor_svg = d3.select('#' + sensor_id).append('svg')
            .attr('viewBox', '0 0 ' + width + ' ' + height);

        this.symbol_lg = this.sensor_svg.append('defs').append('linearGradient').attr('id', 'symbol-lg').attr('x1', '0%').attr('x2', '0%').attr('y1', '0%').attr('y2', '100%');
        this.symbol_lg.append('stop').attr('offset', '0%').style('stop-color', 'navajowhite').style('stop-opacity', 1);
        this.symbol_lg.append('stop').attr('offset', '20%').style('stop-color', 'ivory').style('stop-opacity', 1);
        this.symbol_lg.append('stop').attr('offset', '100%').style('stop-color', 'navajowhite').style('stop-opacity', 1);

        this.true_lg = this.sensor_svg.append('defs').append('linearGradient').attr('id', 'true-lg').attr('x1', '0%').attr('x2', '0%').attr('y1', '0%').attr('y2', '100%');
        this.true_lg.append('stop').attr('offset', '0%').style('stop-color', 'palegreen').style('stop-opacity', 1);
        this.true_lg.append('stop').attr('offset', '20%').style('stop-color', 'ivory').style('stop-opacity', 1);
        this.true_lg.append('stop').attr('offset', '100%').style('stop-color', 'palegreen').style('stop-opacity', 1);

        this.false_lg = this.sensor_svg.append('defs').append('linearGradient').attr('id', 'false-lg').attr('x1', '0%').attr('x2', '0%').attr('y1', '0%').attr('y2', '100%');
        this.false_lg.append('stop').attr('offset', '0%').style('stop-color', 'lightsalmon').style('stop-opacity', 1);
        this.false_lg.append('stop').attr('offset', '20%').style('stop-color', 'ivory').style('stop-opacity', 1);
        this.false_lg.append('stop').attr('offset', '100%').style('stop-color', 'lightsalmon').style('stop-opacity', 1);

        this.sensor_g = this.sensor_svg.append('g');

        this.sensor_height = height;

        this.sensor_x_scale = d3.scaleTime().range([0, width]);
        this.sensor_y_scale = d3.scaleBand().rangeRound([0, this.sensor_height]).padding(0.1);

        this.sensor_axis_g = this.sensor_svg.append('g');
        this.sensor_x_axis = d3.axisBottom(this.sensor_x_scale);
        this.sensor_axis_g.call(this.sensor_x_axis);

        this.scale = 1;
        this.sensor_zoom = d3.zoom().on('zoom', event => {
            this.sensor_axis_g.call(this.sensor_x_axis.scale(event.transform.rescaleX(this.sensor_x_scale)));
            this.sensor_g.attr('transform', event.transform);
            if (this.scale != event.transform.k) {
                this.scale = event.transform.k;
                wrap_text(this.scale);
            }
        });

        this.sensor_svg.call(this.sensor_zoom);

        this.tooltip = d3.select('body').append('div') // the tooltip always 'exists' as its own html div, even when not visible
            .style('position', 'absolute') // the absolute position is necessary so that we can manually define its position later
            .style('opacity', 0) // hide it from default at the start so it only appears on hover
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "3px")
            .style("font-size", "12px")
            .attr('class', 'tooltip');
    }

    set_data(data) {
        super.set_data(data);
        this.update();
    }

    add_value(value) {
        super.add_value(value);
        this.update();
    }

    update() {
        this.sensor_x_scale.domain([this.origin, this.horizon]);
        this.sensor_axis_g.call(this.sensor_x_axis);
        this.sensor_y_scale.domain(d3.range(this.type.parameters.size));

        const parameters = Array.from(this.type.parameters.keys());
        this.sensor_g.selectAll('g.parameter').data(parameters).join(
            enter => {
                const par_g = enter.append('g')
                    .attr('class', 'parameter')
                    .attr('id', d => 'par-' + d);

                par_g.append('rect')
                    .attr('x', -10)
                    .attr('y', d => this.sensor_y_scale(parameters.indexOf(d)))
                    .attr('width', this.sensor_x_scale(this.horizon) + 20)
                    .attr('height', this.sensor_y_scale.bandwidth())
                    .style('fill', 'floralwhite');

                par_g.append('text')
                    .attr('x', 0)
                    .attr('y', d => this.sensor_y_scale(parameters.indexOf(d)) + this.sensor_y_scale.bandwidth() * 0.08)
                    .text(d => d)
                    .style('text-anchor', 'start');

                return par_g;
            },
            update => {
                update.select('rect').transition()
                    .attr('width', this.sensor_x_scale(this.horizon) + 20);

                update.select('text')
                    .text(d => d);

                return update;
            });

        for (const [i, par] of parameters.entries())
            this.update_parameter(i, par);
        wrap_text(this.scale);
    }

    update_parameter(i, par) {
        const values = [];
        if (this.data && this.data.length > 0) {
            values.push({ time: this.data[0].timestamp, from: this.origin, value: this.data[0].value[par] });
            for (let j = 1; j < this.data.length; j++)
                values.push({ time: this.data[j].timestamp, from: this.data[j - 1].timestamp, value: this.data[j].value[par] });
        }

        switch (this.type.parameters.get(par)) {
            case 'int':
            case 'float':
                const num_max_val = d3.max(values, d => d.value);
                const num_y_scale = d3.scaleLinear().domain([0, num_max_val + num_max_val * 0.1]).range([this.sensor_y_scale(i) + this.sensor_y_scale.bandwidth(), this.sensor_y_scale(i)]);
                d3.select('#par-' + par).selectAll('path').data([values]).join(
                    enter => {
                        const par_val_g = enter.append('path')
                            .attr('fill', 'none')
                            .attr('stroke', 'darkblue')
                            .attr('d', d3.line().curve(d3.curveMonotoneX)
                                .x(d => this.sensor_x_scale(d.time))
                                .y(d => num_y_scale(d.value)));

                        par_val_g
                            .on('mouseover', (event, d) => {
                                const i = bisect_value(d, this.sensor_x_scale.invert(d3.pointer(event)[0]));
                                return this.tooltip.html(d[i].value).transition().duration(200).style('opacity', .9);
                            })
                            .on('mousemove', (event, d) => {
                                const i = bisect_value(d, this.sensor_x_scale.invert(d3.pointer(event)[0]));
                                this.tooltip.html(d[i].value).transition().duration(200).style('opacity', .9);
                                return this.tooltip.style('left', (event.pageX + 20) + 'px').style('top', (event.pageY - 28) + 'px');
                            })
                            .on('mouseout', event => this.tooltip.transition().duration(500).style('opacity', 0));

                        return par_val_g;
                    },

                    update => {
                        update.transition().duration(200)
                            .attr('d', d3.line().curve(d3.curveMonotoneX)
                                .x(d => this.sensor_x_scale(d.time))
                                .y(d => num_y_scale(d.value)));

                        return update;
                    }
                );
                break;
            case 'bool':
                d3.select('#par-' + par).selectAll('g').data([values]).join(
                    enter => {
                        const par_val_g = enter.append('g')
                            .attr('class', 'wrappable');

                        par_val_g.append('rect')
                            .attr('x', d => this.sensor_x_scale(d.time))
                            .attr('y', d => this.sensor_y_scale(i) + this.sensor_y_scale.bandwidth() * 0.1)
                            .attr('width', d => this.sensor_x_scale(d.time) - this.sensor_x_scale(d.from))
                            .attr('height', this.sensor_y_scale.bandwidth() * 0.9)
                            .attr('rx', 5)
                            .attr('ry', 5)
                            .style('fill', d => bool_value_fill(d));

                        par_val_g.append('text')
                            .attr('x', d => this.sensor_x_scale(d.from) + (this.sensor_x_scale(d.time) - this.sensor_x_scale(d.from)) / 2)
                            .attr('y', d => this.sensor_y_scale(i) + this.sensor_y_scale.bandwidth() * 0.5)
                            .text(d => d.value)
                            .style('text-anchor', 'middle');

                        par_val_g.on('mouseover', (event, d) => this.tooltip.html(d.value).transition().duration(200).style('opacity', .9))
                            .on('mousemove', event => this.tooltip.style('left', (event.pageX + 20) + 'px').style('top', (event.pageY - 28) + 'px'))
                            .on('mouseout', event => this.tooltip.transition().duration(500).style('opacity', 0));

                        return par_val_g;
                    },

                    update => {
                        update.transition().duration(200)
                            .attr('transform', d => 'translate(' + this.sensor_x_scale(d[0].time) + ',' + this.sensor_y_scale(i) + ')');

                        return update;
                    }
                );
                break;
            case 'symbol':
            case 'string':
                d3.select('#par-' + par).selectAll('g').data([values]).join(
                    enter => {
                        const par_val_g = enter.append('g')
                            .attr('class', 'wrappable');

                        par_val_g.append('rect')
                            .attr('x', d => this.sensor_x_scale(d.time))
                            .attr('y', d => this.sensor_y_scale(i) + this.sensor_y_scale.bandwidth() * 0.1)
                            .attr('width', d => this.sensor_x_scale(d.time) - this.sensor_x_scale(d.from))
                            .attr('height', this.sensor_y_scale.bandwidth() * 0.9)
                            .attr('rx', 5)
                            .attr('ry', 5)
                            .style('fill', 'url(#symbol-lg)');

                        par_val_g.append('text')
                            .attr('x', d => this.sensor_x_scale(d.from) + (this.sensor_x_scale(d.time) - this.sensor_x_scale(d.from)) / 2)
                            .attr('y', d => this.sensor_y_scale(i) + this.sensor_y_scale.bandwidth() * 0.5)
                            .text(d => d.value)
                            .style('text-anchor', 'middle');

                        par_val_g.on('mouseover', (event, d) => this.tooltip.html(d.value).transition().duration(200).style('opacity', .9))
                            .on('mousemove', event => this.tooltip.style('left', (event.pageX + 20) + 'px').style('top', (event.pageY - 28) + 'px'))
                            .on('mouseout', event => this.tooltip.transition().duration(500).style('opacity', 0));

                        return par_val_g;
                    },

                    update => {
                        update.transition().duration(200)
                            .attr('transform', d => 'translate(' + this.sensor_x_scale(d[0].time) + ',' + this.sensor_y_scale(i) + ')');

                        return update;
                    }
                );
                break;
        }
    }
}

function bool_value_fill(bool_value) {
    switch (bool_value.value) {
        case true: return 'url(#true-lg)';
        default: return 'url(#false-lg)';
    }
}

function wrap_text(scale) {
    for (const d of d3.selectAll('.wrappable').nodes()) {
        if (scale > 1)
            d.lastChild.style.fontSize = font_size / scale;
        const width = d.firstChild.width.baseVal.value;
        d.lastChild.textContent = d3.select(d).datum().text;
        let length = d.lastChild.getComputedTextLength();
        while (length > 0 && length >= width - 5) {
            d.lastChild.textContent = d.lastChild.textContent.slice(0, -1);
            length = d.lastChild.getComputedTextLength();
        }
    }
}