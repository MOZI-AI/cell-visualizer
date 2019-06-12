import React from "react";
import * as bg from "./bg.svg";
import FileUpload from "./FileUpload";
import { Typography } from "antd";

export default function LandingPage(props) {
  return (
    <div className="landing-page-wrapper" style={{ background: `url(${bg})` }}>
      <div
        style={{
          textAlign: "justify",
          maxWidth: 500,
          justifyContent: "flex-start"
        }}
      >
        <Typography.Title style={{ textAlign: "left" }} level={1}>
          Cell Visualizer
        </Typography.Title>
        <Typography.Paragraph
          style={{ textAlign: "left", alignItems: "left", marginBottom: 45 }}
        >
          Gene annotation visualizer with intracellular location representation.
          Visit the <a href="http://mozi.ai:3003">annotation service</a> page to
          annotate genes and get a graph JSON. Upload the graph JSON below.
        </Typography.Paragraph>
        <FileUpload
          title="Click or drag graph JSON to this area"
          hint="Upload a graph JSON file to view it in the cell visualizer."
          onFileUploaded={props.onFileUploaded}
        />
      </div>
    </div>
  );
}
