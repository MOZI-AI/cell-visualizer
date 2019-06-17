import React from "react";
const d3 = require("d3");

export default class GolgiApparatus extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.svg = undefined;
    this.pathDetails = {};
  }

  componentDidMount() {
    this.initGolgi();
  }

  componentDidUpdate() {
    if (this.node) this.node.attr("fill", d => this.props.colorSelector(d));
  }

  addGroupPaths(selectionGroup, name) {
    let i = 0;
    selectionGroup._groups[0].forEach(element => {
      let path = d3.select("#" + element.id);
      path = path.node();
      this.pathDetails[name + i] = {
        pathNode: path,
        length: path.getTotalLength()
      };
      i++;
    });
  }

  addPath(selectionGroup, name) {
    this.pathDetails[name] = {
      pathNode: selectionGroup.node(),
      length: selectionGroup.node().getTotalLength()
    };
  }

  getPointsFromPath(pathId, chunks, nodeList) {
    let pathLength = pathId.length / chunks;
    for (let i = 0; i < chunks; i++) {
      let pos = pathId.pathNode.getPointAtLength(pathLength * i);
      nodeList.push(pos);
    }
  }

  calcPerecentage(percentage, variable) {
    if (variable <= 0) return 0;
    variable -= parseInt(variable * (percentage / 100));
    return value;
  }

  mapNodes(nodesInside, nodesInMembrane) {
    let nodeObject = {};
    let nodePostionList = [];
    let nodes =
      nodesInside == 0
        ? []
        : d3.range(nodesInside).map(
            function(d, i) {
              this.getPointsFromPath(
                this.pathDetails["smallIP0"],
                this.minimize(10, nodesInside),
                nodePostionList
              );
              this.getPointsFromPath(
                this.pathDetails["smallIP1"],
                this.minimize(10, nodesInside),
                nodePostionList
              );
              this.getPointsFromPath(
                this.pathDetails["mediumIP0"],
                this.minimize(20, nodesInside),
                nodePostionList
              );
              this.getPointsFromPath(
                this.pathDetails["mediumIP1"],
                this.minimize(20, nodesInside),
                nodePostionList
              );
              this.getPointsFromPath(
                this.pathDetails["largeIP0"],
                this.minimize(10, nodesInside),
                nodePostionList
              );
              this.getPointsFromPath(
                this.pathDetails["largeIP1"],
                this.minimize(30, nodesInside),
                nodePostionList
              );
              this.getPointsFromPath(
                this.pathDetails["largeIP2"],
                this.minimize(100, nodesInside),
                nodePostionList
              );
              return {
                radius: 2,
                x: nodePostionList[i].x,
                y: nodePostionList[i].y
              };
            }.bind(this)
          );

    nodeObject["inside_nodes"] = nodes;
    nodePostionList = [];

    nodes =
      nodesInMembrane == 0
        ? []
        : d3.range(nodesInMembrane).map(
            function(d, i) {
              this.getPointsFromPath(
                this.pathDetails["largeIP0"],
                nodesInMembrane,
                nodePostionList
              );

              return {
                radius: 2,
                x: nodePostionList[i].x,
                y: nodePostionList[i].y
              };
            }.bind(this)
          );

    nodeObject["membrane_nodes"] = nodes;

    return nodeObject;
  }

  initGolgi() {
    this.svg = d3.select("#svgGolgi");

    var smallIPaths = this.svg.selectAll(".small_path");
    var mediumIPaths = this.svg.selectAll(".medium_path");
    var largeIPaths = this.svg.selectAll(".large_path");

    this.addGroupPaths(smallIPaths, "smallIP");
    this.addGroupPaths(mediumIPaths, "mediumIP");
    this.addGroupPaths(largeIPaths, "largeIP");

    console.log("Path Details", this.pathDetails);

    let parts = ["Golgi_apparatus", "Golgi_membrane"];

    const nodeMapping = {
      inside: {
        MappingName: "Golgi_apparatus",
        SimilarLocation: ["Golgi_apparatus"],
        nodes: []
      },
      membrane: {
        MappingName: "Golgi_membrane",
        SimilarLocation: ["Golgi_membrane"],
        nodes: []
      }
    };

    Object.keys(nodeMapping).forEach(location => {
      let similarLocations = nodeMapping[location].SimilarLocation;
      if (similarLocations != []) {
        this.props.data.nodes.forEach(node => {
          if (
            similarLocations.includes(
              node.originalLocation.trim().replace(" ", "_")
            )
          )
            nodeMapping[location].nodes.push(node);
        });
      }
    });

    console.log("Node Mapping \n", nodeMapping);

    this.svg.selectAll(".path").remove();

    var nodeswithData = [];
    Object.keys(nodeMapping).forEach(location => {
      nodeswithData = nodeswithData.concat(nodeMapping[location].nodes);
    });

    var sizeArray = [
      nodeMapping.inside.nodes != undefined
        ? nodeMapping.inside.nodes.length
        : 0,
      nodeMapping.membrane.nodes != undefined
        ? nodeMapping.membrane.nodes.length
        : 0
    ];
    sizeArray.push(sizeArray[0] + sizeArray[1]);

    var nodes = this.mapNodes(sizeArray[0], sizeArray[1]);

    var allNodes = [];
    allNodes = nodes["inside_nodes"].concat(nodes["membrane_nodes"]);
    console.log(allNodes);

    for (let index = 0; index < sizeArray[4]; index++) {
      if (index <= sizeArray[0]) {
        allNodes[index].group = nodeswithData[index].group;
        allNodes[index].id = nodeswithData[index].id;
        allNodes[index].name = nodeswithData[index].name;
        allNodes[index].definition = nodeswithData[index].definition;
        allNodes[index].location = nodeswithData[index].location;
      } else {
        allNodes[index].group = nodeswithData[index].group;
        allNodes[index].id = nodeswithData[index].id;
        allNodes[index].name = nodeswithData[index].name;
        allNodes[index].definition = nodeswithData[index].definition;
      }
    }

    var node = this.svg
      .append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(allNodes)
      .enter()
      .append("circle")
      .attr("r", function(d) {
        return d.radius;
      })
      .attr("cx", function(d) {
        return d.x;
      })
      .attr("cy", function(d) {
        return d.y;
      })
      .attr("fill", "brown")
      .attr("stroke", "black")
      .attr("strokeWidth", "0.5")
      .on(
        "click",
        function(d, i) {
          this.props.onNodeSelected(d);
          d3.selectAll("#node" + i).remove();
        }.bind(this)
      )
      .on("mouseover", function(d, i) {
        let mouse = d3.mouse(this);
        let characterLength =
          (d.name.length < 6
            ? d.name.length + 2
            : d.name.length > 12
            ? d.name.length - 2
            : d.name.length) * 12;
        d3.select("#svgGolgi")
          .append("rect")
          .attr("x", mouse[0] - characterLength / 2)
          .attr("rx", 5)
          .attr("y", mouse[1] - 40)
          .attr("ry", 5)
          .attr("width", function() {
            // Width is based on the length of word
            return characterLength;
          })
          .attr("height", 30)
          .attr("id", "node" + i)
          .classed("tooltip-wrapper", true);

        // Text description
        d3.select("#svgGolgi")
          .append("text")
          .attr("x", mouse[0])
          .attr("y", mouse[1])
          .attr("dy", "-20")
          .attr("id", "node" + i)
          .text(d.name)
          .classed("tooltip", true);
      })
      .on("mouseout", function(d, i) {
        d3.selectAll("#node" + i).remove(); // Removes the on-hover information
      });
  }

  render() {
    const { onOrganelleSelected } = this.props;

    return (
      <div>
        <button onClick={() => onOrganelleSelected(undefined)}>CLOSE</button>
        <svg
          width="450"
          height="221"
          viewBox="0 0 450 221"
          version="1.1"
          id="svgGolgi"
          fill="none"
        >
          <g>
            <path
              id="Vector 2"
              d="m 241.686,210.099 c 59.316,1.913 111.809,-32.202 131.029,-48.05 73.346,-60.478 84.678,-104.4762 64.173,-121.758 -2.214,-1.8225 -14.02,8.8176 -45.662,61.411 -18.599,40.7 -87.007,69.383 -113.181,77.949 -48.297,12.941 -76.138,1.766 -83.458,20.81 4.072,11.332 14.697,8.485 47.099,9.638 z"
              style={{
                fill: "#ecf3cd",
                stroke: "#c1c3a4",
                strokeWidth: "2"
              }}
            />
            <path
              id="Vector 3"
              d="m 159.788,215.479 c 2.329,8.693 -110.0486,4.641 -140.5657,-35.84 5.5435,-23.744 146.1187,19.858 140.5657,35.84 z"
              style={{
                fill: "#ecf3cd",
                stroke: "#c1c3a4",
                strokeWidth: "2"
              }}
            />
            <path
              id="Vector 4"
              d="M 347.389,19.2375 C 339.204,17.6662 324.184,60.1371 289.092,72.1282 254.527,93.8133 197.165,94.1718 189.327,111.284 236.536,137.56 300.076,100.243 325.945,78.3002 325.187,90.9266 313.132,109.686 279.429,124.928 207.52,161.796 137.936,149.383 122.412,149.401 42.0138,142.991 9.48623,91.1435 -0.25594,132.059 18.1431,165.952 142.787,192.6 225.374,170.471 331.963,154.851 397.717,62.1748 400.571,51.575 c 8.132,-14.0846 8.721,-87.2293 -24.116,-20.4553 -26.269,53.4192 -34.572,42.91 -33.918,24.0998 12.971,-7.6165 22.861,-32.5251 4.852,-35.982 z"
              style={{
                fill: "#ecf3cd",
                stroke: "#c1c3a4",
                strokeWidth: "2"
              }}
            />
            <path
              id="Vector 5"
              d="m 164.437,116.918 c -3.104,11.598 -36.056,5.174 -52.627,0.642 -21.3637,-8.252 -46.9793,-16.917 -64.6781,-30.8096 28.3908,-13.819 44.6807,-2.8374 67.3841,4.203 25.969,8.0531 53.801,11.4656 49.921,25.9646 z"
              style={{
                fill: "#ecf3cd",
                stroke: "#c1c3a4",
                strokeWidth: "2"
              }}
            />
            <path
              id="Vector 6"
              d="M 37.9253,36.9359 C 52.0767,20.2031 120.836,70.1074 180.707,67.5235 217.551,65.9334 225.856,62.1551 303.008,19.7416 312.325,54.5149 218.51,86.8995 182.727,86.6525 169.641,86.5622 30.5979,77.2045 37.9253,36.9359 Z"
              style={{
                fill: "#ecf3cd",
                stroke: "#c1c3a4",
                strokeWidth: "2"
              }}
            />
          </g>

          <path
            style={{
              fill: "none",
              stroke: "#000000",
              strokeWidth: "1px",
              strokeLinecap: "butt",
              strokeLinejoin: "miter",
              strokeOpacity: "1"
            }}
            d="m 49.957544,42.773086 c 0,0 10.014012,5.850883 32.911219,15.021018 22.897207,9.170135 64.632897,20.785879 98.058557,20.984419 18.46026,0.10965 27.49545,-2.295776 54.28946,-10.945101 26.51266,-8.558504 39.99978,-19.434487 62.27815,-35.861967"
            id="path48"
            className="medium_path path"
          />
          <path
            style={{
              fill: "none",
              stroke: "#000000",
              strokeWidth: "1px",
              strokeLinecap: "butt",
              strokeLinejoin: "miter",
              strokeOpacity: "1"
            }}
            d="m 75.16135,85.529542 c 0,0 0,17.102588 79.21196,28.804348"
            id="path50"
            className="small_path path"
          />
          <path
            style={{
              fill: "none",
              stroke: "#000000",
              strokeWidth: "1px",
              strokeLinecap: "butt",
              strokeLinejoin: "miter",
              strokeOpacity: "1"
            }}
            d="m 36.905573,177.34341 c 0,0 51.307748,31.50475 111.616857,31.95482"
            id="path52"
            className="small_path path"
          />
          <path
            style={{
              fill: "none",
              stroke: "#000000",
              strokeWidth: "1px",
              strokeLinecap: "butt",
              strokeLinejoin: "miter",
              strokeOpacity: "1"
            }}
            d="m 211.53194,195.79619 c 0,0 112.51699,12.15184 169.22556,-59.40897 0,0 56.25849,-59.859037 51.75781,-88.213319"
            id="path54"
            className="medium_path path"
          />
          <path
            style={{
              fill: "none",
              stroke: "#000000",
              strokeWidth: "1px",
              strokeLinecap: "butt",
              strokeLinejoin: "miter",
              strokeOpacity: "1"
            }}
            d="m 207.03126,108.48301 c 0,0 94.96434,-15.75238 113.8672,-37.355642 18.90285,-21.603263 24.75374,-32.854962 28.35428,-45.456865"
            id="path56medium"
            className="large_path path"
          />
          <path
            style={{
              fill: "none",
              stroke: "#000000",
              strokeWidth: "1px",
              strokeLinecap: "butt",
              strokeLinejoin: "miter",
              strokeOpacity: "1"
            }}
            d="m 13.952107,127.38586 c 0,0 106.216043,67.5102 225.484053,22.5034 0,0 9.47956,-2.67228 23.71999,-8.12232 14.24043,-5.45004 33.24174,-13.67785 52.28524,-24.7889 19.0435,-11.11105 38.12919,-25.105355 52.5384,-42.088388 14.40921,-16.983033 24.14193,-36.954798 24.47948,-60.02078"
            id="path58large"
            className="large_path path"
          />
          <path
            style={{
              fill: "none",
              stroke: "#000000",
              strokeWidth: "1px",
              strokeLinecap: "butt",
              strokeLinejoin: "miter",
              strokeOpacity: "1"
            }}
            d="m 335.05029,62.826416 c 0,0 14.85225,28.354282 -6.30095,38.705844"
            id="path84small"
            className="large_path path"
          />
        </svg>
      </div>
    );
  }
}
