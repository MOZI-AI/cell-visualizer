import React from "react";
const d3 = require("d3");

export default class Mitochondria extends React.Component {
  constructor(props) {
    super(props);
    this.link = undefined;
    this.node = undefined;
    this.state = {};
  }

  componentDidMount() {
    this.initMitochondria();
  }

  componentDidUpdate() {
    if (this.node) this.node.attr("fill", d => this.props.colorSelector(d));
  }

  getPointsOnPath(path, components) {
    let pts = [];
    let numberOfNodes = components.length;
    let pathLength = path.getTotalLength();

    for (let i = 0; i < numberOfNodes; i++) {
      let { x, y } = path.getPointAtLength((pathLength * i) / numberOfNodes);
      let pos = {
        x,
        y,
        ...components[i]
      };
      pts.push(pos);
    }

    return pts;
  }

  placeNodes(svg, nodes) {
    this.node = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("class", "node")
      .attr("r", 5)
      .attr("cx", function(d) {
        return d.x;
      })
      .attr("cy", function(d) {
        return d.y;
      })
      .on(
        "click",
        function(d, i) {
          this.props.onNodeSelected(d);
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
        svg
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
        d3.select("svg#mitochondrion")
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

  initMitochondria() {
    let newPoints = []; // array of new locations within organelle
    let nodesInOrganelle = [];
    let linksInOrganelle = [];

    let svg = d3.select("svg#mitochondrion");
    let parts = [
      "mitochondrial outer membrane",
      "mitochondrial intermembrane space",
      "mitochondrial inner membrane",
      "mitochondrial matrix"
    ];

    // TODO: Change this with a function that replaces Spaces with Underscores
    let organelleMapping = {
      "mitochondrial outer membrane": "mitochondrial_outer_membrane",
      "mitochondrial intermembrane space": "mitochondrial_intermembrane_space",
      "mitochondrial inner membrane": "mitochondrial_inner_membrane",
      "mitochondrial matrix": "mitochondrial_matrix"
    };
    let colors = ["#ACEDFF", "#615D6C", "#80CFA9", "#BE5A38"];

    // Add the nodes
    parts.map((part, i) => {
      let components = this.props.data.nodes.filter(
        node => node.originalLocation == part
      );

      let path = d3.select(`#${organelleMapping[part]}`).node();
      let points = this.getPointsOnPath(path, components);

      newPoints.push(...points);
      nodesInOrganelle.push(...components);
    });
    this.placeNodes(svg, newPoints);

    linksInOrganelle = this.props.data.links.filter(link => {
      let source = nodesInOrganelle.find(node => node.id == link.source.id);
      let target = nodesInOrganelle.find(node => node.id == link.target.id);

      if (source != undefined && target != undefined) {
        return source.originalLocation == target.originalLocation;
      }
    });

    // Add the edges
    svg
      .append("g")
      .selectAll(".edge")
      .data(linksInOrganelle)
      .enter()
      .append("line")
      .attr("class", "edge")
      .attr("stroke", "#888")
      .attr("stroke-width", 0.7)
      .attr("id", function(d) {
        return d.id;
      })
      .each(function(d) {
        const sourcePosition = newPoints.find(node => node.id == d.source.id);
        const targetPosition = newPoints.find(node => node.id == d.target.id);

        d3.select(this)
          .attr("x1", sourcePosition.x)
          .attr("y1", sourcePosition.y)
          .attr("x2", targetPosition.x)
          .attr("y2", targetPosition.y);
      });
  }

  render() {
    const { onOrganelleSelected } = this.props;

    return (
      <div>
        <svg
          id="mitochondrion"
          width={window.innerHeight}
          height={window.innerHeight - 120}
          viewBox="0 0 778 796"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M19.1921 85.6148C49.2255 13.4259 97.9117 6.87178 141.028 2.1603C337.341 -19.2913 589.399 261.123 708.157 477.255C753.869 560.448 815.357 695.339 745.468 759.575C648.615 848.594 466.171 752.753 359.967 675.13C176.72 541.197 -67.9934 295.176 19.1921 85.6148Z"
            fill="#EDECFC"
            stroke="#8787DE"
          />
          <path
            d="M41.5874 103.358C69.159 37.0866 113.671 28.7866 153.437 26.7444C326.791 17.8417 560.078 270.434 672.117 467.801C716.838 546.581 784.04 674.707 717.16 735.809C625.868 819.214 456.957 716.227 358.353 641.609C192.347 515.985 -38.4517 295.742 41.5874 103.358Z"
            fill="#F1F4F1"
            stroke="#8787DE"
          />
          <path
            d="M144.205 55.3771C182.255 45.1429 227.31 44.077 262.205 62.3771C279.448 71.4201 292.379 89.7984 298.205 108.377C305.298 130.995 278.768 161.389 294.205 179.377C312.306 200.47 351.433 176.968 377.205 187.377C392.603 193.596 411.079 202.581 416.205 218.377C424.643 244.378 375.722 279.804 394.205 297.377C411.545 313.864 469.604 258.261 494.205 281.377C516.902 302.705 464.948 350.72 485.205 374.377C503.881 396.189 553.68 356.63 571.205 379.377C587.603 400.661 540.412 440.75 555.205 458.377C574.345 481.183 619.549 468.174 638.205 491.377C660.216 518.752 676.851 567.712 655.205 595.377C647.58 605.122 624.975 588.02 618.205 598.377C601.422 624.054 666.571 660.807 648.205 685.377C621.634 720.922 554.935 699.15 515.205 679.377C484.488 664.089 450.516 667.111 418.205 624.377C400.915 601.509 462.193 564.303 443.205 543.377C416.452 513.893 377.473 594.873 326.205 567.377C289.611 547.751 317.419 506.908 296.205 488.377C281.773 475.77 250.791 491.351 240.205 475.377C227.309 455.917 264.791 426.039 252.205 406.377C237.515 383.428 186.346 409.247 173.205 385.377C161.409 363.951 208.055 336.188 195.205 315.377C178.707 288.66 130.414 341.639 102.205 300.377C81.1562 269.589 179.973 252.633 152.205 224.377C132.617 204.445 82.5269 254.153 57.2049 219.377C41.6647 198.035 103.673 182.733 105.205 156.377C106.419 135.489 68.5257 122.77 73.2049 102.377C79.5524 74.7136 116.797 62.7489 144.205 55.3771Z"
            fill="#EDECFC"
            stroke="#5F5FD3"
          />
          <path
            d="M223.205 71.3771C243.559 74.0504 265.017 86.5545 275.205 104.377C290.102 130.436 258.07 172.116 278.205 194.377C293.321 211.089 323.222 198.424 345.205 203.377C362.276 207.224 386.747 204.057 395.205 219.377C411.342 248.608 348.715 290.822 370.205 316.377C391.727 341.971 446.739 284.553 470.205 308.377C489.943 328.415 443.978 370.956 462.205 392.377C481.905 415.529 554.929 371.89 553.205 398.377C551.649 422.279 519.849 449.198 536.205 468.377C562.272 498.943 595.988 483.065 618.205 505.377C632.442 519.675 652.016 552.03 641.205 573.377C634.727 586.167 614.034 567.771 600.205 586.377C572.656 623.442 647.725 664.996 619.205 684.377C593.342 701.953 535.866 669.868 492.205 650.377C475.176 642.775 448.741 640.116 440.205 622.377C425.661 592.153 499.571 550.662 458.205 523.377C401.743 486.135 385.11 573.836 336.205 551.377C312.857 540.655 341.948 499.447 303.205 472.377C281.931 457.513 275.767 477.185 261.205 462.377C247.17 448.105 288.876 420.339 270.205 395.377C243.952 360.28 211.084 394.667 197.205 373.377C183.816 352.838 237.984 339.496 206.205 300.377C182.101 270.705 138.51 317.587 122.205 294.377C107.663 273.676 201.471 262.65 166.205 216.377C141.357 183.774 93.759 227.325 74.2049 214.377C57.2225 203.132 115.952 201.477 128.205 152.377C132.26 136.126 96.2835 125.045 102.205 109.377C117.15 69.8314 181.289 65.8718 223.205 71.3771Z"
            fill="white"
            stroke="#5555FF"
          />
          <path
            id="mitochondrial_inner_membrane"
            strokeWidth="0"
            d="M212 59C232.354 61.6734 273.812 79.6775 284 97.5C298.897 123.559 267.865 164.739 288 187C303.116 203.712 342.517 191.047 364.5 196C381.571 199.847 395.543 199.68 404 215C420.138 244.231 364 283 380 307.5C404 330 458.534 269.176 482 293C501.738 313.038 454.773 361.578 473 383C492.7 406.152 564.724 363.013 563 389.5C566.5 416 531.5 443.5 544 461C570.067 491.566 602.783 471.688 625 494C644.5 508.5 662.311 561.654 651.5 583C645.022 595.79 625 576 611.5 590.5C583.952 627.565 660.02 667.619 631.5 687C597 712.5 519.661 674.991 476 655.5C458.971 647.898 433.5 637.5 428.5 617.5C416 597 484 556.5 447 531C411 503 378.405 582.959 329.5 560.5C306.152 549.778 329 500.064 301 480.5C279.726 465.636 265.562 485.308 251 470.5C236.965 456.228 277.5 422.5 264 403C241.964 371.171 199.379 401.29 185.5 380C172.5 360.058 219.5 345.5 201.5 307.5C177.396 277.828 137.5 331.5 112.5 298C93.5 269.5 187 262.5 161 224C141 192.5 90.5 237 68.5 219.5C45.0347 200.834 124 181 118 149.5C109.058 131 79.0631 117.588 88.5 99C105 66.5 170.084 53.4948 212 59Z"
            stroke="#5555FF"
          />
          <path
            id="mitochondrial_intermembrane_space"
            strokeWidth="0"
            d="M166 37C223.5 33 285.943 62.2503 297 81C313.167 108.415 311.648 127.58 333.5 151C349.905 168.581 366.643 158.289 390.5 163.5C409.027 167.547 427.321 177.383 436.5 193.5C454.013 224.252 419.136 231.725 436.5 257.5C453 274 484.533 243.937 510 269C531.42 290.081 500.219 321.464 520 344C541.379 368.357 568 327.5 590.5 373C594.298 400.879 572.934 426.09 586.5 444.5C614.789 476.657 627.889 453.528 652 477C673.162 492.254 698.733 571.543 687 594C679.97 607.456 689.651 620.246 675 635.5C645.103 674.493 736.327 688.5 680.5 728.5C643.059 755.327 520.383 709.005 473 688.5C454.519 680.502 400.426 656.541 395 635.5C381.434 613.933 411.5 606 392 588C365 572 363.575 605.627 310.5 582C285.161 570.72 305.387 524.581 275 504C251.912 488.362 221.303 492.578 205.5 477C190.268 461.985 205.651 436.015 191 415.5C167.086 382.015 145.562 408.898 130.5 386.5C116.392 365.521 147.035 377.977 127.5 338C101.341 306.785 88.5 347 72.5 303.5C51.8801 273.517 109.5 278.5 94 250.5C70.5 234 46.2575 252.861 39 208C33.8645 176.255 76.5115 184.139 70 151C60.2957 131.538 48.2586 120.055 58.5 100.5C76.4068 66.3092 111 37 166 37Z"
            stroke="#5555FF"
          />
          <path
            id="mitochondrial_outer_membrane"
            strokeWidth="0"
            d="M29.844 95.9883C58.2133 27.8663 106.014 16.3345 146.93 14.2353C325.3 5.08409 545.5 220.5 683 461C729.015 541.98 801.315 686.192 732.5 749C638.566 834.734 450.957 728.202 349.5 651.5C178.691 522.368 -52.511 293.744 29.844 95.9883Z"
            stroke="#5555FF"
          />
          <path
            id="mitochondrial_matrix"
            strokeWidth="0"
            d="M201.5 196.5C144 176 160.3 120.9 189.5 118.5C213 116.568 225 119.894 225 173C225 202 246.167 230.5 280.5 236C292.833 240 317.1 251.4 315.5 265C313.5 282 314 330.5 339 339C364 347.5 399 346.5 410 357C421 367.5 410 394 421 411C432 428 476 442 486 439.5C496 437 494.5 486.5 507.5 493.5C520.5 500.5 538.5 500.5 566 517.5C593.5 534.5 550.5 561.5 545 578C539.5 594.5 505 559 522.5 540.5C500.5 517.5 491.5 510.5 460.5 489C429.5 467.5 397 473 386.5 477.5C376 482 328 464 361.5 439.5C395 415 394.5 397 378 388C361.5 379 334.5 394 333.5 411C332.5 428 295.5 387 305.5 357C315.5 327 275.5 358 258.5 348.5C241.5 339 253 299.5 275 294C297 288.5 260 262.5 238 271.5C216 280.5 192 253 210 244.5"
            stroke="black"
          />
        </svg>
      </div>
    );
  }
}
