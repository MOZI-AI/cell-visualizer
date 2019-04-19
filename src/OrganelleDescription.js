import React from "react";
import { Button, Input } from "antd";

export default class OrganelleDescription extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { selectedNode, onNodeSelected } = this.props;

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
        {selectedNode && (
          <div>
            <h3>{selectedNode.id}</h3>
            <p>{selectedNode.group}</p>
            <p>{selectedNode.group}</p>
            <div style={{ textAlign: "right" }}>
              <Button.Group>
                <Button
                  type="default"
                  onClick={() => onNodeSelected(undefined)}
                >
                  Close
                </Button>
                <Button type="primary">Learn more</Button>
              </Button.Group>
            </div>
          </div>
        )}
      </div>
    );
  }
}
