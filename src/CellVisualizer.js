import React, { Component } from "react";
import {
  clone,
  constraintOutsideCircle,
  constraintInsideCircle,
  constraintInsideRectangle,
  CellLocations,
  generalizeLocations,
  NODE_RADIUS,
  SELECTED_NODE_RADIUS
} from "./utils";
const d3 = require("d3");

// Padding between nodes and cellular components that should not crossover
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const VIEWPORT_CENTER = { x: WIDTH / 2, y: HEIGHT / 2 - 30 };
const MEMBRANE_WIDTH = 15;
const COLLAPSED_MEMBRANE_WIDTH = 5;
const PLASMA_MEMBRANE_WIDTH = 30;
const EXTRACELLULAR_WIDTH = 30;
const PADDING = 5;
const MARGIN_UNLOCALIZED = 15;
// Cellular components that need to be drawn regardless of whether or not they contain nodes within them
const DEFAULT_LOCATIONS = [
  "extracellular_region",
  "cytoplasm",
  "plasma_membrane"
];

// Constraint the node outside the cell
const constraintOutsideCell = (x, y, border, margin) => {
  return (
    constraintOutsideCircle(x, y, border, margin) ||
    constraintInsideRectangle(x, y, WIDTH, HEIGHT, MARGIN_UNLOCALIZED) || {
      x,
      y
    }
  );
};
// Constraint the node inside the cell, optionally constrained not to enter some locations
const constraintInsideCell = (
  x,
  y,
  component,
  components = [],
  nodeRadius = NODE_RADIUS
) => {
  const padding = nodeRadius + PADDING;
  let np =
    constraintInsideCircle(x, y, component, padding) ||
    constraintOutsideCircle(
      x,
      y,
      { ...component, rmax: component.rmin },
      padding
    );
  if (np) return np;
  for (let i = 0; i < components.length && !np; i++) {
    np = constraintOutsideCircle(x, y, components[i], padding);
    if (np) return np;
  }
  return { x, y };
};

export default class CellVisualizer extends Component {
  constructor(props) {
    super(props);
    this.data = undefined;
    this.cell = {};
    this.svg = undefined;
    this.groupComponents = undefined;
    this.organnelSimulation = undefined;
    this.node = undefined;
    this.link = undefined;
    this.simulation = undefined;
    this.nodeGroup = undefined;
  }

  reset() {
    this.organnelSimulation && this.organnelSimulation.stop();
    this.simulation && this.simulation.stop();
    this.cell = {};
    d3.selectAll("#svg").remove();
  }

  componentDidMount() {
    if (this.props.data) {
      this.data = generalizeLocations(clone(this.props.data), CellLocations);
      this.initCellStructure();
      this.registerLocationEventHandlers();
    }
  }

  componentDidUpdate(prevProp) {
    const {
      data,
      locationFilters,
      colorSelector,
      nodeLabelVisibility,
      nodeLabelContent
    } = this.props;
    this.handleNodeSelection(prevProp.selectedNode);
    if (prevProp.data !== data) {
      this.data = generalizeLocations(clone(data), CellLocations);
      this.initCellStructure();
      this.registerLocationEventHandlers();
    }
    if (prevProp.locationFilters !== locationFilters)
      this.handleLocationFilter(locationFilters);
    if (prevProp.colorSelector !== colorSelector)
      if (this.node) this.node.attr("fill", d => colorSelector(d));
    if (
      prevProp.nodeLabelVisibility !== nodeLabelVisibility ||
      prevProp.nodeLabelContent !== nodeLabelContent
    )
      this.handleLabelChange();
  }

  handleLabelChange() {
    let visualiser = this;
    this.nodeGroup &&
      this.nodeGroup.each(function(n) {
        d3.select(this)
          .selectAll("text")
          .remove();
        if (visualiser.props.nodeLabelVisibility(n)) {
          const labelPosition = visualiser.calculateNewPosition(n);
          d3.select(this)
            .attr("class", "node-label")
            .append("text")
            .attr("x", labelPosition.x)
            .attr("y", labelPosition.y)
            .text(n => visualiser.props.nodeLabelContent(n));
        }
      });
  }

