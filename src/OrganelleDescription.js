import React from "react";
import { Button, Typography } from "antd";

export default function OrganelleDescription(props) {
  const { selectedNode, onNodeSelected } = props;
  const urlRegex = /(https?:\/\/[^ ]*)/;
  console.log(
    selectedNode,
    selectedNode && selectedNode.definition.match(urlRegex)
  );
  const urls = (selectedNode && selectedNode.definition.match(urlRegex)) || [];

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
        {urls.length > 0 && (
          <Button type="primary">
            <a href={urls[0]} target="blank">
              Learn more
            </a>
          </Button>
        )}
      </div>
    </div>
  ) : null;
}
