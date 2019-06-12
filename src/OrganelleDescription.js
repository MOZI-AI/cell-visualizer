import React from "react";
import { Button, Typography } from "antd";

export default function OrganelleDescription(props) {
  const { selectedNode, onNodeSelected } = props;
  const urlRegex = /(https?:\/\/[^ ]*)/;
  const url =
    selectedNode && selectedNode.definition
      ? selectedNode.definition.match(urlRegex)[0]
      : null;
  console.log(selectedNode);

  return selectedNode ? (
    <div className="description-wrapper">
      <Typography.Title level={4}>{selectedNode.name}</Typography.Title>
      <Typography.Paragraph>
        <span style={{ fontWeight: "bold" }}>Location: </span>
        {selectedNode.originalLocation || "Unlocalized"}
      </Typography.Paragraph>
      <Typography.Paragraph>
        {selectedNode.definition &&
          selectedNode.definition.replace(urlRegex, "")}
      </Typography.Paragraph>
      <div className="actions">
        <Button type="link" ghost onClick={() => onNodeSelected(undefined)}>
          Close
        </Button>
        {url && (
          <Button type="primary">
            <a href={url} target="blank">
              Learn more
            </a>
          </Button>
        )}
      </div>
    </div>
  ) : null;
}
