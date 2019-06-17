import React, { Component } from "react";
import { Tag } from "antd";

export default class LocationFilter extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.constructFilterObject(this.props.graphData);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.graphData != this.props.graphData)
      this.constructFilterObject(this.props.graphData);
  }

  constructFilterObject(data) {
    const locationFilters = data.nodes.reduce((a, { location }) => {
      if (!a[location]) a[location] = true;
      return a;
    }, {});
    this.props.onChange(locationFilters);
  }

  handleFilterChange(key, checked) {
    this.props.onChange({ ...this.props.filters, [key]: checked });
  }

  render() {
    const { filters } = this.props;
    return filters ? (
      <div>
        <p style={{ fontWeight: "bold", marginBottom: 5, color: "#000" }}>
          Location filter
        </p>
        {Object.keys(filters).map(key => (
          <Tag.CheckableTag
            style={{ margin: 5 }}
            key={key}
            checked={filters[key]}
            title={key || "Unlocalized"}
            onChange={checked => this.handleFilterChange(key, checked)}
          >
            {key || "Unlocalized"}
          </Tag.CheckableTag>
        ))}
      </div>
    ) : null;
  }
}
