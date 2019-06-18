import React, { Component, Fragment } from "react";
import ReactDOM from "react-dom";
import { Button, message, Drawer } from "antd";
import CellVisualizer from "./CellVisualizer";
import PercentageChart from "./PercentageChart";
import OrganelleDescription from "./OrganelleDescription";
import LandingPage from "./LandingPage";
import ToolBar from "./ToolBar";
import Navigator from "./Navigator";
import LocationFilter from "./LocationFilter";
import { ColorSchemeSelector } from "./ColorSchemeSelector";
import Mitochondria from "./Mitochondria";
import EndoplasmicReticulum from "./EndoplasmicReticulum";
import Loader from "./Loader";
import LabelControl from "./LabelControl";
import {
  ColorPalletes,
  GraphSchema,
  GroupMapping,
  modifyLocationAndIDAttributes,
  convertCytoscapeJSONtoD3,
  takeScreenshot,
  CellLocations,
  MitochondrionLocations,
  EndoplasmicReticulumLocations,
  generalizeLocations,
  clone
} from "./utils";
import "antd/dist/antd.css";
import "./style.css";
import Ribosome from "./Ribosome";

export class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: undefined,
      visualizerAdoptedData: undefined,
      fileName: undefined,
      selectedNode: undefined,
      selectedOrganelle: null,
      loading: false,
      colorScheme: null,
      colorSelector: n => "#000",
      locationFilters: undefined,
      toolbarCollapsed: false,
      drawerOpened: false,
      nodeLabelVisibility: n => false,
      nodeLabelContent: n => n.name
    };

    this.handleNodeSelected = this.handleNodeSelected.bind(this);
    this.handleOrganelleSelected = this.handleOrganelleSelected.bind(this);
    this.handleFileUploaded = this.handleFileUploaded.bind(this);
    this.handleColorSchemeChange = this.handleColorSchemeChange.bind(this);
    this.isOrganelleSelected = this.isOrganelleSelected.bind(this);
    this.handleOrganelleSelected = this.handleOrganelleSelected.bind(this);
  }

  handleOrganelleSelected(selectedOrganelle) {
    this.setState(state => {
      const visualizerAdoptedData = this.adoptDataToSelectedOrganelle(
        state.data,
        selectedOrganelle
      );
      return { visualizerAdoptedData, selectedOrganelle };
    });
  }

  adoptDataToSelectedOrganelle(data, selectedOrganelle) {
    let d;
    switch (selectedOrganelle) {
      case null:
        return generalizeLocations(clone(data), CellLocations);
      case "mitochondrion":
        d = generalizeLocations(clone(data), MitochondrionLocations);
        d.nodes = d.nodes.filter(n =>
          MitochondrionLocations.some(m => m.location === n.location)
        );
        d.links = d.links.filter(l =>
          d.nodes.some(n => n.id === l.source || n.id === l.target)
        );
        return d;
      case "endoplasmic_reticulum":
        d = generalizeLocations(clone(data), EndoplasmicReticulumLocations);
        console.log("data:", data);
        d.nodes = d.nodes.filter(n =>
          EndoplasmicReticulumLocations.some(m => m.location === n.location)
        );
        d.links = d.links.filter(l =>
          d.nodes.some(n => n.id === l.source || n.id === l.target)
        );

        console.log("d:", d);
        return d;

      default:
        return clone(data);
    }
  }

  handleFileUploaded(fileName, data) {
    let d = typeof data === "string" ? JSON.parse(data) : data;
    GraphSchema.isValid(d).then(
      function(valid) {
        if (!valid) {
          try {
            d = convertCytoscapeJSONtoD3(d);
            GraphSchema.isValid(d).then(valid => {
              if (!valid) throw "Invalid JSON file.";
              d = modifyLocationAndIDAttributes(d);
              const visualizerAdoptedData = this.adoptDataToSelectedOrganelle(
                d,
                this.state.selectedOrganelle
              );
              return this.setState({
                fileName,
                data: d,
                visualizerAdoptedData
              });
            });
          } catch (err) {
            return message.error(err);
          }
        } else {
          d = modifyLocationAndIDAttributes(d);
          const visualizerAdoptedData = this.adoptDataToSelectedOrganelle(
            d,
            this.state.selectedOrganelle
          );
          this.setState({ fileName, data: d, visualizerAdoptedData });
        }
      }.bind(this)
    );
  }

  handleNodeSelected(node) {
    this.setState({ selectedNode: node });
  }

  isOrganelleSelected(organelle) {
    return this.state.selectedOrganelle === organelle;
  }

  renderVisualization() {
    const { visualizerAdoptedData: data } = this.state;
    return (
      <div className="visualization-wrapper">
        {this.isOrganelleSelected(null) && (
          <CellVisualizer
            data={data}
            selectedNode={this.state.selectedNode}
            onOrganelleSelected={this.handleOrganelleSelected}
            groupMapping={GroupMapping}
            onNodeSelected={this.handleNodeSelected}
            onLoadingToggled={loading => this.setState({ loading })}
            colorSelector={this.state.colorSelector}
            locationFilters={this.state.locationFilters}
            nodeLabelVisibility={this.state.nodeLabelVisibility}
            nodeLabelContent={this.state.nodeLabelContent}
          />
        )}
        {this.isOrganelleSelected("mitochondrion") && (
          <Mitochondria
            data={data}
            selectedNode={this.state.selectedNode}
            onOrganelleSelected={this.handleOrganelleSelected}
            onNodeSelected={this.handleNodeSelected}
            colorSelector={this.state.colorSelector}
            locationFilters={this.state.locationFilters}
            nodeLabelVisibility={this.state.nodeLabelVisibility}
            nodeLabelContent={this.state.nodeLabelContent}
          />
        )}
        {this.isOrganelleSelected("ribosome") && (
          <Ribosome
            data={data}
            selectedNode={this.state.selectedNode}
            onOrganelleSelected={this.handleOrganelleSelected}
            onNodeSelected={this.handleNodeSelected}
            colorSelector={this.state.colorSelector}
            locationFilters={this.state.locationFilters}
            nodeLabelVisibility={this.state.nodeLabelVisibility}
            nodeLabelContent={this.state.nodeLabelContent}
          />
        )}
        {this.isOrganelleSelected("endoplasmic_reticulum") && (
          <EndoplasmicReticulum
            data={data}
            selectedNode={this.state.selectedNode}
            onOrganelleSelected={this.handleOrganelleSelected}
            onNodeSelected={this.handleNodeSelected}
            colorSelector={this.state.colorSelector}
            locationFilters={this.state.locationFilters}
            nodeLabelVisibility={this.state.nodeLabelVisibility}
            nodeLabelContent={this.state.nodeLabelContent}
          />
        )}
      </div>
    );
  }

  renderFloatingActionButtons() {
    return (
      <div className="floating-action-buttons-wrapper">
        <Button
          id="download"
          icon="camera"
          size="large"
          shape="round"
          type="primary"
          className="floating-action-button"
          onClick={() => takeScreenshot("svg")}
        />
      </div>
    );
  }

  handleColorSchemeChange(colorScheme, colorSelector) {
    this.setState({ colorScheme, colorSelector });
  }

  render() {
    const {
      visualizerAdoptedData: data,
      selectedOrganelle,
      selectedNode,
      drawerOpened,
      locationFilters,
      loading,
      toolbarCollapsed,
      fileName
    } = this.state;
    return (
      <Fragment>
        {data ? (
          <Fragment>
            {this.renderVisualization()}
            {this.renderFloatingActionButtons()}
            <ToolBar
              onFileUploaded={this.handleFileUploaded}
              collapsed={toolbarCollapsed}
              graphData={data}
              onNodeSelected={this.handleNodeSelected}
              onDrawerOpened={e => this.setState({ drawerOpened: true })}
              onCollapseToggled={() =>
                this.setState(state => ({
                  ...state,
                  toolbarCollapsed: !state.toolbarCollapsed
                }))
              }
              fileName={fileName}
            />
            <Navigator
              selectedOrganelle={selectedOrganelle}
              onNavigate={o => this.handleOrganelleSelected(o)}
            />
            <ColorSchemeSelector
              data={data}
              colorPalletes={ColorPalletes}
              onColorSchemeChange={this.handleColorSchemeChange}
            />
            <OrganelleDescription
              selectedNode={selectedNode}
              onNodeSelected={this.handleNodeSelected}
            />

            <PercentageChart
              width={600}
              height={30}
              data={this.state.colorScheme}
            />
            <Drawer
              title="Filters"
              onClose={e => this.setState({ drawerOpened: false })}
              visible={drawerOpened}
              width={450}
              placement="left"
            >
              <LabelControl
                onNodeLabelVisibilityChanged={f =>
                  this.setState({ nodeLabelVisibility: f })
                }
                onNodeLabelContentChanged={f =>
                  this.setState({ nodeLabelContent: f })
                }
              />
              <br />
              <br />
              <LocationFilter
                filters={locationFilters}
                onChange={locationFilters => this.setState({ locationFilters })}
                graphData={data}
              />
            </Drawer>
          </Fragment>
        ) : (
          <LandingPage onFileUploaded={this.handleFileUploaded} />
        )}
        <Loader visible={loading} />
      </Fragment>
    );
  }
}

ReactDOM.render(<App />, document.getElementById("app"));
