import React, { Component } from "react";
const d3 = require("d3");

export class PercentageChart extends Component {
  constructor(props) {
    super(props);
    this.svg = undefined;
    this.width = 600;
    this.height = 30;
  }

  componentDidMount() {
    this.svg = d3.select("svg#chart");
    this.calculateCoordinates(this.props.data);
    this.drawChart();
  }

  componentDidUpdate() {
    this.drawChart();
  }

  calculateCoordinates(data) {
    return data
      .sort((a, b) => (a.value < b.value ? 1 : a.value === b.value ? 0 : -1))
      .map((d, i, self) => {
        d.x1 =
          self
            .slice(0, i)
            .map(m => m.value)
            .reduce((acc, curr) => acc + curr, 0) * this.width;
        d.x2 = d.x1 + d.value * this.width;
        return d;
      });
  }

  drawChart() {
    this.svg = this.svg
      .attr("width", this.width)
      .attr("height", this.height)
      .append("g");

    // Define the div for the tooltip
    var div = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    div.style("bottom", 0);

    //  Lines
    this.svg
      .selectAll("bar-chart-line")
      .data(this.calculateCoordinates(this.props.data))
      .enter()
      .append("line")
      .attr("x2", d => d.x2)
      .attr("x1", d => d.x1)
      .attr("y1", 0)
      .attr("y2", 0)
      .attr("stroke-width", 30)
      .attr("stroke", d => d.color)
      .on("mouseover", d => {
        div
          .transition()
          .duration(200)
          .style("opacity", 0.9);
        div
          .html(`${d.component} (${(d.value * 100).toFixed(2)}% )`)
          .style("left", d3.event.pageX - 30 + "px")
          .style("bottom", 45 + "px");
      })
      .on("mouseout", function(d) {
        div
          .transition()
          .duration(500)
          .style("opacity", 0);
      });
  }

  render() {
    return <svg id="chart" />;
  }
}
