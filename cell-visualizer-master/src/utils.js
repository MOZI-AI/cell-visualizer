const d3 = require("d3");

export const fetchGraphData = () =>
  d3.json(
    "https://gist.githubusercontent.com/mbostock/4062045/raw/5916d145c8c048a6e3086915a6be464467391c62/miserables.json"
  );
