import React from "react";
const d3 = require("d3");

export default class Nucleus extends React.Component {
    constructor(props) {
        super(props);
        this.link = undefined;
        this.state = {};
        this.padding = 2;
        this.svg = undefined;
        this.pathDetails = {};
        this.innerCircle = undefined;
    }

    componentDidMount() {
        this.initMitochondria();
    }

    calculateDistance(x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    }


    constraintInsideCell(
        x,
        y,
        component,
        components = [],
        nodeRadius = 0
    ) {
        const nodePadding = nodeRadius ? nodeRadius + 10 : this.padding;
        const {
            cx,
            cy,
            rmax,
            rmin
        } = component;
        let R = this.calculateDistance(x, y, cx, cy);
        if (R > rmax - nodePadding) {
            return {
                x: ((rmax - nodePadding) / R) * (x - cx) + cx,
                y: ((rmax - nodePadding) / R) * (y - cy) + cy
            };
        } else if (R < rmin + nodePadding) {
            return {
                x: ((rmin + nodePadding) / R) * (x - cx) + cx,
                y: ((rmin +
                    nodePadding) / R) * (y - cy) + cy
            };
        } else {
            for (let i = 0; i < components.length; i++) {
                const {
                    cx,
                    cy,
                    rmax
                } = components[i];
                R = this.calculateDistance(x, y, cx, cy);
                if (R < rmax + nodePadding) {
                    const position = {
                        x: ((rmax + nodePadding) / R) * (x - cx) + cx,
                        y: ((rmax + nodePadding) / R) * (y - cy) + cy
                    };
                    return position;
                }
            }
        }
        return {
            x: x,
            y: y
        };
    };

