import React, { Component } from "react";
import saveSvgAsPng from "./Download";
import { string } from "prop-types";
const d3 = require("d3");

var colorMapper = {};
var colorNo = 0;
var globalCellRef = undefined;

const width = window.innerHeight - 200;
const height = window.innerHeight - 200;
const viewportCenter = { x: width / 2, y: height / 2 };
const organelleRadius = 60;
const organelleMembraneWidth = 15;
const nodeRadius = 5;
const selectedNodeRadius = 15;
const padding = 5;
const plasmaMembraneWidth = 40;
const cellWallWidth = 40;
const extracellularWidth = 10;
// Cellular components that need to be drawn regardless of whether or not they contain nodes within them
const defaultOrganelleNames = [
  "extracellular",
  "cytoplasm",
  "plasma_membrane",
  "cell_wall"
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
    x: x < padding ? padding : x > width - padding ? width - padding : x,
    y: y < padding ? padding : y > height - padding ? height - padding : y
  };
};

export default class CellVisualizer extends Component {
  constructor(props) {
    super(props);
    this.simulation = undefined;
    this.organnelSimulation = undefined;
    this.svg = undefined;
    this.node = undefined;
    this.link = undefined;
    this.cell = {};
  }

  componentDidMount() {
    this.initCellStructure();
  }

  componentDidUpdate(prevProp) {
    // Re-initialize the cell structure everytime a different data is passed through
    if (this.props.data && prevProp.data !== this.props.data) {
      this.reset();
      this.initCellStructure();
    }
    // Check if a node is selected and single it out in the visualization
    this.handleNodeSelection(prevProp.selectedNode);
  }

