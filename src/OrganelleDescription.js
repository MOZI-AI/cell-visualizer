import React from "react";
import { Button, Input } from "antd";

export default class OrganelleDescription extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
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
        <h3 id="description-header">Cell Identity</h3>
        <p id="description-details-1">
          activation of MAPK activity;activation of MAPKKK activity;Fc-epsilon
          receptor signaling pathway;heart morphogenesis;I-kappaB
          kinase/NF-kappaB cascade;in utero embryonic development;innate immune
          response;JNK cascade;lung development;MyD88-dependent toll-like
          receptor signaling pathway;MyD88-independent toll-like receptor
          signaling pathway;nucleotide-binding domain,
        </p>
        <p id="description-details-2">
          activity;stress-activated MAPK cascade;toll-like receptor 10 signaling
          pathway;toll-like receptor 2 signaling pathway;toll-like
        </p>
        <div style={{ textAlign: "right" }}>
          <Button.Group>
            <Button type="default">Close</Button>
            <Button type="primary">Learn more</Button>
          </Button.Group>
        </div>
      </div>
    );
  }
}
