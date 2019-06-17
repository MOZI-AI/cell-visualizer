import React, { Component } from "react";
const d3 = require("d3");

export default class PercentageChart extends Component {
  constructor(props) {
    super(props);
    this.svg = undefined;
  }

  componentDidMount() {
    this.svg = d3.select("#chart");
  }

  componentDidUpdate(prevProps) {
    const { data } = this.props;
    if (data) {
      this.svg.selectAll().remove();
      this.drawChart();
    }
  }

  sortAndPositionSegments(data) {
    return data
      .sort((a, b) => b.value - a.value)
      .map((d, i, self) => {
        d.x1 =
          self
            .slice(0, i)
            .map(m => m.value)
            .reduce((acc, curr) => acc + curr, 0) * this.props.width;
        d.x2 = d.x1 + d.value * this.props.width;
        return d;
      });
  }

  drawChart() {
    this.svg = this.svg
      .attr("width", this.props.width)
      .attr("height", this.props.height)
      .append("g");
    // Remove previous tooltips if any
    d3.select(".tooltip").remove();
    // Define the div for the tooltip
    var div = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("bottom", 0);

    let data = this.sortAndPositionSegments(this.props.data);
    //  Lines
    this.svg
      .selectAll(".bar-chart-line")
      .data(data)
      .enter()
      .append("line")
      .attr("x2", d => d.x2)
      .attr("x1", d => d.x1)
      .attr("y1", 0)
      .attr("y2", 0)
      .attr("stroke-width", this.props.height)
      .attr("stroke", d => d.color)
      .on("mouseover", d => {
        div
          .transition()
          .duration(200)
          .style("opacity", 0.9);
        div
          .html(`${d.label} (${(d.value * 100).toFixed(2)}% )`)
          .style("left", d3.event.pageX - this.props.height + "px")
          .style("bottom", this.props.height + 15 + "px");
      })
      .on("mouseout", function(d) {
        div
          .transition()
          .duration(500)
          .style("opacity", 0);
      });
  }

  render() {
    return (
      <div className="percentage-chart-wrapper">
        <svg id="chart" />
      </div>
    );
  }
}
