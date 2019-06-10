import React, { Component, Fragment } from "react";
import ReactDOM from "react-dom";
import CellVisualizer from "./CellVisualizer";
import { PercentageChart } from "./PercentageChart";
import FileUpload from "./FileUpload";
import OrganelleDescription from "./OrganelleDescription";
import {
  Button,
  Input,
  Icon,
  Typography,
  AutoComplete,
  message,
  Popover,
  Spin,
  Tag,
  Drawer
} from "antd";
import {
  ColorPalletes,
  GraphSchema,
  GroupMapping,
  CellLocations
} from "./utils";
import "antd/dist/antd.css";
import "./style.css";
import { ColorSchemeSelector } from "./ColorSchemeSelector";
import Mitochondria from "./Mitochondria";
import Nucleus from "./Nucleus";

// pdfMake.vfs = pdfFonts.pdfMake.vfs;

export class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: undefined,
      selectedNode: undefined,
      selectedOrganelle: undefined,
      selectedFile: null,
      selectedFileList: [],
      loading: false,
      colorScheme: null,
      colorSelector: n => "#000",
      organelleFilter: { nucleus: true },
      collapseTopbar: false,
      showFilters: false
    };

    this.handleNodeSelected = this.handleNodeSelected.bind(this);
    this.handleOrganelleSelected = this.handleOrganelleSelected.bind(this);
    this.handleFileUploaded = this.handleFileUploaded.bind(this);
    this.handleUploadedFileList = this.handleUploadedFileList.bind(this);
    // this.handleDownloadPdf = this.handleDownloadPdf.bind(this);
    this.handleColorSchemeChange = this.handleColorSchemeChange.bind(this);
    this.isOrganelleShown = this.isOrganelleShown.bind(this);
  }

  handleUploadedFileList(file) {
    this.setState({
      selectedFile: file,
      selectedFileList: [file]
    });
  }

  handleOrganelleSelected(organelle) {
    this.setState({ selectedOrganelle: organelle });
  }

  convertCytoscapeJSONtoD3(data) {
    const d = data.elements || data;
    return {
      nodes: d.nodes.map(n => n.data),
      links: d.edges.map(e => e.data)
    };
  }

  handleFileUploaded(d) {
    let data = typeof d === "string" ? JSON.parse(d) : d;
    GraphSchema.isValid(data).then(
      function (valid) {
        if (valid) {
          const d = this.generalizeLocations(data, CellLocations);
          const organelleFilter = d.nodes.reduce((a, c) => {
            if (!a[c.location]) a[c.location] = true;
            return a;
          }, {});
          return this.setState({
            data: d,
            organelleFilter
          });
        }
        try {
          data = this.convertCytoscapeJSONtoD3(data);
        } catch (err) {
          console.error(err);
          return message.error("Invalid JSON file.");
        }
        GraphSchema.isValid(data).then(
          function (valid) {
            if (valid) {
              const d = this.generalizeLocations(data, CellLocations);
              const organelleFilter = d.nodes.reduce((a, c) => {
                if (!a[c.location]) a[c.location] = true;
                return a;
              }, {});
              this.setState({
                data: d,
                organelleFilter
              });
            } else {
              message.error("Invalid JSON file.");
            }
          }.bind(this)
        );
      }.bind(this)
    );
  }

  generalizeLocations(data, locations) {
    data.nodes = data.nodes.map(n => {
      n.name = n.id;
      n.originalLocation = n.location;
      n.location = n.location.trim().replace(/\s+/g, "_");
      n.id = `${n.name.replace(":", "_")}_${n.location}`;
      const locationMapping = locations.find(l =>
        l.matchers.some(m => n.location.toLowerCase().includes(m.toLowerCase()))
      );
      if (locationMapping) n.location = locationMapping.location;
      return n;
    });

    data.links = data.links.map(l => {
      l.source = data.nodes.find(n => n.name === l.source).id;
      l.target = data.nodes.find(n => n.name === l.target).id;
      return l;
    });

    return data;
  }

  handleNodeSelected(node) {
    this.setState({ selectedNode: node });
  }

  // handleDownloadPdf() {
  //   let prevNodeLocation = "";
  //   // Copy the node's data and add it's connections
  //   let sortedData = [...this.state.data.nodes];
  //   sortedData.map(node => {
  //     let connectedTo = [];
  //     this.state.data.links.map(link => {
  //       if (link.source.id == node.id) {
  //         if (!connectedTo.includes(link.target.id)) {
  //           connectedTo.push(link.target.id);
  //         }
  //       }
  //       if (link.target.id == node.id) {
  //         if (!connectedTo.includes(link.source.id)) {
  //           connectedTo.push(link.source.id);
  //         }
  //       }
  //     });
  //     node.connectedTo = connectedTo;
  //   });
  //   // Sort the node's data first by Group and then by connected nodes
  //   sortedData.sort((a, b) => {
  //     return (
  //       a.location.localeCompare(b.location) ||
  //       b.connectedTo.length - a.connectedTo.length
  //     );
  //   });
  //   // Get the svg and return it's URI
  //   saveSvgAsPng
  //     .svgAsPngUri(document.getElementById("svg"), { scale: 0.55 })
  //     .then(uri => {
  //       // Used to set the PDF's content
  //       var docDefinition = {
  //         content: [
  //           {
  //             image: uri
  //           },
  //           // Create content for each node
  //           sortedData.map(node => {
  //             let nodeInfo = [
  //               {
  //                 // Show title for a new organelle
  //                 text:
  //                   prevNodeLocation != node.location
  //                     ? node.location
  //                     : undefined,
  //                 bold: true,
  //                 margin:
  //                   prevNodeLocation != node.location
  //                     ? [5, 12, 10, 20]
  //                     : [0, 0, 0, 0],
  //                 pageBreak:
  //                   prevNodeLocation != node.location ? "before" : undefined
  //               },
  //               {
  //                 style: "tableExample",
  //                 table: {
  //                   body: [
  //                     ["Name", node.id],
  //                     ["Description", "" + node.description],
  //                     [
  //                       `Connected to (${node.connectedTo.length})`,
  //                       node.connectedTo.join(", ")
  //                     ]
  //                   ]
  //                 },
  //                 margin: [5, 2, 10, 20]
  //               }
  //             ];
  //             if (prevNodeLocation != node.location) {
  //               prevNodeLocation = node.location;
  //             }
  //             return nodeInfo;
  //           })
  //         ]
  //       };
  //       // Download the PDF file
  //       pdfMake.createPdf(docDefinition).download();
  //     });
  // }

  isOrganelleShown(organelle) {
    return this.state.selectedOrganelle === organelle;
  }

  renderVisualization() {
    return (
      <div className="visualization-wrapper">
        <div
          className={
            this.isOrganelleShown(undefined) ? "isActive" : "isNotActive"
          }
        >
          <CellVisualizer
            selectedNode={this.state.selectedNode}
            onOrganelleSelected={this.handleOrganelleSelected}
            groupMapping={GroupMapping}
            data={this.state.data}
            onNodeSelected={this.handleNodeSelected}
            updateLoadingStatus={loading => this.setState({ loading })}
            colorSelector={this.state.colorSelector}
            organelleFilter={this.state.organelleFilter}
          />
        </div>

        <div
          className={
            this.isOrganelleShown("mitochondrion") ? "isActive" : "isNotActive"
          }
        >
          <Mitochondria
            selectedOrganelle={this.state.selectedOrganelle}
            onOrganelleSelected={this.handleOrganelleSelected}
            onNodeSelected={this.handleNodeSelected}
            data={this.state.data}
            toggleDisplay={this.toggleDisplay}
          />
        </div>

        <div
          className={
            this.isOrganelleShown("nucleus") ? "isActive" : "isNotActive"
          }
        >
          <Nucleus
            selectedOrganelle={this.state.selectedOrganelle}
            onOrganelleSelected={this.handleOrganelleSelected}
            onNodeSelected={this.handleNodeSelected}
            data={this.state.data}
            toggleDisplay={this.toggleDisplay}
          />
        </div>

        {this.state.selectedNode && (
          <OrganelleDescription
            selectedNode={this.state.selectedNode}
            onNodeSelected={this.handleNodeSelected}
          />
        )}
        {this.state.colorScheme && (
          <div className="percentage-chart-wrapper">
            <PercentageChart
              width={600}
              height={30}
              data={this.state.colorScheme}
            />
          </div>
        )}
      </div>
    );
  }

  renderLandingPage() {
    return (
      <div className="landing-page-wrapper">
        <Typography.Title level={1}>Cell Visualizer</Typography.Title>
        <FileUpload
          title="Click or drag graph file to this area"
          hint="Upload a graph JSON file to view it in the cell visualizer."
          fileList={this.state.selectedFileList}
          onFileUploaded={this.handleFileUploaded}
          handleFileList={this.handleUploadedFileList}
        />
      </div>
    );
  }

  renderFloatingActionButtons() {
    return (
      <div className="floating-action-buttons-wrapper">
        {/* <Button
          id="download_pdf"
          icon="file-pdf"
          size={"large"}
          type="primary"
          shape="round"
          className="floating-action-button"
          onClick={this.handleDownloadPdf}
        /> */}

        <Button
          id="download"
          icon="camera"
          size={"large"}
          shape="round"
          type="primary"
          className="floating-action-button"
        />
      </div>
    );
  }

  renderTopBar() {
    return (
      <Fragment>
        <div className="top-bar-wrapper">
          <div className="menu">
            {this.state.collapseTopbar || (
              <Fragment>
                <FileUpload
                  title={this.state.selectedFile.name}
                  fileList={this.state.selectedFileList}
                  onFileUploaded={this.handleFileUploaded}
                  handleFileList={this.handleUploadedFileList}
                />
                <Button.Group size="large">
                  <Button
                    type="primary"
                    icon="filter"
                    onClick={e => this.setState({ showFilters: true })}
                  />
                  <Popover
                    content={<p>Controls</p>}
                    title="Title"
                    trigger="click"
                  />
                </Button.Group>
                <AutoComplete
                  dataSource={this.state.data.nodes.map(d => d.id)}
                  placeholder="Search ..."
                  onSelect={selectedId => {
                    this.handleNodeSelected(
                      this.state.data.nodes.find(n => n.id === selectedId)
                    );
                  }}
                  filterOption={(inputValue, option) =>
                    option.props.children
                      .toUpperCase()
                      .indexOf(inputValue.toUpperCase()) !== -1
                  }
                >
                  <Input
                    suffix={<Icon type="search" className="search-icon" />}
                  />
                </AutoComplete>
              </Fragment>
            )}
            <Button
              type="primary"
              icon={this.state.collapseTopbar ? "right" : "left"}
              className="fold-toggle"
              onClick={e =>
                this.setState(state => ({
                  ...state,
                  collapseTopbar: !state.collapseTopbar
                }))
              }
            />
          </div>
        </div>
      </Fragment>
    );
  }

  renderLoader() {
    return (
      <div className="loader-wrapper">
        <div className="content">
          <Spin
            size="large"
            indicator={
              <Icon
                type="loading"
                style={{ fontSize: 24, marginRight: 15 }}
                spin
              />
            }
          />
          <Typography.Text strong>Running visualization ...</Typography.Text>
        </div>
      </div>
    );
  }

  handleColorSchemeChange(colorScheme, colorSelector) {
    this.setState({ colorScheme, colorSelector });
  }

  renderOrganelleFilter() {
    if (this.state.organelleFilter) {
      return (
        <div>
          {Object.keys(this.state.organelleFilter).map(key => (
            <Tag.CheckableTag
              style={{ margin: 5 }}
              key={key}
              checked={this.state.organelleFilter[key]}
              title={key || "Unlocalized"}
              onChange={checked =>
                this.setState(state => ({
                  ...state,
                  organelleFilter: {
                    ...state.organelleFilter,
                    [key]: checked
                  }
                }))
              }
            >
              {key || "Unlocalized"}
            </Tag.CheckableTag>
          ))}
        </div>
      );
    }
  }

  render() {
    return (
      <Fragment>
        {this.state.data ? (
          <Fragment>
            {this.renderFloatingActionButtons()}
            {this.renderTopBar()}
            {this.renderVisualization()}
            <div className="toolbox color-scheme-selector">
              <p style={{ fontWeight: "bold", marginBottom: 5, color: "#000" }}>
                Color scheme
              </p>
              <ColorSchemeSelector
                data={this.state.data}
                colorPalletes={ColorPalletes}
                onColorSchemeChange={this.handleColorSchemeChange}
              />
            </div>
            <Drawer
              title={
                <span>
                  <Icon type="filter" style={{ marginRight: 15 }} />
                  Filters
                </span>
              }
              onClose={e => this.setState({ showFilters: false })}
              visible={this.state.showFilters}
              width={300}
              placement="left"
            >
              <p style={{ fontWeight: "bold", marginBottom: 5, color: "#000" }}>
                Organelle filter
              </p>
              {this.renderOrganelleFilter()}
            </Drawer>
          </Fragment>
        ) : (
            this.renderLandingPage()
          )}
        {this.state.loading && this.renderLoader()}
      </Fragment>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("app"));
