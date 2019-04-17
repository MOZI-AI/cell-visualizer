import React, { Component } from "react";
const d3 = require("d3");

// Radius of nodes
const radius = 5;
// Padding between nodes and cellular components that should not crossover
const padding = 2 * radius;

// Calculate and return the distance between two points
const calculateDistance = (x1, y1, x2, y2) =>
  Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));

// Constraint the cell inside a cell component, optionally constrained not to enter some components
const constraintInsideCell = (x, y, component, components = []) => {
  const { cx, cy, rmax, rmin } = component;
  let R = calculateDistance(x, y, cx, cy);
  if (R > rmax - padding) {
    return {
      x: ((rmax - padding) / R) * (x - cx) + cx,
      y: ((rmax - padding) / R) * (y - cy) + cy
    };
  } else if (R < rmin + padding) {
    return {
      x: ((rmin + padding) / R) * (x - cx) + cx,
      y: ((rmin + padding) / R) * (y - cy) + cy
    };
  } else {
    for (let i = 0; i < components.length; i++) {
      const { cx, cy, rmax } = components[i];
      R = calculateDistance(x, y, cx, cy);
      if (R < rmax + padding) {
        const position = {
          x: ((rmax + padding) / R) * (x - cx) + cx,
          y: ((rmax + padding) / R) * (y - cy) + cy
        };
        return position;
      }
    }
  }
  return { x: x, y: y };
};

// Constraint the cell outside the cell and not let it enter the cell
const constraintOutsideCell = (x, y, cell) => {
  // If the cell has a cellwall, consider that its outter border. If not consider the plasma membrane its outer border
  var border = cell["cell_wall"] ? cell["cell_wall"] : cell["plasma_membrane"];
  let R = calculateDistance(x, y, border.cx, border.cy);
  if (R < border.rmax + padding) {
    return {
      x: ((border.rmax + padding) / R) * (x - border.cx) + border.cx,
      y: ((border.rmax + padding) / R) * (y - border.cy) + border.cy
    };
  }
  // Do not let the node out of the viewport
  return {
    x: x < padding ? (xt = padding) : x > w - padding ? w - padding : x,
    y: y < padding ? (yt = padding) : y > h - padding ? h - padding : y
  };
};

export default class CellVisualizer extends Component {
  constructor(props) {
    super(props);
    this.simulation = undefined;
    this.svg = undefined;
    this.node = undefined;
    this.link = undefined;
    this.cell = {};
  }

  componentDidUpdate() {
    if (this.props.data) {
      this.initGraph();
    }
  }

  componentDidMount() {
    this.initCellStructure().then(() => this.props.data && this.initGraph());
  }

  parseTranslateValues(translate) {
    return translate
      .replace("translate(", "")
      .replace(")", "")
      .split(",")
      .map(v => +v);
  }

  initCellStructure() {
    return d3.xml("./cell.svg").then(data => {
      d3.select("#svg_wrapper")
        .node()
        .appendChild(data.documentElement);
      this.svg = d3.select("#svg_wrapper").select("svg");
      this.svg.attr("width", 1000);
      // Get the offset value of the whole diagram
      let cellTranslate = this.parseTranslateValues(
        d3
          .select("#cell_group")
          .node()
          .getAttribute("transform")
      );

      d3.selectAll(".group_component")
        .nodes()
        .map(groupComponent => {
          // Get the offset value of each cellular component
          var groupTranslate = groupComponent.getAttribute("transform");
          groupTranslate = groupTranslate
            ? this.parseTranslateValues(groupTranslate)
            : [0, 0];

          const componentName = groupComponent.id.replace("_group", "");
          const component = d3.select("#" + componentName).node();
          // Calculate the center of cellular components
          var cx =
            +component.getAttribute("cx") +
            groupTranslate[0] +
            cellTranslate[0];
          var cy =
            +component.getAttribute("cy") +
            groupTranslate[1] +
            cellTranslate[1];
          // Save cellular components
          this.cell[componentName] = {
            cx: cx,
            cy: cy,
            rmax: +component.getAttribute("r"),
            rmin: 0
          };
        });
      // Save minimum radius for memebrane like cellular components
      this.cell["plasma_membrane"].rmin =
        this.cell["cytoplasm"].rmax + 0.6 * padding;
      if (this.cell["cell_wall"]) {
        this.cell["plasma_membrane"].rmax + 0.6 * padding;
      }
    });
  }

  initGraph() {
    this.simulation = d3
      .forceSimulation(this.props.data.nodes)
      .force(
        "link",
        d3
          .forceLink(this.props.data.links)
          .id(d => d.id)
          .distance(70)
      )
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter(400, 450))
      .force(
        "collision",
        d3.forceCollide().radius(function(d) {
          return 10;
        })
      );

    this.link = this.svg
      .append("g")
      .selectAll(".edge")
      .data(this.props.data.links)
      .enter()
      .append("line")
      .attr("class", "edge")
      .attr("stroke", "#888")
      .attr("stroke-width", 0.7)
      .attr("id", function(d) {
        return d.id;
      });

    var gnodes = this.svg
      .selectAll("g.gnode")
      .data(this.props.data.nodes)
      .enter()
      .append("g")
      .attr("id", function(d) {
        return d.id + "_g";
      });

    this.node = gnodes
      .append("circle")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("r", radius - 0.75)
      .attr("class", "node")
      .attr("fill", d => {
        const mapping = this.props.groupMapping.find(m => m.group === d.group);
        return mapping ? mapping.color : "#333";
      })
      .call(this.drag(this.simulation));

    this.simulation.on("tick", this.onTick.bind(this));
  }

  onTick() {
    // Calculate the node's new position after applying the constraints
    const calculateNewPosition = node => {
      const mapping = this.props.groupMapping.find(m => m.group === node.group);
      if (mapping) {
        const component = this.cell[mapping.component];
        switch (mapping.component) {
          case "cytoplasm":
            const components = Object.keys(this.cell)
              .filter(
                k => !["plasma_membrane", "cytoplasm", "cell_wall"].includes(k)
              )
              .map(k => this.cell[k]);
            return constraintInsideCell(node.x, node.y, component, components);
          case "extracellular":
            return constraintOutsideCell(node.x, node.y, this.cell);
          default:
            return constraintInsideCell(node.x, node.y, component);
        }
      }
      return { x: node.x, y: node.y };
    };
    // Update node positions
    this.node.each(function(d) {
      const result = calculateNewPosition(d);
      d3.select(this)
        .attr("cx", result.x)
        .attr("fixed", false)
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