  handleLocationFilter(filters) {
    if (!filters) return;
    const hiddenLocations = Object.keys(filters).filter(k => !filters[k]);
    const isHidden = l => hiddenLocations.includes(l);
    this.groupComponents &&
      this.groupComponents.classed("hidden", g => isHidden(g.id));
    this.node && this.node.classed("hidden", n => isHidden(n.location));
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

  registerLocation(
    key,
    rmax,
    rmin = 0,
    cx = VIEWPORT_CENTER.x,
    cy = VIEWPORT_CENTER.y
  ) {
    this.cell[key] = { cx, cy, rmax, rmin };
  }

  renderLocation(key, group = `${key}_group`) {
    this.svg
      .append("g")
      .attr("class", "group_component")
      .attr("id", group)
      .append("circle")
      .attr("id", key)
      .attr("r", this.cell[key].rmax)
      .attr("cx", this.cell[key].cx)
      .attr("cy", this.cell[key].cy);
  }

  registerLocationEventHandlers() {
    d3.select("#mitochondrion").on("click", d =>
      this.props.onOrganelleSelected("mitochondrion")
    );
  }

  initCellStructure() {
    this.props.onLoadingToggled(true);
    this.reset();
    this.svg = d3
      .select("#svg_wrapper")
      .append("svg")
      .attr("id", "svg")
      .attr("width", WIDTH)
      .attr("height", HEIGHT);
    this.registerLocation(
      "extracellular_region",
      HEIGHT / 2 - 45,
      HEIGHT / 2 - 45 - EXTRACELLULAR_WIDTH
    );
    this.registerLocation(
      "plasma_membrane",
      this.cell["extracellular_region"].rmin,
      this.cell["extracellular_region"].rmin - PLASMA_MEMBRANE_WIDTH
    );
    this.registerLocation("cytoplasm", this.cell["plasma_membrane"].rmin);
    this.renderLocation("extracellular_region", "extracellular_group");
    this.renderLocation("plasma_membrane");
    this.renderLocation("cytoplasm");

    const Locations = new Set(
      this.data.nodes
        .map(n => n.location)
        .filter(l => l && !DEFAULT_LOCATIONS.includes(l))
    );
    const NonMembraneLocations = new Set([]);
    Array.from(Locations).map(l => {
      const groupMapping = this.props.groupMapping.filter(
        m => m.membrane === l
      );
      groupMapping.length
        ? groupMapping.map(m => NonMembraneLocations.add(m.component))
        : NonMembraneLocations.add(l);
    });
    NonMembraneLocations.forEach(location => {
      this.registerLocation(
        location,
        (() => {
          const nodes = this.data.nodes.filter(n => n.location === location)
            .length;
          return nodes < 10 ? 30 : nodes < 25 ? 60 : nodes < 60 ? 75 : 90;
        })()
      );
    });
    const NonMembraneLocationObjects = Array.from(NonMembraneLocations).map(
      o => ({
        id: o,
        location: o,
        r: this.cell[o].rmax
      })
    );

    this.groupComponents = this.svg
      .selectAll("g.gnode")
      .data(NonMembraneLocationObjects)
      .enter()
      .append("g")
      .attr("class", "group_component")
      .attr("id", d => `${d.location}_group`);

    const visualiser = this;
    this.groupComponents.each(function(d) {
      const mappings = visualiser.props.groupMapping.filter(
        m => m.component === d.location
      );
      mappings.forEach(m => {
        if (m.membrane.trim()) {
          const membrane = m.membrane;
          d.membrane = membrane;
          const rmax = visualiser.data.nodes.filter(
            n => n.location === membrane
          ).length
            ? visualiser.cell[d.location].rmax + MEMBRANE_WIDTH
            : visualiser.cell[d.location].rmax + COLLAPSED_MEMBRANE_WIDTH;
          const rmin = visualiser.cell[d.location].rmax;
          visualiser.registerLocation(membrane, rmax, rmin);

          d3.select(this)
            .append("circle")
            .attr("id", membrane)
            .attr("class", "circle membrane")
            .attr("r", visualiser.cell[membrane].rmax);
        }
      });
    });
    this.groupComponents
      .append("circle")
      .attr("id", d => d.location)
      .attr("r", d => d.r)
      .attr("class", "circle node");
    this.groupComponents.append("text").text(d => d.location);
    this.groupComponents.append("svg:title").text(d => d.location);

    this.organnelSimulation = d3
      .forceSimulation(NonMembraneLocationObjects.sort((a, b) => a.r - b.r))
      .force("center", d3.forceCenter(VIEWPORT_CENTER.x, VIEWPORT_CENTER.y))
      .force(
        "c",
        d3
          .forceManyBody()
          .strength(NonMembraneLocationObjects.length < 10 ? -15 : -3)
      )
      .force("collision", d3.forceCollide().radius(n => n.r + MEMBRANE_WIDTH));

    this.organnelSimulation
      .on(
        "tick",
        function() {
          const cell = this.cell;
          this.groupComponents.each(function(d) {
            const result = constraintInsideCircle(
              d.x,
              d.y,
              cell["cytoplasm"],
              d.r + PADDING
            ) || { x: d.x, y: d.y };
            d3.select(this).attr("transform", function(d, i) {
              return "translate(" + result.x + "," + result.y + ")";
            });
            cell[d.location].cx = result.x;
            cell[d.location].cy = result.y;
            if (d.membrane) {
              cell[d.membrane].cx = result.x;
              cell[d.membrane].cy = result.y;
            }
          });
        }.bind(this)
      )
      .on(
        "end",
        function() {
          this.props.onLoadingToggled(false);
          this.data && this.initGraph();
        }.bind(this)
      );
  }

  initGraph() {
    this.simulation = d3
      .forceSimulation(this.data.nodes)
      .force(
        "link",
        d3
          .forceLink(this.data.links)
          .id(d => d.id)
          .strength(0)
      )
      .force(
        "collision",
        d3
          .forceCollide()
          .radius(d => {
            if (d.location === "cytoplasm") {
              return NODE_RADIUS + 15;
            }
            return NODE_RADIUS + 2;
          })
          .strength(0.5)
      )
      .force(
        "x",
        d3
          .forceX()
          .strength(0.3)
          .x(
            function(d) {
              if (
                d.location &&
                d.location != "extracellular_region" &&
                d.location != "cytoplasm"
              ) {
                return this.cell[d.location].cx;
              }
              return WIDTH / 2;
            }.bind(this)
          )
      )
      .force(
        "y",
        d3
          .forceY()
          .strength(0.3)
          .y(
            function(d) {
              if (
                d.location &&
                d.location != "extracellular_region" &&
                d.location != "cytoplasm"
              ) {
                return this.cell[d.location].cy;
              }
              return HEIGHT / 2;
            }.bind(this)
          )
      );

    this.link = this.svg
      .append("g")
      .selectAll(".edge")
      .data(this.data.links)
      .enter()
      .append("line")
      .attr("class", "edge")
      .attr("id", d => d.id);

    this.nodeGroup = this.svg
      .selectAll("g.gnode")
      .data(this.data.nodes)
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
      .call(this.drag(this.simulation));

    this.handleLabelChange();
    this.registerNodeEventHandlers();

    this.simulation.on("tick", this.onTick.bind(this));
  }

  registerNodeEventHandlers() {
    let data = this.data;
    let node = this.node;
    let link = this.link;
    const calculateNewPosition = this.calculateNewPosition.bind(this);

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
        let position = calculateNewPosition(d);
        let characterLength =
          (d.name.length < 6
            ? d.name.length + 2
            : d.name.length > 12
            ? d.name.length - 2
            : d.name.length) * 12;

        let tooltipPosition = {
          x:
            position.x < characterLength
              ? position.x
              : position.x > WIDTH - characterLength
              ? WIDTH - characterLength
              : position.x - characterLength / 2,
          y: position.y < 70 ? position.y + 15 : position.y - 40
        };

        // Use character length to determine hover information

        d3.select(this.parentNode.parentNode) // This lets this component be drawn on top of other comoponents
          .append("rect")
          .attr("class", "node-tooltip-wrapper tooltip-wrapper")
          .attr("x", tooltipPosition.x) // set x position of left side of rectangle
          .attr("y", tooltipPosition.y) // set y position of top of rectangle
          .attr("width", characterLength)
          .attr("rx", 8)
          .attr("rx", 8);
        //Add the text description
        d3.select(this.parentNode.parentNode) // This lets this component be drawn on top of other comoponents
          .append("text")
          .attr("class", "node-tooltip tooltip")
          .attr("x", tooltipPosition.x + characterLength / 2) // set x position of left side of text
          .attr("y", tooltipPosition.y) // set y position of bottom of text
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

  calculateNewPosition(node) {
    switch (node.location) {
      case "":
        return constraintOutsideCell(
          node.x,
          node.y,
          this.cell["extracellular_region"],
          MARGIN_UNLOCALIZED
        );
      case "cytoplasm":
        const components = Object.keys(this.cell)
          .filter(
            l =>
              ![
                "plasma_membrane",
                "cytoplasm",
                "extracellular_region"
              ].includes(l) &&
              !this.props.groupMapping.some(m => m.component === l)
          )
          .map(l => this.cell[l]);
        return constraintInsideCell(
          node.x,
          node.y,
          this.cell[node.location],
          components
        );
      default:
        return constraintInsideCell(node.x, node.y, this.cell[node.location]);
    }
  }

  onTick() {
    // Calculate the node's new position after applying the constraints
    const calculateNewPosition = this.calculateNewPosition.bind(this);
    this.node.each(function(d) {
      const result = calculateNewPosition(d);

      d3.select(this.parentNode)
        .selectAll("text")
        .attr("x", result.x)
        .attr("y", result.y);

      d3.select(this)
        .attr("cx", result.x)
        .attr("cy", result.y);
    });
    // Update link
    this.link.each(function(d) {
      const sourcePosition = calculateNewPosition(d.source);
      const targetPosition = calculateNewPosition(d.target);

      d3.select(this)
        .attr("x1", sourcePosition.x)
        .attr("y1", sourcePosition.y)
        .attr("x2", targetPosition.x)
        .attr("y2", targetPosition.y);
    });
  }

  drag(simulation) {
    function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }
    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  render() {
    return <div id="svg_wrapper" />;
  }
}
