import React from "react";
import { Radio } from "antd";
import * as Color from "color";

const ColorSchemes = {
  LOCATION: 0,
  TYPE: 1,
  CONNECTIVITY: 2,
  PATHWAY: 3
};

export class ColorSchemeSelector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      defaultColorScheme: ColorSchemes.LOCATION
    };
  }

  componentDidMount() {
    this.handleColorSchemeChange(this.state.defaultColorScheme);
  }

  handleColorSchemeChange(colorScheme) {
    switch (colorScheme) {
      case ColorSchemes.LOCATION: {
        const result = this.colorSchemeByDiscereteAttribute("location");
        return this.props.onColorSchemeChange(
          result.colorScheme,
          result.colorSelector
        );
      }
      case ColorSchemes.TYPE: {
        const result = this.colorSchemeByDiscereteAttribute("group");
        return this.props.onColorSchemeChange(
          result.colorScheme,
          result.colorSelector
        );
      }
      case ColorSchemes.CONNECTIVITY: {
        let connectedNodes = [];
        this.props.data.links.map(link => {
          connectedNodes.push(link.source.id);
          connectedNodes.push(link.target.id);
        });
        // connectedNodes = Array.from(connectedNodes);
        const connectionsByNode = connectedNodes.reduce((acc, node, i) => {
          if (!acc[node]) {
            acc[node] = connectedNodes.filter(n => n === node).length;
          }
          return acc;
        }, {});

        const relativePercentages = this.calculateRelativePercentagesForRange(
          { ...connectionsByNode },
          "connections"
        );
        const colorScheme = this.assignMonochromaticColors(relativePercentages);
        return this.props.onColorSchemeChange(colorScheme, n => {
          const c = connectionsByNode[n.id] || 0;
          return colorScheme.find(a => {
            return c >= a.min && c <= a.max;
          }).color;
        });
      }
      case ColorSchemes.PATHWAY: {
        const pathways = this.props.data.nodes
          .filter(n => n.id.includes("R-HSA"))
          .map(n => ({ id: n.id, name: n.name }));
        const pathwayConnectedNodes = pathways.reduce((a, pathway) => {
          const nodes = this.props.data.links
            .map(l => {
              if (l.source.id === pathway.id) {
                return l.target.id;
              }
              if (l.target.id === pathway.id) {
                return l.source.id;
              }
            })
            .filter(n => n);
          return {
            ...a,
            [pathway.id]: nodes
          };
        }, {});
        const totalPathwayConnectedNodes = Object.values(
          pathwayConnectedNodes
        ).reduce((a, c) => a + c.length, 0);
        const relativePercentages = Object.keys(pathwayConnectedNodes).map(
          key => ({
            label: pathways.find(p => p.id === key).name,
            value:
              pathwayConnectedNodes[key].length / this.props.data.links.length
          })
        );
        relativePercentages.push({
          label: "No pathway",
          value:
            (this.props.data.links.length - totalPathwayConnectedNodes) /
            this.props.data.links.length
        });
        const colorScheme = this.assignColors(relativePercentages);
        return this.props.onColorSchemeChange(colorScheme, n => {
          let color;
          Object.keys(pathwayConnectedNodes).forEach((key, i) => {
            const pathway = pathways.find(p => p.id === key);
            if (key === n.id) {
              color = colorScheme.find(s => s.label === n.name).color;
            } else if (pathwayConnectedNodes[key].includes(n.id))
              color = colorScheme.find(s => s.label === pathway.name).color;
          });
          if (!color)
            color = colorScheme.find(s => s.label === "No pathway").color;
          return color;
        });
      }
    }
  }

  calculateRelativePercentagesForRange(connectionsByNode, caption) {
    const relativePercentages = [];
    const zerCount =
      this.props.data.nodes.length - Object.values(connectionsByNode).length;
    if (zerCount > 0) {
      relativePercentages.push({
        min: 0,
        max: 0,
        label: `No ${caption}`,
        value: zerCount / this.props.data.nodes.length
      });
    }
    const numberOfConnections = Object.values(connectionsByNode);

    const min = Math.min(...numberOfConnections);
    const max = Math.max(...numberOfConnections);
    const range = max - min;
    let step;
    if (range === 0) {
      if (max !== 0) {
        relativePercentages.push({
          min,
          max: max + 1,
          label: `${min} connections`,
          value: numberOfConnections.length / this.props.data.nodes.length
        });
      }
      return relativePercentages;
    } else if (range < 10) {
      step = 1;
    } else {
      step = Math.ceil(range / 10);
    }
    for (let i = min; i < max + step; i += step) {
      relativePercentages.push({
        min: i,
        max: i + step,
        label: `${i} - ${i + step} ${caption}`,
        value:
          numberOfConnections.filter(c => c >= i && c <= i + step).length /
          this.props.data.nodes.length
      });
      i += 1;
    }
    return relativePercentages;
  }

  colorSchemeByDiscereteAttribute(attribute) {
    const relativePercentages = this.calculateRelativePercentages(
      attribute
    ).map(rp => {
      if (rp.label === "") {
        rp.label = "Unlocalized";
      }
      return rp;
    });
    const colorScheme = this.assignColors(relativePercentages);
    const colorSelector = n => {
      const cs =
        colorScheme.find(s => s.label === n[attribute]) ||
        colorScheme.find(s => s.label === "Unlocalized");
      console.log(n);
      return cs.color;
    };

    return { colorScheme, colorSelector };
  }

  assignColors(data) {
    const { colorPalletes } = this.props;
    return data.map(d => ({
      ...d,
      color: colorPalletes[data.findIndex(l => l.label === d.label)]
    }));
  }

  assignMonochromaticColors(data) {
    const sortedData = [...data].sort((a, b) => b.min - a.min);
    const length = sortedData.length;
    const lightnessIncrement = 80 / length;
    let red = Color("#100000");
    return sortedData.map(d => {
      red = red.lightness(red.lightness() + lightnessIncrement);
      return {
        ...d,
        color: red.hex()
      };
    });
  }

  calculateRelativePercentages(key) {
    const counts = this.props.data.nodes.reduce((rps, node) => {
      if (!rps.find(rp => rp.label === node[key])) {
        rps.push({ label: node[key], value: 0 });
      }
      return rps.map(rp => {
        if (rp.label === node[key]) {
          rp.value = rp.value + 1;
        }
        return rp;
      });
    }, []);
    return counts.map(c => ({
      ...c,
      value: c.value / this.props.data.nodes.length
    }));
  }

  render() {
    return (
      <React.Fragment>
        <Radio.Group
          onChange={e => this.handleColorSchemeChange(e.target.value)}
          defaultValue={this.state.defaultColorScheme}
        >
          <Radio value={ColorSchemes.LOCATION}>Location</Radio>
          <Radio value={ColorSchemes.TYPE}>Annotation</Radio>
          <Radio value={ColorSchemes.CONNECTIVITY}>Connectivity</Radio>
          <Radio value={ColorSchemes.PATHWAY}>Pathway</Radio>
        </Radio.Group>
      </React.Fragment>
    );
  }
}
