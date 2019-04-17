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
        <h3>{this.props.selectedNode.id}</h3>
        <p>{this.props.selectedNode.group}</p>
        <p>{this.props.selectedNode.group}</p>
        <div style={{ textAlign: "right" }}>
          {this.props.selectedNode && (
            <Button.Group>
              <Button type="default">Close</Button>
              <Button type="primary">Learn more</Button>
            </Button.Group>
          )}
        </div>
      </div>
    );
  }
}
