import React, { Fragment } from "react";
import FileUpload from "./FileUpload";
import { Button, AutoComplete, Input, Icon } from "antd";

export default function ToolBar(props) {
  const {
    collapsed,
    graphData,
    onNodeSelected,
    onFileUploaded,
    onDrawerOpened,
    onCollapseToggled,
    fileName
  } = props;
  return (
    <div className="top-bar-wrapper">
      <div className="menu">
        {collapsed || (
          <Fragment>
            <FileUpload title={fileName} onFileUploaded={onFileUploaded} />
            <Button.Group size="large">
              <Button type="primary" icon="filter" onClick={onDrawerOpened} />
            </Button.Group>
            <AutoComplete
              dataSource={graphData.nodes.map(d => d.id)}
              placeholder="Search ..."
              onSelect={id =>
                onNodeSelected(graphData.nodes.find(n => n.id === id))
              }
              filterOption={(inputValue, option) =>
                option.props.children
                  .toUpperCase()
                  .indexOf(inputValue.toUpperCase()) !== -1
              }
            >
              <Input suffix={<Icon type="search" className="search-icon" />} />
            </AutoComplete>
          </Fragment>
        )}
        <Button
          type="primary"
          icon={collapsed ? "right" : "left"}
          className="fold-toggle"
          onClick={onCollapseToggled}
        />
      </div>
    </div>
  );
}
