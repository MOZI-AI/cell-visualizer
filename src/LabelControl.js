import React, { Fragment } from "react";
import { Radio } from "antd";

const LABELED_NODES = { NONE: 0, PATHWAYS: 1, GO: 2, MAIN: 3, ALL: 4 };
const LABEL_CONTENT = { NAME: 0, GROUP: 1 };

export default function LabelControl(props) {
  function getLabelVisibilityHandler(choice) {
    switch (choice) {
      case LABELED_NODES.NONE:
        return n => false;
      case LABELED_NODES.PATHWAYS:
        return n => n.name.includes("R-HSA");
      case LABELED_NODES.GO:
        return n => n.name.includes("GO:");
      case LABELED_NODES.MAIN:
        return n => n.group === "main";
      case LABELED_NODES.ALL:
        return n => true;
    }
  }

  function getLabelContentHandler(choice) {
    switch (choice) {
      case LABEL_CONTENT.NAME:
        return n => n.name;
      case LABEL_CONTENT.GROUP:
        return n => n.group;
    }
  }

  function handleLabelVisibilityChanged(choice) {
    const visibility = getLabelVisibilityHandler(choice);
    props.onNodeLabelVisibilityChanged(visibility);
  }

  function handleLabelContentChanged(choice) {
    const content = getLabelContentHandler(choice);
    props.onNodeLabelContentChanged(content);
  }

  return (
    <Fragment>
      <p style={{ fontWeight: "bold", marginBottom: 5, color: "#000" }}>
        Show label for
      </p>
      <Radio.Group
        defaultValue={LABELED_NODES.NONE}
        onChange={e => handleLabelVisibilityChanged(e.target.value)}
      >
        <Radio value={LABELED_NODES.NONE}>None</Radio>
        <Radio value={LABELED_NODES.PATHWAYS}>Pathways</Radio>
        <Radio value={LABELED_NODES.GO}>GO</Radio>
        <Radio value={LABELED_NODES.MAIN}>Main genes</Radio>
        <Radio value={LABELED_NODES.ALL}>All</Radio>
      </Radio.Group>
      <br />
      <br />
      <p style={{ fontWeight: "bold", marginBottom: 5, color: "#000" }}>
        Label content
      </p>
      <Radio.Group
        defaultValue={LABEL_CONTENT.NAME}
        onChange={e => handleLabelContentChanged(e.target.value)}
      >
        <Radio value={LABEL_CONTENT.NAME}>Name</Radio>
        <Radio value={LABEL_CONTENT.GROUP}>Group</Radio>
      </Radio.Group>
    </Fragment>
  );
}
