import React, { Component } from "react";
import saveSvgAsPng from "./Download";
const d3 = require("d3");

var globalCellRef = undefined;

// Padding between nodes and cellular components that should not crossover
const unlocalizedMargin = 15;
const width = window.innerHeight;
const height = window.innerHeight;
const viewportCenter = { x: width / 2, y: height / 2 - 30 };
const organelleRadius = 60;
const organelleMembraneWidth = 15;
const nodeRadius = 5;
const selectedNodeRadius = 15;
const padding = 5;
const plasmaMembraneWidth = 30;
const extracellularWidth = 30;
// Cellular components that need to be drawn regardless of whether or not they contain nodes within them
const defaultOrganelleNames = [
  "extracellular_region",
  "cytoplasm",
  "plasma_membrane"
];

// Calculate and return the distance between two points
const calculateDistance = (x1, y1, x2, y2) =>
  Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
// Constraint the cell inside a cell component, optionally constrained not to enter some components
const constraintInsideCell = (
  x,
  y,
  component,
  components = [],
  nodeRadius = 0
) => {
  const nodePadding = nodeRadius ? nodeRadius + 10 : padding;
  const { cx, cy, rmax, rmin } = component;
  let R = calculateDistance(x, y, cx, cy);
  if (R > rmax - nodePadding) {
    return {
      x: ((rmax - nodePadding) / R) * (x - cx) + cx,
      y: ((rmax - nodePadding) / R) * (y - cy) + cy
    };
  } else if (R < rmin + nodePadding) {
    return {
      x: ((rmin + nodePadding) / R) * (x - cx) + cx,
      y: ((rmin + nodePadding) / R) * (y - cy) + cy
    };
  } else {
    for (let i = 0; i < components.length; i++) {
      const { cx, cy, rmax } = components[i];
      R = calculateDistance(x, y, cx, cy);
      if (R < rmax + nodePadding) {
        const position = {
          x: ((rmax + nodePadding) / R) * (x - cx) + cx,
          y: ((rmax + nodePadding) / R) * (y - cy) + cy
        };
        return position;
      }
    }
  }
  return { x: x, y: y };
};

// Constraint the cell outside the cell and not let it enter the cell
const constraintOutsideCell = (x, y, cell) => {
  var border = cell["extracellular_region"];
  let R = calculateDistance(x, y, border.cx, border.cy);
  if (R < border.rmax + unlocalizedMargin) {
    return {
      x: ((border.rmax + unlocalizedMargin) / R) * (x - border.cx) + border.cx,
      y: ((border.rmax + unlocalizedMargin) / R) * (y - border.cy) + border.cy
    };
  }
  // Do not let the node out of the viewport
  return {
    x:
      x < unlocalizedMargin
        ? unlocalizedMargin
        : x > width - unlocalizedMargin
          ? width - unlocalizedMargin
          : x,
    y:
      y < unlocalizedMargin
        ? unlocalizedMargin
        : y > height - unlocalizedMargin
          ? height - unlocalizedMargin
          : y
  };
};

const decodeLocation = location => location.trim().replace("_", " ");

export default class CellVisualizer extends Component {
  constructor(props) {
    super(props);
    this.simulation = undefined;
    this.organnelSimulation = undefined;
    this.svg = undefined;
    this.node = undefined;
    this.link = undefined;
    this.cell = {};
    this.groupComponents = undefined;
  }

  componentDidMount() {
    this.initCellStructure();
  }

  componentDidUpdate(prevProp) {
    const { organelleFilter } = this.props;
    if (organelleFilter) {
      const hiddenOrganelles = Object.keys(organelleFilter).filter(
        k => !organelleFilter[k]
      );
      if (this.groupComponents)
        this.groupComponents.attr("class", function (g) {
          const c = this.getAttribute("class")
            .replace(/hidden/g, "")
            .trim();
          return hiddenOrganelles.includes(g.id) ? `hidden ${c}` : c;
        });
      if (this.node)
        this.node.attr("class", function (n) {
          const c = this.getAttribute("class")
            .replace(/hidden/g, "")
            .trim();
          return hiddenOrganelles.includes(n.location) ? `hidden ${c}` : c;
        });
      if (this.link)
        this.link.attr("class", function (l) {
          const c = this.getAttribute("class")
            .replace(/hidden/g, "")
            .trim();
          return hiddenOrganelles.includes(l.source.location) ||
            hiddenOrganelles.includes(l.target.location)
            ? `hidden ${c}`
            : c;
        });
    }

    if (prevProp.data == this.props.data) {
      if (this.node) this.node.attr("fill", d => this.props.colorSelector(d));
    } else if (this.props.data) {
      this.initCellStructure();
    }
    // Check if a node is selected and single it out in the visualization
    this.handleNodeSelection(prevProp.selectedNode);
  }

