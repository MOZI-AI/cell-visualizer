import React from "react";
import {
  NODE_RADIUS,
  SELECTED_NODE_RADIUS,
  getPointsOnPath,
  EndoplasmicReticulumLocations
} from "./utils";
import * as svg from "./endoplasmic_reticulum.svg";
const d3 = require("d3");

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const PATHS = EndoplasmicReticulumLocations.map(m => m.location);

export default class EndoplasmicReticulum extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.link = undefined;
    this.node = undefined;
    this.data = undefined;
    this.svg = undefined;
  }

  componentDidMount() {
    d3.xml(svg)
      .then(data => {
        const svgElement = data.documentElement;
        svgElement.setAttribute("id", "svg");
        d3.select("#svg_wrapper")
          .node()
          .append(svgElement);
        this.svg = d3.select(svgElement);
      })
      .then(() => this.drawGraph());
  }

  componentDidUpdate(prevProp) {
    const {
      data,
      locationFilters,
      colorSelector,
      nodeLabelVisibility,
      nodeLabelContent
    } = this.props;
    if (prevProp.data !== data) {
      this.drawGraph();
    }
    if (prevProp.colorSelector !== colorSelector)
      if (this.node) this.node.attr("fill", d => colorSelector(d));
    if (prevProp.locationFilters !== locationFilters)
      this.handleLocationFilter(locationFilters);
    if (
      prevProp.nodeLabelVisibility !== nodeLabelVisibility ||
      prevProp.nodeLabelContent !== nodeLabelContent
    )
      this.handleLabelChange();
    this.handleNodeSelection(prevProp.selectedNode);
  }

  handleLabelChange() {
    let visualiser = this;
    this.nodeGroup &&
      this.nodeGroup.each(function(n) {
        d3.select(this)
          .selectAll("text")
          .remove();
        if (visualiser.props.nodeLabelVisibility(n)) {
          d3.select(this)
            .attr("class", "node-label")
            .append("text")
            .attr("x", n.x)
            .attr("y", n.y)
            .text(n => visualiser.props.nodeLabelContent(n));
        }
      });
  }

  handleLocationFilter(filters) {
    if (!filters) return;
    const hiddenLocations = Object.keys(filters).filter(k => !filters[k]);
    const isHidden = l => hiddenLocations.includes(l);
    this.nodeGroup &&
      this.nodeGroup.classed("hidden", n => isHidden(n.location));
    this.link &&
      this.link.classed(
        "hidden",
        l => isHidden(l.source.location) || isHidden(l.target.location)
      );
  }

  handleNodeSelection(previouslySelectedNode) {
    const { selectedNode } = this.props;
    if (selectedNode === previouslySelectedNode) return;
    if (previouslySelectedNode)
      d3.select(`#${previouslySelectedNode.id}`).attr("r", NODE_RADIUS);
    if (selectedNode)
      d3.select(`#${selectedNode.id}`).attr("r", SELECTED_NODE_RADIUS);
  }

  drawGraph() {
    const { data } = this.props;

    console.log('PATHS:', PATHS)
    const nodes = PATHS.reduce((nodesWithCoordinates, path) => {
      const nodes = data.nodes.filter(n => n.location === path);
      console.log("path:", path);

      const pathElement = d3.select(`#${path}`).node();
      return [...nodesWithCoordinates, ...getPointsOnPath(pathElement, nodes)];
    }, []);

    const links = data.links.reduce((acc, l) => {
      const source = nodes.find(n => n.id === l.source.id);
      if (source) {
        const target = nodes.find(n => n.id === l.target.id);
        if (target) return [...acc, { ...l, source, target }];
      }
      return acc;
    }, []);
    // Add the edges
    this.placeLinks(links);
    // Add the nodes
    this.placeNodes(nodes);
  }

  registerNodeEventHandlers() {
    let data = this.props.data;
    let node = this.node;
    let link = this.link;

    const isConnected = (a, b) => {
      return (
        data.links.some(
          l =>
            (l.source.id === a && l.target.id === b) ||
            (l.source.id === b && l.target.id === a)
        ) || a === b
      );
    };

    this.node
      .on("mouseover", function(d, i) {
        // Use character length to determine hover information
        let characterLength =
          (d.name.length < 6
            ? d.name.length + 2
            : d.name.length > 12
            ? d.name.length - 2
            : d.name.length) * 12;

        let tooltipPosition = {
          x:
            d.x < characterLength
              ? d.x
              : d.x > WIDTH - characterLength
              ? WIDTH - characterLength
              : d.x - characterLength / 2,
          y: d.y < 70 ? d.y + 15 : d.y - 40
        };

        d3.select(this.parentNode.parentNode) // This lets this component be drawn on top of other comoponents
          .append("rect")
          .attr("class", "node-tooltip-wrapper tooltip-wrapper")
          .attr("x", tooltipPosition.x)
          .attr("y", tooltipPosition.y)
          .attr("width", characterLength)
          .attr("rx", 8)
          .attr("rx", 8);
        //Add the text description
        d3.select(this.parentNode.parentNode) // This lets this component be drawn on top of other comoponents
          .append("text")
          .attr("class", "node-tooltip tooltip")
          .attr("x", tooltipPosition.x + characterLength / 2)
          .attr("y", tooltipPosition.y)
          .attr("dy", 20)
          .text(d.name);

        node.classed("dimmed", n => !isConnected(d.id, n.id));
        link
          .classed("dimmed", l => l.source !== d && l.target !== d)
          .classed("highlighted", l => l.source === d || l.target === d);
      })
      .on("mouseout", function(d, i) {
        d3.selectAll(".node-tooltip-wrapper , .node-tooltip").remove();
        node.classed("dimmed", false);
        link.classed("dimmed highlighted", false);
      });
  }

  placeNodes(nodes) {
    this.nodeGroup = this.svg
      .selectAll("g.gnode")
      .data(nodes)
      .enter()
      .append("g")
      .attr("id", d => `${d.id}_g`);

    this.node = this.nodeGroup
      .append("circle")
      .attr("id", d => d.id)
      .attr("r", NODE_RADIUS)
      .attr("class", "node")
      .attr("fill", d => this.props.colorSelector(d))
      .on("click", d => this.props.onNodeSelected(d))
      .attr("cx", function(d) {
        return d.x;
      })
      .attr("cy", function(d) {
        return d.y;
      });
    this.handleLabelChange();
    this.registerNodeEventHandlers();
  }

  placeLinks(links) {
    this.link = this.svg
      .append("g")
      .selectAll(".edge")
      .data(links)
      .enter()
      .append("line")
      .attr("class", "edge")
      .attr("id", (l, i) => `link${i}`)
      .each(function(l) {
        d3.select(this)
          .attr("x1", l.source.x)
          .attr("y1", l.source.y)
          .attr("x2", l.target.x)
          .attr("y2", l.target.y);
      });
  }

  render() {
    return <div id="svg_wrapper" />;
  }
}
