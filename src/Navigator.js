import React from "react";
import { Tag, Icon } from "antd";

export default function Navigator(props) {
  const { selectedOrganelle, onNavigate } = props;
  return selectedOrganelle ? (
    <div className="navigation">
      <Tag.CheckableTag onChange={e => onNavigate(null)}>Cell</Tag.CheckableTag>
      <Icon type="right" style={{ marginRight: 10 }} />
      <Tag.CheckableTag checked>{selectedOrganelle}</Tag.CheckableTag>
    </div>
  ) : null;
}