  handleNodeSelection(previouslySelectedNode) {
    if (!this.node || !this.props.selectedNode) return;
    if (this.props.selectedNode === previouslySelectedNode) return;
    d3.select(`circle#${previouslySelectedNode.id}`).attr("r", nodeRadius);
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

  //changed this ...
  registerOrganelle({
    key,
    group,
    rmax,
    rmin = 0,
    cx = viewportCenter.x,
    cy = viewportCenter.y
  }) {
    this.cell[key] = {};
    this.cell[key]["organelle"] = { cx, cy, rmax, rmin, group };
  }
  //

  drawOrganelleGroup(key, classes, showCaption = false, membrane = undefined) {
    const group = this.svg
      .append("g")
      .attr("class", `group_component ${classes}`)
      .attr("id", `${key}_group`)
      .append("circle")
      .attr("id", key)
      .attr("r", this.cell[key].rmax)
      .attr("cx", this.cell[key].cx)
      .attr("cy", this.cell[key].cy)
      .append("svg:title")
      .text(key);

    if (showCaption) {
      group
        .append("text")
        .style("fill", "#74278c")
        .style("font-size", "0.7rem")
        .attr("text-anchor", "middle")
        .attr("y", 30)
        .text(d => key);
    }

    if (membrane) {
      group
        .append("circle")
        .attr("id", membrane)
        .attr("class", "membrane")
        .attr("r", organelleRadius + 15);
    }
  }

  initCellStructure() {
    this.props.updateLoadingStatus(true);
    // Register default organelles
    this.registerOrganelle({
      key: "cell_wall",
      group: "cell_wall_group",
      rmax: height / 2 - extracellularWidth,
      rmin: height / 2 - extracellularWidth - cellWallWidth
    });
    this.registerOrganelle({
      key: "plasma_membrane",
      group: "plasma_membrane_group",
      rmax: this.cell["cell_wall"]["organelle"].rmin,
      rmin: this.cell["cell_wall"]["organelle"].rmin - plasmaMembraneWidth
    });
    this.registerOrganelle({
      key: "cytoplasm",
      group: "cytoplasm_group",
      rmax: this.cell["plasma_membrane"]["organelle"].rmin
    });

    //Loading the nodes, selecting organelles and organelle membranes and adding to the cell using a structure this.cell["nameofOrganelle"] = {organelle:{},membrane{},sub_organelles:[{}]}

    let organelles = new Set([]);
    this.props.data.nodes.forEach(node => {
      if (!organelles.has(node.location) && !defaultOrganelleNames.includes(node.location)) {
        organelles.add(node.location);
      }
    });

    function orgObjValue(group, rmin = 0, cx = 384.5, cy = 384.5, rmax = organelleRadius) {
      return {
        cx,
        cy,
        group: group + "_group",
        rmax,
        rmin
      }
    }

    let listOrganelles = {};
    organelles.forEach(organelle => {
      if (organelle.endsWith("_membrane")) {
        let orgName = organelle.substr(0, organelle.indexOf("_"));
        listOrganelles[orgName]["membrane"] = orgObjValue(orgName, organelleRadius + organelleMembraneWidth);
      } else {
        if (listOrganelles.hasOwnProperty(organelle)) {
          listOrganelles[organelle]["organelle"] = orgObjValue(organelle);
          listOrganelles[organelle]["sub_organelles"] = [];
        } else {
          listOrganelles[organelle] = { organelle: {}, membrane: {}, sub_organelles: [] };
          listOrganelles[organelle]["organelle"] = orgObjValue(organelle);
        }
      }
    });

    let arrayOrganelles = {};
    Object.keys(listOrganelles).forEach(organelle => {
      this.cell[organelle] = listOrganelles[organelle];
    })

    console.log(organelles);
    console.log(listOrganelles);
    console.log(arrayOrganelles);
    console.log("end here");




    // Extract all non-default unique locations from graph data
    /*const Locations = new Set(
      this.props.data.nodes
        .map(n => n.location)
        .filter(l => !defaultOrganelleNames.includes(l))
    );
    // If a node is found in the membrane of an organelle, also include the organelle itself.
    // Also if a node is found in an organelle, include its membrane
    Locations.forEach(l => {
      const mapping = this.props.groupMapping.find(
        m => m.membrane === l || m.component === l
      );
      if (mapping) {
        Locations.add(mapping.component);
        Locations.add(mapping.membrane);
      }
    });
    // Register all locations
    Locations.forEach(l => {
      const mapping = this.props.groupMapping.find(m => m.membrane === l);
      const isMembrane = mapping ? true : false;
      const group = mapping ? `${mapping.component}_group` : `${l}_group`;
      this.registerOrganelle({
        key: l,
        rmax: isMembrane
          ? organelleRadius + organelleMembraneWidth
          : organelleRadius,
        group,
        isMembrane
      });
    });*/


    console.log("THIS.CELL", this.cell);

    this.svg = d3
      .select("#svg_wrapper")
      .append("svg")
      .attr("id", "svg")
      .attr("width", width)
      .attr("height", height);

    let DefaultOrgannells = new Set(
      Object.keys(this.cell).map(key => {
        if (defaultOrganelleNames.includes(key))
          return { key, ...this.cell[key] };
      })
    );

    let SimulationOrganelles = new Set(
      Object.keys(this.cell).map(key => {
        if (!defaultOrganelleNames.includes(key))
          return { key, ...this.cell[key] };
      })
    );

    const staticGNodes = this.svg
      .selectAll("g.static")
      .data(Array.from(DefaultOrgannells))
      .enter()
      .append("g")
      .attr("class", "group_component")
      .attr("id", g => g.group);

    const cell = this.cell;
    staticGNodes.each(function (g, i) {
      Object.keys(cell).map(key => {
        if (cell[key].group === g.group) {
          const organelle = { key, ...cell[key] };
          d3.select(this)
            .append("circle")
            .attr("id", key)
            .attr("class", organelle.isMembrane ? "membrane" : "")
            .attr("r", organelle.radius);
        }
      });
    });

    const gnodes = this.svg
      .selectAll("g.gnode")
      .data(Array.from(SimulationGroups).map(group => ({ group })))
      .enter()
      .append("g")
      .attr("class", "group_component")
      .attr("id", g => g.group);

    gnodes.each(function (g, i) {
      Object.keys(cell).map(key => {
        if (cell[key].group === g.group) {
          const organelle = { key, ...cell[key] };
          d3.select(this)
            .append("circle")
            .attr("id", key)
            .attr("class", organelle.isMembrane ? "membrane" : "")
            .attr("r", organelle.radius);
        }
      });
    });

    this.organnelSimulation = d3
      .forceSimulation(gnodes)
      .force("repel", d3.forceManyBody())
      .force("center", d3.forceCenter(viewportCenter.x, viewportCenter.y))
      .force(
        "collision",
        d3.forceCollide().radius(function (d) {
          return organelleRadius + 15;
        })
      );

    this.organnelSimulation
      .on(
        "tick",
        function () {
          const cell = this.cell;
          const cytoplasm = cell["cytoplasm"];
          const groupMapping = this.props.groupMapping;
          gnodes.each(function (d) {
            const result = constraintInsideCell(
              d.x,
              d.y,
              cytoplasm,
              [],
              organelleRadius + 15
            );

            d3.select(this).attr("transform", function (d, i) {
              return "translate(" + result.x + "," + result.y + ")";
            });
            // cell[d.location].cx = result.x;
            // cell[d.location].cy = result.y;
            // if (groupMapping.find(m => m.component === d.location)) {
            //   let membraneName = groupMapping.find(
            //     m => m.component === d.location
            //   ).membrane;
            //   cell[membraneName].cx = result.x;
            //   cell[membraneName].cy = result.y;
            // }
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
      .force("repel", d3.forceManyBody().strength(1))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "link",
        d3
          .forceLink(this.props.data.links)
          .id(d => d.id)
          .strength(0.0000000001)
      )
      .force(
        "collision",
        d3.forceCollide().radius(function (d) {
          return nodeRadius + 1.5;
        })
      )
      .force(
        "x",
        d3
          .forceX()
          .strength(0.1)
          .x(function (d) {
            if (d.location != "extracellular") {
              return globalCellRef[d.location].cx;
            }
            return width / 2;
          })
      )
      .force(
        "y",
        d3
          .forceY()
          .strength(0.1)
          .y(function (d) {
            if (d.location != "extracellular") {
              return globalCellRef[d.location].cy;
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

    this.props.data.nodes.map(
      function (obj) {
        if (!colorMapper.hasOwnProperty(obj.location)) {
          colorMapper[obj.location] = this.props.colorPalletes[colorNo];
          colorNo += 1;
        }
      }.bind(this)
    );

    var gnodes = this.svg
      .selectAll("g.gnode")
      .data(this.props.data.nodes)
      .enter()
      .append("g")
      .attr("id", function (d) {
        return d.id + "_g";
      });

    this.node = gnodes
      .append("circle")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("id", d => d.id)
      .attr("r", nodeRadius - 0.75)
      .attr("class", "node")
      .attr("fill", d => colorMapper[d.location])
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

    this.simulation.on("tick", this.onTick.bind(this));
  }

  onTick() {
    // Calculate the node's new position after applying the constraints
    const calculateNewPosition = node => {
      const component = this.cell[node.location];
      switch (node.location) {
        case "cytoplasm":
          const components = Object.keys(this.cell)
            .filter(
              k => !["plasma_membrane", "cytoplasm", "cell_wall"].includes(k)
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
        case "extracellular":
          return constraintOutsideCell(node.x, node.y, this.cell);
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
        (d.id.length < 6
          ? d.id.length + 2
          : d.id.length > 12
            ? d.id.length - 2
            : d.id.length) * 12;

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
            .attr("text-anchor", "middle") // set anchor y justification
            .attr("id", "node" + i)
            .text(d.id);
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
