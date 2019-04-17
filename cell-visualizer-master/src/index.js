import React, { Component, Fragment } from "react";
import { fetchGraphData } from "./utils";
import ReactDOM from "react-dom";
import CellVisualizer from "./CellVisualizer";
import { PercentageChart } from "./PercentageChart";
import { Button, Input } from "antd";
import { AutoComplete } from "antd";
import "antd/dist/antd.css";
import "./style.css";

// Map a group of nodes to the cellular component (organnel) they belong to and their fill color
const GroupMapping = [
  { group: 0, color: "#740b28", component: "extracellular" },
  { group: 1, color: "#978cbf", component: "nucleus" },
  { group: 2, color: "#da950c", component: "endosome" },
  { group: 3, color: "#367baf", component: "plasma_membrane" },
  { group: 4, color: "#ed2cbb", component: "cytoplasm" },
  { group: 5, color: "#23903a", component: "cytoplasm" },
  { group: 6, color: "#4ecbb1", component: "cytoplasm" },
  { group: 7, color: "#aa873c", component: "cytoplasm" },
  { group: 8, color: "#605294", component: "cytoplasm" },
  { group: 9, color: "#c71f25", component: "cytoplasm" },
  { group: 10, color: "#c8ee2a", component: "cytoplasm" }
];


// const dataSource = ['john','nati','milky']; 


export class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: undefined,
      selectedNode: undefined
    };
  }

 
  componentDidMount() {
    fetchGraphData().then(data => this.setState({ data:data}));
  }

  renderVisualization() {
    const data = GroupMapping.map(m => {
      const d = Object.assign({}, m);
      d.value =
        this.state.data.nodes.filter(n => n.group === d.group).length /
        this.state.data.nodes.length;
      d.label = d.component;
      return d;
    });
    return (
      <div
        style={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column"
        }}
      >

        
  
        

        <CellVisualizer groupMapping={GroupMapping} data={this.state.data} />

        <div
          style={{
            position: "absolute",
            display: "flex",
            height: "100vh",
            right: 0,
            top: 0,
            paddingTop: 15,
            paddingRight: 15,
            flexDirection: "column",
            width: 350
          }}
        >
          <h3>TAB1</h3>
          <p>
            activation of MAPK activity;activation of MAPKKK activity;Fc-epsilon
            receptor signaling pathway;heart morphogenesis;I-kappaB
            kinase/NF-kappaB cascade;in utero embryonic development;innate
            immune response;JNK cascade;lung development;MyD88-dependent
            toll-like receptor signaling pathway;MyD88-independent toll-like
            receptor signaling pathway;nucleotide-binding domain,
          </p>
          <p>
            activity;stress-activated MAPK cascade;toll-like receptor 10
            signaling pathway;toll-like receptor 2 signaling pathway;toll-like
          </p>
          <div style={{ textAlign: "right" }}>
            <Button.Group>
              <Button type="default">Close</Button>
              <Button type="primary">Learn more</Button>
            </Button.Group>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 0, width: 600 }}>
          <PercentageChart data={data} />
        </div>
      </div>
    );
  }
  render() {
    {console.log(this.state.data)}
    return this.state.data ? (
      <Fragment>
      <AutoComplete
        dataSource={this.state.data.nodes.map(d => d.id)}
        style={{ top: 15,
          left :600,
          width: 600,
          
          display: "inline-block"}}
        onSearch={value => console.log(value)}
        onClick = {this.state.selectedNode}
        placeholder="input search text here"
        filterOption={(inputValue, option) => option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1}
      >
      </AutoComplete>
      {this.renderVisualization()}
      </Fragment>
    ) : (
        <h1>No data to render</h1>
      );
  }
}

ReactDOM.render(<App />, document.getElementById("app"));
