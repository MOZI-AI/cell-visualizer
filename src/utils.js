const d3 = require("d3");

export const fetchGraphData = () =>
  d3.json(
    "https://gist.githubusercontent.com/mbostock/4062045/raw/5916d145c8c048a6e3086915a6be464467391c62/miserables.json"
  );

export const ColorPalletes = [
  "#f7bac9",
  "#ed5e81",
  "#9fdfa7",
  "#ffe84d",
  "#95a7e9",
  "#fbd3b6",
  "#f79855",
  "#d892ed",
  "#b7effb",
  "#56d9f5",
  "#f688f1",
  "#e7f9b9",
  "#c6f15b",
  "#f68989",
  "#cbe7e4",
  "#85c7c0",
  "#ce80ff",
  "#e1b3ff",
  "#ba4dff",
  "#fff380",
  "#ffb3b3",
  "#ff4d4d",
  "#b3ffc9",
  "#80ffa5",
  "#4dff81",
  "#ffffb3",
  "#ffff80",
  "#ffff4d",
  "#ffd9b3",
  "#ffbf80",
  "#ffa64d",
  "#b3b3ff",
  "#8080ff",
  "#4d4dff",
  "#d9d9d9",
  "#bfbfbf",
  "#a6a6a6"
];