  handleNodeSelection(previouslySelectedNode) {
    if (previouslySelectedNode)
      d3.select(`circle#${previouslySelectedNode.id}`).attr("r", nodeRadius);
    if (!this.node || !this.props.selectedNode) return;
    if (this.props.selectedNode === previouslySelectedNode) return;
    d3.select(`circle#${this.props.selectedNode.id}`)
      .transition()
      .duration(200)
      .attr("r", selectedNodeRadius);
  }

  parseTranslateValues(translate) {
    return translate
      .replace("translate(", "")
      .replace(")", "")
      .split(",")
      .map(v => +v);
  }

  reset() {
    this.simulation && this.simulation.stop();
    this.organnelSimulation && this.organnelSimulation.stop();
    this.cell = {};
    d3.selectAll("#svg").remove();
  }

  initCellStructure() {
    this.props.updateLoadingStatus(true);
    this.reset();
    this.svg = d3
      .select("#svg_wrapper")
      .append("svg")
      .attr("id", "svg")
      .attr("width", width)
      .attr("height", height);

    this.cell["extracellular_region"] = {
      cx: viewportCenter.x,
      cy: viewportCenter.y,
      rmax: height / 2 - 45,
      rmin: height / 2 - 45 - extracellularWidth
    };

    this.cell["plasma_membrane"] = {
      cx: viewportCenter.x,
      cy: viewportCenter.y,
      rmax: this.cell["extracellular_region"].rmin,
      rmin: this.cell["extracellular_region"].rmin - plasmaMembraneWidth
    };

    this.cell["cytoplasm"] = {
      cx: viewportCenter.x,
      cy: viewportCenter.y,
      rmax: this.cell["plasma_membrane"].rmin,
      rmin: 0
    };

    var extracellular = this.svg
      .append("g")
      .attr("class", "group_component")
      .attr("id", "extracellular_group")
      .append("circle")
      .attr("id", "extracellular_region")
      .attr("r", this.cell["extracellular_region"].rmax)
      .attr("cx", this.cell["extracellular_region"].cx)
      .attr("cy", this.cell["extracellular_region"].cy);

    var plasmaMembrane = this.svg
      .append("g")
      .attr("class", "group_component")
      .attr("id", "plasma_membrane_group")
      .append("circle")
      .attr("id", "plasma_membrane")
      .attr("r", this.cell["plasma_membrane"].rmax)
      .attr("cx", this.cell["plasma_membrane"].cx)
      .attr("cy", this.cell["plasma_membrane"].cy);

    var cytoplasm = this.svg
      .append("g")
      .attr("class", "group_component")
      .attr("id", "cytoplasm_group")
      .append("circle")
      .attr("id", "cytoplasm")
      .attr("r", this.cell["cytoplasm"].rmax)
      .attr("cx", this.cell["cytoplasm"].cx)
      .attr("cy", this.cell["cytoplasm"].cy);

    const Organelles = new Set(
      this.props.data.nodes
        .map(n => n.location)
        .filter(l => l && !defaultOrganelleNames.includes(l))
    );
    const NonMembraneOrganelles = new Set([]);
    Array.from(Organelles).map(o => {
      const groupMapping = this.props.groupMapping.filter(
        m => m.membrane === o
      );
      groupMapping.length
        ? groupMapping.map(m => NonMembraneOrganelles.add(m.component))
        : NonMembraneOrganelles.add(o);
    });
    NonMembraneOrganelles.forEach(organelle => {
      this.cell[organelle] = {
        cx: viewportCenter.x,
        cy: viewportCenter.y,
        rmax: function () {
          const nodes = this.props.data.nodes.filter(
            n => n.location === organelle
          ).length;
          return nodes < 10 ? 30 : nodes < 25 ? 60 : nodes < 60 ? 75 : 90;
        }.bind(this)(),
        rmin: 0
      };
    });
    const NonMembraneOrganelleObjects = Array.from(NonMembraneOrganelles).map(
      (o, i) => ({
        id: o,
        location: o,
        r: this.cell[o].rmax
      })
    );

    this.groupComponents = this.svg
      .selectAll("g.gnode")
      .data(NonMembraneOrganelleObjects)
      .enter()
      .append("g")
      .attr("class", "group_component")
      .attr(
        "id",
        function (d) {
          return d.location + "_group";
        }.bind(this)
      );

    this.groupComponents.append("svg:title").text(d => d.location);

    const visualiser = this;
    const groupMapping = this.props.groupMapping;
    const nodes = this.props.data.nodes;
    this.groupComponents.each(function (d) {
      const mappings = groupMapping.filter(m => m.component === d.location);
      mappings.forEach(m => {
        if (m.membrane.trim()) {
          const membrane = m.membrane;
          d.membrane = membrane;
          visualiser.cell[membrane] = {
            cx: visualiser.cell[d.location].cx,
            cy: visualiser.cell[d.location].cy,
            rmax: nodes.filter(n => n.location === membrane).length
              ? visualiser.cell[d.location].rmax + organelleMembraneWidth
              : visualiser.cell[d.location].rmax + 5,
            rmin: visualiser.cell[d.location].rmax
          };

          d3.select(this)
            .append("circle")
            .attr("id", membrane)
            .attr("class", "circle membrane")
            .attr("r", visualiser.cell[membrane].rmax);
        }
      });
    });

    const node = this.groupComponents
      .append("circle")
      .attr("id", d => d.location)
      .attr("r", d => {
        return d.r;
      })
      .attr("class", "circle node");

    this.groupComponents
      .append("text")
      .attr("y", 30)
      .text(d => d.location);

    this.organnelSimulation = d3
      .forceSimulation(NonMembraneOrganelleObjects.sort((a, b) => a.r - b.r))
      .force("center", d3.forceCenter(viewportCenter.x, viewportCenter.y))
      .force(
        "c",
        d3
          .forceManyBody()
          .strength(NonMembraneOrganelleObjects.length < 10 ? -15 : -3)
      )
      .force(
        "collision",
        d3.forceCollide().radius((n, i, nodes) => n.r + organelleMembraneWidth)
      );

    this.organnelSimulation
      .on(
        "tick",
        function () {
          const cell = this.cell;
          const cytoplasm = cell["cytoplasm"];
          const groupMapping = this.props.groupMapping;
          this.groupComponents.each(function (d) {
            const result = constraintInsideCell(
              d.x,
              d.y,
              cytoplasm,
              [],
              organelleRadius
            );

            d3.select(this).attr("transform", function (d, i) {
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
        function () {
          this.props.updateLoadingStatus(false);
          this.props.data && this.initGraph();
        }.bind(this)
      );
    globalCellRef = this.cell;
  }

  initGraph() {
    this.simulation = d3
      .forceSimulation(this.props.data.nodes)
      .force(
        "link",
        d3
          .forceLink(this.props.data.links)
          .id(d => d.id)
          .strength(0)
      )
      .force(
        "collision",
        d3
          .forceCollide()
          .radius(d => {
            if (d.location === "cytoplasm") {
              return nodeRadius + 15;
            }
            return nodeRadius + 2;
          })
          .strength(0.5)
      )
      .force(
        "x",
        d3
          .forceX()
          .strength(0.3)
          .x(function (d) {
            const location = d.location;
            if (
              location &&
              location != "extracellular_region" &&
              location != "cytoplasm"
            ) {
              return globalCellRef[location].cx;
            }
            return width / 2;
          })
      )
      .force(
        "y",
        d3
          .forceY()
          .strength(0.3)
          .y(function (d) {
            const location = d.location;
            if (
              location &&
              location != "extracellular_region" &&
              location != "cytoplasm"
            ) {
              return globalCellRef[location].cy;
            }
            return height / 2;
          })
      );

    this.link = this.svg
      .append("g")
      .selectAll(".edge")
      .data(this.props.data.links)
      .enter()
      .append("line")
      .attr("class", "edge")

      .attr("id", function (d) {
        return d.id;
      });

    var groupComponents = this.svg
      .selectAll("g.gnode")
      .data(this.props.data.nodes)
      .enter()
      .append("g")
      .attr("id", function (d) {
        return d.id + "_g";
      });

    this.node = groupComponents
      .append("circle")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("id", d => d.id)
      .attr("r", nodeRadius - 0.75)
      .attr("class", "node")
      .attr("fill", d => this.props.colorSelector(d))
      .on(
        "click",
        function (d, i) {
          this.props.onNodeSelected(d);
        }.bind(this)
      )
      .call(this.drag(this.simulation));

    d3.select("#download").on("click", function () {
      // Get the d3js SVG element and save using saveSvgAsPng.js
      saveSvgAsPng.saveSvgAsPng(
        document.getElementById("svg"),
        "Cell View.png",
        {
          scale: 2,
          backgroundColor: "#FFFFFF"
        }
      );
    });

    d3.select("#mitochondrion").on(
      "click",
      function (d) {
        // console.log(d.id);
        this.props.onOrganelleSelected("mitochondrion");
      }.bind(this)
    );

    d3.select("#nucleus").on("click", function (d) {
      // console.log(d.id);
      this.props.onOrganelleSelected("nucleus");
    }.bind(this));

    this.simulation.on("tick", this.onTick.bind(this));

    d3.select("#golgi_apparatus").on("click", function (d) {
      this.props.onOrganelleSelected("golgiApparatus");
    }.bind(this));

    this.simulation.on("tick", this.onTick.bind(this));
  }


  onTick() {
    // Calculate the node's new position after applying the constraints
    const calculateNewPosition = node => {
      const location = node.location;
      const component = this.cell[location];
      switch (node.location) {
        case "":
          return constraintOutsideCell(node.x, node.y, this.cell);
        case "cytoplasm":
          const components = Object.keys(this.cell)
            .filter(
              k =>
                ![
                  "plasma_membrane",
                  "cytoplasm",
                  "extracellular_region"
                ].includes(k)
            )
            .filter(
              //additional filter for restricting cytoplasmic nodes from entering organelle membranes
              orgwithMembrane =>
                !this.props.groupMapping
                  .map(obj => obj.component)
                  .includes(orgwithMembrane)
            )
            .map(k => this.cell[k]);
          return constraintInsideCell(node.x, node.y, component, components);
        default:
          //const mycomp = Object.keys(this.cell);
          return constraintInsideCell(node.x, node.y, component);
      }
    };
    // Update node positions
    let node = this.node;

    let link = this.link;
    let props = this.props;

    this.node.each(function (d) {
      const result = calculateNewPosition(d);

      // Use character length to determine hover information
      let characterLength =
        (d.name.length < 6
          ? d.name.length + 2
          : d.name.length > 12
            ? d.name.length - 2
            : d.name.length) * 12;

      d3.select(this)
        .attr("cx", result.x)
        .attr("fixed", false)
        .attr("cy", result.y)

        .on("mouseover", function (d, i) {
          // Add the text background
          const linkedByIndex = {};
          props.data.links.forEach(d => {
            linkedByIndex[`${d.source.index},${d.target.index}`] = 1;
          });

          //Checks if the nodes are connected
          function isConnected(a, b) {
            return (
              linkedByIndex[`${a.index},${b.index}`] ||
              linkedByIndex[`${b.index},${a.index}`] ||
              a.index === b.index
            );
          }
          node.style("stroke-opacity", function (o) {
            const thisOpacity = isConnected(d, o) ? 1 : 0.1;
            this.setAttribute("fill-opacity", thisOpacity);
            return thisOpacity;
          });

          link.style("stroke-opacity", o =>
            o.source === d || o.target === d ? 1 : 0.1
          );

          d3.select(this.parentNode.parentNode) // This lets this component be drawn on top of other comoponents
            .append("rect")
            .classed("tooltip-wrapper", true)
            .attr("rx", 5)
            .attr("ry", 5)
            .attr("x", function () {
              // Adjust the center of the rectangle
              return result.x - characterLength / 2;
            }) // set x position of left side of rectangle
            .attr("y", result.y - 40) // set y position of top of rectangle
            .attr("width", function () {
              // The function returns width of the background based on the length of characters
              return characterLength;
            })
            .attr("height", 30)
            .attr("id", "node" + i);

          //Add the text description
          d3.select(this.parentNode.parentNode) // This lets this component be drawn on top of other comoponents
            .append("text")
            .classed("tooltip", true)
            .attr("x", result.x) // set x position of left side of text
            .attr("y", result.y) // set y position of bottom of text
            .attr("dy", "-20") // set offset y position
            .attr("id", "node" + i)
            .text(d.name);
        })
        .on("mouseout", function (d, i) {
          d3.selectAll("#node" + i).remove(); // Removes the on-hover information
          node.style("stroke-opacity", function (o) {
            this.setAttribute("fill-opacity", 1);
            return 1;
          });
          link.style("stroke-opacity", 0.3);
        });
    });
    // Update link
    this.link.each(function (d) {
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
    return (
      <div
        id="svg_wrapper"
        style={{
          display: "grid",
          justifyContent: "center",
          alignContent: "center",
          height: "100vh"
        }}
      />
    );
  }
}