    addGroupPaths(selectionGroup, name) {
        let i = 0;
        selectionGroup._groups[0].forEach(element => {
            let path = this.svg.select("#" + element.id);
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

        if (this.pathDetails[name]["length"] == 0) {
            let selection = this.pathDetails[name]["pathNode"];
            this.pathDetails[name]["length"] = (2 * Math.PI * selection.r.animVal.value);
        }
    }

    getPointsFromPath(pathId, chunks, nodeList) {
        let pathLength = pathId.length / chunks;
        for (let i = 0; i < chunks; i++) {
            let pos = pathId.pathNode.getPointAtLength(pathLength * i);
            nodeList.push(pos);
        }
    }

    mapNodes(nodesInMembrane, nodesInNucleus, nodesInOuterMembrane, nodesonInnerCircle) {
        let nodeObject = {};
        let nodePostionList = [];
        let nodes = d3.range(nodesInMembrane).map(function (d, i) {
            this.getPointsFromPath(this.pathDetails["membrane0"], nodesInMembrane / 3, nodePostionList);
            this.getPointsFromPath(this.pathDetails["membrane1"], nodesInMembrane / 3, nodePostionList);
            this.getPointsFromPath(this.pathDetails["membrane2"], nodesInMembrane / 3, nodePostionList);
            return {
                radius: 2,
                x: nodePostionList[i].x,
                y: nodePostionList[i].y
            }
        }.bind(this))

        nodeObject["membrane_nodes"] = nodes;
        nodePostionList = [];

        nodes = d3.range(nodesInNucleus).map(function (d, i) {
            this.getPointsFromPath(this.pathDetails["nucleus"], nodesInNucleus, nodePostionList);

            return {
                radius: 2,
                x: nodePostionList[i].x,
                y: nodePostionList[i].y
            }
        }.bind(this))

        nodeObject["nucleus_nodes"] = nodes;

        nodePostionList = [];
        nodes = d3.range(nodesInMembrane).map(function (d, i) {
            this.getPointsFromPath(this.pathDetails["outerMembrane0"], nodesInOuterMembrane / 3, nodePostionList);
            this.getPointsFromPath(this.pathDetails["outerMembrane1"], nodesInOuterMembrane / 3, nodePostionList);
            this.getPointsFromPath(this.pathDetails["outerMembrane2"], nodesInOuterMembrane / 3, nodePostionList);

            return {
                radius: 2,
                x: nodePostionList[i].x,
                y: nodePostionList[i].y
            }
        }.bind(this))

        nodeObject["outerMembrane_nodes"] = nodes;
        nodePostionList = [];

        let inner = { pathNode: this.innerCircle.node(), length: this.innerCircle.node().getTotalLength() }
        console.log(inner);

        nodes = d3.range(nodesonInnerCircle).map(function (d, i) {
            this.getPointsFromPath(inner, nodesonInnerCircle, nodePostionList);

            return {
                radius: 2,
                x: nodePostionList[i].x,
                y: nodePostionList[i].y
            }
        }.bind(this))

        nodeObject["innerCircle_nodes"] = nodes;

        return nodeObject;
    }

    placeNodes(svg, nodes, color) {
        svg
            .append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("r", 5)
            .attr("fill", color)
            .attr("stroke", "black")
            .attr("strokeWidth", "1")
            .attr("cx", function (d) {
                return d.x;
            })
            .attr("cy", function (d) {
                return d.y;
            })
            .on(
                "click",
                function (d, i) {
                    this.props.onNodeSelected(d);
                }.bind(this)
            )
            .on("mouseover", function (d, i) {
                let mouse = d3.mouse(this);
                let characterLength =
                    (d.name.length < 6
                        ? d.name.length + 2
                        : d.name.length > 12
                            ? d.name.length - 2
                            : d.name.length) * 12;
                svg
                    .append("rect")
                    .style("fill", "hsla(214, 89%, 14%, .7)")
                    .attr("x", mouse[0] - characterLength / 2)
                    .attr("rx", 5)
                    .attr("y", mouse[1] - 40)
                    .attr("ry", 5)
                    .attr("width", function () {
                        // Width is based on the length of word
                        return characterLength;
                    })
                    .attr("height", 30)
                    .attr("id", "node" + i);

                // Text description
                d3.select("svg#mitochondrion")
                    .append("text")
                    .style("font-size", "16px")
                    .style("font-weight", "600")
                    .style("fill", "white")
                    .attr("x", mouse[0])
                    .attr("y", mouse[1])
                    .attr("dy", "-20")
                    .attr("text-anchor", "middle")
                    .attr("id", "node" + i)
                    .text(d.name);
            })
            .on("mouseout", function (d, i) {
                d3.selectAll("#node" + i).remove(); // Removes the on-hover information
            });
    }

    initMitochondria() {
        this.svg = d3.select("#svg46");
        var membranePaths = this.svg.selectAll(".membrane_path");
        var outMembranePaths = this.svg.selectAll(".outermembrane_path");
        var nucleusPath = this.svg.select(".nucleus_path");
        var nucleusCircle = this.svg.select(".nucleus_boundary");
        this.innerCircle = this.svg.select(".nucleoplasm");

        var centerValue = this.innerCircle._groups[0][0];

        nucleusCircle.attr("opacity", 0);

        this.addGroupPaths(membranePaths, "membrane");
        this.addGroupPaths(outMembranePaths, "outerMembrane");
        this.addPath(nucleusPath, "nucleus");
        this.addPath(this.innerCircle, "innerCircle");

        this.svg.selectAll(".path").remove();

        var nodes = this.mapNodes(1, 1, 1, 1);

        var allNodes = [];
        allNodes = nodes["membrane_nodes"].concat(nodes["nucleus_nodes"].concat(nodes["outerMembrane_nodes"].concat(
            nodes["innerCircle_nodes"])));

        console.log(allNodes);
        const that = this;

        var node = this.svg.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(allNodes)
            .enter()
            .append("circle")
            .attr("r", function (d) {
                return d.radius;
            }).attr("cx", function (d) {
                return d.x;
            }).attr("cy", function (d) {
                return d.y;
            })
            .attr("fill", "yellow")
            .attr("stroke", "black")
            .attr("strokeWidth", "0.5");

        var simulationNodes = d3.range(10).map(function (d) {
            return {
                radius: 1,
                x: centerValue["cx"].baseVal.value,
                y: centerValue["cy"].baseVal.value
            }
        });

        var simulation = d3.forceSimulation(simulationNodes)
            .force('charge', d3.forceManyBody().strength(-1))
            .force('center', d3.forceCenter(centerValue["cx"].baseVal.value, centerValue["cy"].baseVal.value))
            .on("tick", tickAction);

        var simNode = this.svg.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(simulationNodes)
            .enter()
            .append("circle")
            .attr("r", function (d) {
                return d.radius;
            })
            .attr("fill", "blue")
            .attr("stroke", "black")
            .attr("strokeWidth", "1")
            .on("drag", function () {
                d3.select(this)
                    .attr("x", d3.event.x)
                    .attr("y", d3.event.y);
            });

        function tickAction() {
            simNode.each(function (d) {
                let node = d3.select(this);

                let result = that.constraintInsideCell(d.x, d.y, {
                    cx: centerValue["cx"].baseVal.value,
                    cy: centerValue["cy"].baseVal.value,
                    rmax: centerValue["r"].baseVal.value,
                    rmin: 0
                },
                    [{
                        cx: nucleusCircle._groups[0][0]["cx"].baseVal.value,
                        cy: nucleusCircle._groups[0][0]["cy"].baseVal.value,
                        rmax: nucleusCircle._groups[0][0]["r"].baseVal.value,
                        rmin: 0
                    }]);

                node.attr("cx", result.x)
                    .attr("cy", result.y);
            })
        }

    }

    render() {
        const { onOrganelleSelected } = this.props;

        return (
            <div>
                <button onClick={() => onOrganelleSelected(undefined)}>CLOSE</button>
                <svg width="900" height="900" viewBox="0 0 284 280" version="1.1" id="svg46" fill="none">
                    <path
                        d="M 155.45344,15.000755 C 59.453434,11.800755 25.0373,78.375095 18.704,113.3751 c -8.199997,37.2 0.509108,65.90796 12.101065,87.71199 11.591957,21.80403 26.441862,37.07922 37.275162,43.66272 0,0 2.124528,5 -0.375472,8 -2.5,3 -7.5,1 -7.5,1 C 41.204755,244.74981 -7.29599,188 5.20401,113 28.404,13.8 112.95344,0.33407468 153.45344,4.5007347 c 5.2,-0.4 6.5,3.5 6.5,5.5000003 0,2 -0.5,5.00002 -4.5,5.00002 z"
                        id="path34" fill="#d7e3f4" stroke="#afc6e9" />
                    <path
                        d="m 71.307472,254.68143 c 2.5,-4.5 8,-3 8,-3 48.548998,24.5 96.499618,14.00038 105.499618,10.00038 50.5,-17.806 69.70734,-60.87509 77.87434,-80.37509 0,0 1.5,-3 6,-2 4.5,1 4,4.5 4,4.5 -4,14 -16.74943,48.62528 -57.24943,76.12528 -48,31.6 -114.12453,14.41643 -140.624528,2.74943 0,0 -6,-3.5 -3.5,-8 z"
                        id="path36" fill="#d7e3f4" stroke="#afc6e9" />
                    <path
                        d="M 266.24943,170.37509 C 283.99886,74.825005 214.5,32.250943 173.87472,18.62566 c 0,0 -3.5,-3 -2.5,-6.49997 1,-3.4999696 3.5,-3.9999996 7.5,-3.9999996 103.2,36.3999696 108.20771,121.9163996 98.37471,162.2493996 0,0 -1,3.5 -4.5,4 -3.5,0.5 -6,-1 -6.5,-4 z"
                        id="path38" fill="#d7e3f4" stroke="#afc6e9" />
                    <path
                        fill="none" stroke="#ffd5d5" strokeWidth="1px" strokeLinecap="butt" strokeLinejoin="miter" strokeOpacity="1"
                        d="M 62.387245,248.0646 C 60.406113,248.0646 4.0562409,206.83528 9.813283,124.25706 11.231854,103.90928 18.64583,85.191609 29.170594,70.508531 39.695358,55.825453 51.499603,41.75116 66.110452,32.629698 80.721301,23.508236 96.089421,16.399354 112.95597,12.911243 128.89659,9.6146208 142.96187,9.3513962 155.0963,9.6815849"
                        id="path60" className="membrane_path path" />
                    <path
                        opacity="0.95999995" fill="none" stroke="#ffd5d5" strokeWidth="0.9752242px" strokeLinecap="butt" strokeLinejoin="miter" strokeOpacity="1"
                        d="m 176.58982,13.958746 c 30.38228,10.047334 49.86656,24.411882 62.29192,37.991482 13.3508,14.591023 21.25864,27.722709 27.53393,41.445253 9.16371,20.038839 10.00266,34.240599 9.49445,46.782899 -0.586,14.4626 -2.06401,21.03661 -3.88033,26.06028"
                        id="path62" className="membrane_path path" />
                    <path
                        fill=" none" stroke="#ffd5d5" strokeWidth="0.97379214px" strokeLinecap="butt" strokeLinejoin="miter" strokeOpacity="1"
                        d="m 268.08155,184.15244 c -7.35116,14.7177 -11.25397,23.5245 -19.30853,34.37293 -11.52732,15.52579 -20.23383,23.78181 -28.27428,30.48199 -11.29157,9.40938 -21.67585,14.25052 -35.792,18.65994 -13.91443,4.34641 -31.16475,5.20862 -51.61405,4.53319 -28.28601,-4.04332 -42.637666,-7.18157 -50.028783,-11.18446 -6.488546,-3.51408 -7.071502,-2.46643 -7.071502,-2.46643"
                        id="path64" className="membrane_path path" />
                    <path fill=" none" fillRule="evenodd" stroke="#ffd5d5" id="path66"
                        d="m 190.51886,145.94341 c 1.1423,-0.59599 1.36695,1.24576 0.99056,1.89858 -1.01997,1.7691 -3.55204,1.30923 -4.78773,0.0825 -2.21037,-2.19425 -1.40573,-5.83542 0.82548,-7.67688 3.27438,-2.70242 8.15352,-1.51545 10.56603,1.7335 3.2155,4.33033 1.63142,10.48444 -2.64152,13.45518 -5.37705,3.73839 -12.82158,1.75075 -16.34433,-3.54954 -4.26653,-6.41936 -1.87205,-15.16226 4.45756,-19.23348 7.45923,-4.79781 17.50514,-1.9946 22.12264,5.36558 5.33108,8.49761 2.11795,19.84949 -6.27361,25.01179 -9.53503,5.86573 -22.19488,2.2419 -27.90094,-7.18163 -6.40134,-10.57178 -2.36627,-24.54101 8.08965,-30.79009 11.60805,-6.93765 26.88772,-2.49094 33.67924,8.99767"
                        transform="matrix(1.1300669,0,0,1.3476369,-25.756637,-45.951861)" className="nucleus_path path" />
                    <g id="layer2" opacity="0.43000004">
                        < circle fill="#d7e3f4" stroke="#afc6e9" strokeWidth="0.37083381" id="path3822" cx="141.78566" cy="141.71469" className="nucleoplasm" r="126.3634" />
                        < path
                            fill="#afc6e9" stroke="#87aade" strokeWidth="0.25869778px" strokeLinecap="butt" strokeLinejoin="miter" strokeOpacity="1"
                            d="m 170.48882,124.5379 c 46.04072,-34.76457 67.76339,18.70192 33.31264,47.93045 -35.16992,32.19236 -58.39921,-27.23789 -33.31264,-47.93045 z"
                            id="path3848" />
                        <circle fill=" none" stroke="#000000" strokeWidth="0.27971336" id="path3874" cx="193.36113" cy="147.5287" r="36.573837" className="nucleus_boundary" />
                    </g >
                    <g id="layer3">
                        <path
                            fill=" none" stroke="#ffd5d5" strokeWidth="1px" strokeLinecap="butt" strokeLinejoin="miter" strokeOpacity="1"
                            d="m 56.993443,253.01131 c -0.495283,0 -0.145358,-0.30283 -6.003618,-5.4232 -5.858259,-5.12036 -13.798666,-14.30809 -21.122161,-24.576 C 22.54417,212.74419 16.212682,201.39608 11.321694,185.95343 6.4307059,170.51079 2.9449556,152.81166 2.9191012,132.20452 2.893959,112.16507 14.355604,79.342216 24.902074,64.2024 35.183408,49.443196 45.791292,34.627991 63.342309,25.573378 76.044773,19.020146 94.821655,9.3430323 111.6882,5.854921 127.62882,2.558299 141.31901,4.1705467 153.45344,4.5007347"
                            id="path60-0" className="outermembrane_path path" />
                        <path
                            opacity="0.95999995" fill="none" stroke="#ffd5d5" strokeWidth="0.99760985px" strokeLinecap="butt" strokeLinejoin="miter" strokeOpacity="1"
                            d="m 178.87645,8.1347526 c 31.40926,10.1701204 51.29306,24.9382364 64.3975,38.4557694 13.50007,13.925635 22.38872,28.701281 28.08954,43.827218 8.47507,22.48688 10.17523,33.80342 9.81538,47.35462 -0.38593,14.53275 -3.26131,28.62933 -3.26131,28.62933"
                            id="path62-1" className="outermembrane_path path" />
                        <path
                            fill=" none" stroke="#ffd5d5" strokeWidth="1.00705743px" strokeLinecap="butt" strokeLinejoin="miter" strokeOpacity="1"
                            d="m 272.68143,183.80672 c -5.92152,20.84171 -9.50254,24.92055 -17.63461,36.41224 -11.63824,16.4464 -20.42853,25.19196 -28.54635,32.28943 -11.40022,9.96731 -21.88443,15.0955 -36.13641,19.76638 -14.04831,4.60413 -34.84047,6.64275 -54.36127,5.92727 -28.55818,-4.28307 -41.172464,-7.98249 -52.010543,-11.47255 -7.172033,-2.30953 -9.184775,-4.04806 -9.184775,-4.04806"
                            id="path64-7" className="outermembrane_path path" />
                    </g>
                </svg >
            </div >
        );
    }
}
