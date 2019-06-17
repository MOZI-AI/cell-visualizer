import React, { Component } from "react";
import { Upload, Button } from "antd";

export default class FileUpload extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(file) {
    const reader = new FileReader();
    reader.onload = e => {
      this.props.onFileUploaded(file.name, JSON.parse(e.target.result));
    };
    reader.readAsText(file);
    return false;
  }

  render() {
    return (
      <Upload.Dragger
        accept=".json"
        beforeUpload={this.handleChange}
        fileList={null}
      >
        <Button icon="cloud-upload" type="primary" size="large">
          {this.props.title}
        </Button>
      </Upload.Dragger>
    );
  }
}
