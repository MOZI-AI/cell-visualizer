import * as Yup from "yup";
import saveSvgAsPng from "./Download";

export const NODE_RADIUS = 4;
export const SELECTED_NODE_RADIUS = 15;
// Constraint a node inside a circlular boundary and not let it out
export const constraintInsideCircle = (x, y, circle, padding) => {
  let R = calculateDistance(x, y, circle.cx, circle.cy);
  if (R > circle.rmax - padding) {
    return {
      x: ((circle.rmax - padding) / R) * (x - circle.cx) + circle.cx,
      y: ((circle.rmax - padding) / R) * (y - circle.cy) + circle.cy
    };
  }
};
// Constraint a node outside a circlular boundary and not let it in
export const constraintOutsideCircle = (x, y, circle, margin) => {
  let R = calculateDistance(x, y, circle.cx, circle.cy);
  if (R < circle.rmax + margin) {
    return {
      x: ((circle.rmax + margin) / R) * (x - circle.cx) + circle.cx,
      y: ((circle.rmax + margin) / R) * (y - circle.cy) + circle.cy
    };
  }
};
// Constraint a node inside a rectangular boundary
export const constraintInsideRectangle = (
  x,
  y,
  maxWidth,
  maxHeight,
  padding
) => {
  return {
    x: x < padding ? padding : x > maxWidth - padding ? maxWidth - padding : x,
    y: y < padding ? padding : y > maxHeight - padding ? maxHeight - padding : y
  };
};

// Calculate and return the distance between two points
export const calculateDistance = (x1, y1, x2, y2) =>
  Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));

// Clone a javascript object
export const clone = obj => JSON.parse(JSON.stringify(obj));

export const convertCytoscapeJSONtoD3 = data => {
  const d = data.elements || data;
  return {
    nodes: d.nodes.map(n => n.data),
    links: d.edges.map(e => e.data)
  };
};

export const modifyLocationAndIDAttributes = data => {
  data.nodes = data.nodes.map(n => {
    n.name = `${n.id}`;
    n.originalLocation = `${n.location}`;
    n.location = n.location.trim().replace(/\s+/g, "_");
    n.id = `${n.name.replace(":", "_")}_${n.location}`;
    return n;
  });
  data.links = data.links.map(l => {
    l.source = data.nodes.find(n => n.name === l.source).id;
    l.target = data.nodes.find(n => n.name === l.target).id;
    return l;
  });
  return data;
};

export const generalizeLocations = (data, locations, defaultLocation) => {
  data.nodes = data.nodes.map(n => {
    const locationMapping = locations.find(l =>
      l.matchers.some(m => n.location.toLowerCase().includes(m.toLowerCase()))
    );
    if (locationMapping) {
      n.location = locationMapping.location;
    } else if (defaultLocation) {
      n.location = defaultLocation;
    }
    return n;
  });
  console.log("data", data);
  return data;
};

export const takeScreenshot = (elementID, screenShotName = "Screenshot") => {
  saveSvgAsPng.saveSvgAsPng(
    document.getElementById(elementID),
    `${screenShotName}.png`
  );
};

export const getPointsOnPath = (path, components) => {
  const length = path.getTotalLength();
  return components.map((c, i, arr) => {
    const { x, y } = path.getPointAtLength((length * i) / arr.length);
    return { ...c, x, y };
  });
};

export const speedUpSimulation = (force, ticks) => {
  for (var i = 0; i < ticks; i++) {
    force.tick();
  }
};

const NodeSchema = Yup.object().shape({
  id: Yup.string().required(),
  location: Yup.string()
});

const LinkSchema = Yup.object().shape({
  source: Yup.string().required(),
  target: Yup.string().required()
});

export const GraphSchema = Yup.object().shape({
  nodes: Yup.array()
    .of(NodeSchema)
    .required(),
  links: Yup.array()
    .of(LinkSchema)
    .required()
});

export const ColorPalletes = [
  "#e6194b",
  "#3cb44b",
  "#f58231",
  "#4363d8",
  "#911eb4",
  "#46f0f0",
  "#ffe119",
  "#f032e6",
  "#bcf60c",
  "#fabebe",
  "#008080",
  "#e6beff",
  "#9a6324",
  "#fffac8",
  "#800000",
  "#aaffc3",
  "#808000",
  "#ffd8b1",
  "#000075",
  "#808080",
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

export const MitochondrionLocations = [
  {
    location: "mitochondrial_inner_membrane",
    matchers: ["mitochondrial_inner_membrane"]
  },
  {
    location: "mitochondrial_outer_membrane",
    matchers: ["mitochondrial_outer_membrane"]
  },
  {
    location: "mitochondrial_intermembrane_space",
    matchers: ["mitochondrial_intermembrane_space"]
  },
  { location: "mitochondrial_matrix", matchers: ["mitochondrial"] }
];
export const EndoplasmicReticulumLocations = [
  {
    location: "rough_endoplasmic_reticulum",
    matchers: [
      "endoplasmic_reticulum_lumen",
      "endoplasmic_reticulum_cisternal_network",
      "endoplasmic_reticulum_quality_control_compartment",
      "rough_endoplasmic_reticulum_lumen"
    ]
  },
  {
    location: "rough_endoplasmic_reticulum_membrane",
    matchers: [
      "endoplasmic_reticulum_membrane",
      "cytoplasmic_side_of_endoplasmic_reticulum_membrane",
      "extrinsic_component_of_endoplasmic_reticulum_membrane",
      "integral_component_of_cytoplasmic_side_of_endoplasmic_reticulum_membrane",
      "integral_component_of_endoplasmic_reticulum_membrane",
      "integral_component_of_lumenal_side_of_endoplasmic_reticulum_membrane",
      "intrinsic_component_of_endoplasmic_reticulum_membrane",
      "lumenal_side_of_endoplasmic_reticulum_membrane",
      "lumenal_side_of_rough_endoplasmic_reticulum_membrane",
      "cytoplasmic_side_of_rough_endoplasmic_reticulum_membrane"
    ]
  },
  {
    location: "smooth_endoplasmic_reticulum",
    matchers: ["smooth_endoplasmic_reticulum_lumen"]
  },
  {
    location: "smooth_endoplasmic_reticulum_membrane",
    matchers: [
      "cytoplasmic_side_of_smooth_endoplasmic_reticulum_membrane",
      "lumenal_side_of_smooth_endoplasmic_reticulum_membrane"
    ]
  }
];

export const NucleusLocations = [
  {
    location: "nucleus_inner_membrane",
    matchers: []
  },
  {
    location: "nucleus_membrane",
    matchers: ["nuclear_envelope"]
  },
  {
    location: "nucleus_outer_membrane",
    matchers: []
  },
  {
    location: "nucleoplasm",
    matchers: ["nucleoplasm"]
  },
  {
    location: "neucleoid",
    matchers: ["neucleoid"]
  }
];

export const GolgiLocations = [
  {
    location: "golgi_apparatus",
    matchers: ["Golgi_apparatus"]
  },
  {
    location: "golgi_membrane",
    matchers: ["Golgi_membrane"]
  }
];


export const CellLocations = [
  { location: "extracellular_region", matchers: ["extracellular"] },
  {
    location: "plasma_membrane",
    matchers: ["plasma_membrane", "cell_outer_membrane"]
  },
  { location: "cytoplasm", matchers: ["cytosol", "cytoplasm"] },
  {
    location: "nucleus",
    matchers: ["nucleus", "nucleosome", "nucleoid", "nucleoplasm"]
  },
  { location: "endosome_membrane", matchers: ["endosome_membrane"] },
  { location: "endosome", matchers: ["endosome"] },
  { location: "mitochondrial_membrane", matchers: ["mitochondrial_membrane"] },
  { location: "mitochondrion", matchers: ["mitochondrial"] },
  {
    location: "host_cell_endoplasmic_reticulum",
    matchers: ["host_cell_endoplasmic_reticulum"]
  },
  
  {
    location: "rough_endoplasmic_reticulum_membrane",
    matchers: ["rough_endoplasmic_reticulum_membrane"]
  },
  {
    location: "rough_endoplasmic_reticulum",
    matchers: ["rough_endoplasmic_reticulum"]
  },
  {
    location: "smooth_endoplasmic_reticulum_membrane",
    matchers: ["smooth_endoplasmic_reticulum_membrane"]
  },
  {
    location: "smooth_endoplasmic_reticulum",
    matchers: ["smooth_endoplasmic_reticulum"]
  },
  {
    location: "endoplasmic_reticulum_membrane",
    matchers: ["endoplasmic_reticulum_membrane"]
  },
  {
    location: "endoplasmic_reticulum",
    matchers: ["endoplasmic_reticulum"]
  },
  { location: "autophagosome_membrane", matchers: ["autophagosome_membrane"] },
  { location: "autophagosome", matchers: ["autophagosome"] },
  { location: "azurophil_granule", matchers: ["azurophil_granule"] },
  { location: "desmosome", matchers: ["desmosome"] },
  { location: "endocytic_vesicle", matchers: ["endocytic_vesicle"] },
  { location: "endolysosome", matchers: ["endolysosome"] },
  { location: "ficolin-1-rich_granule", matchers: ["ficolin-1-rich_granule"] },
  { location: "fungal-type_vacuole", matchers: ["fungal-type_vacuole"] },
  { location: "glycosome", matchers: ["glycosome"] },
  {
    location:
      "endoplasmic_reticulum-Golgi_intermediate_compartment_(ERGIC)_membrane",
    matchers: [
      "endoplasmic_reticulum-Golgi_intermediate_compartment_(ERGIC)_membrane"
    ]
  },
  {
    location: "golgi-associated_vesicle",
    matchers: ["golgi-associated_vesicle"]
  },

  { location: "golgi_apparatus", matchers: ["golgi"] },
  { location: "lysosome_membrane", matchers: ["lysosome_membrane"] },
  { location: "lysosome", matchers: ["lysosome", "lysosomal"] },
  { location: "melanosome", matchers: ["melanosome"] },
  { location: "multivesicular_body", matchers: ["multivesicular_body"] },
  { location: "omegasome_membrane", matchers: ["omegasome_membrane"] },
  { location: "omegasome", matchers: ["omegasome"] },
  {
    location: "pathogen-containing_vacuole",
    matchers: ["pathogen-containing_vacuole"]
  },
  { location: "peroxisome", matchers: ["peroxisomal", "peroxisome"] },
  { location: "phagocytic_vesicle", matchers: ["phagocytic_vesicle"] },
  { location: "photoreceptor_membrane", matchers: ["photoreceptor_membrane"] },
  { location: "photoreceptor", matchers: ["photoreceptor"] },

  {
    location: "plastid_thylakoid_membrane",
    matchers: ["plastid_thylakoid_membrane"]
  },
  {
    location: "plastid_thylakoid",
    matchers: ["plastid_thylakoid"]
  },
  { location: "platelet_alpha_granule", matchers: ["platelet_alpha_granule"] },
  { location: "platelet_dense_granule", matchers: ["platelet_dense_granule"] },
  {
    location: "protein_storage_vacuole",
    matchers: ["protein_storage_vacuole"]
  },
  { location: "sarcoplasmic_reticulum", matchers: ["sarcoplasmic_reticulum"] },
  { location: "secretory_granule", matchers: ["secretory_granule"] },
  { location: "specific_granule", matchers: ["specific_granule"] },
  { location: "thylakoid_membrane", matchers: ["thylakoid_membrane"] },
  { location: "thylakoid", matchers: ["thylakoid"] },
  { location: "vesicle", matchers: ["vesicle"] },
  {
    location: "platelet_dense_tubular_network",
    matchers: ["platelet_dense_tubular_network"]
  }
];

export const CellLocationGeneralization = [
  {
    location: "extracellular region",
    children: [
      "extracellular core region of desmosome",
      "extracellular exosome",
      "extracellular exosome"
    ]
  },
  {
    location: "plasma membrane",
    children: [
      "plasma membrane part of hemidesmosome",
      "plasma membrane respirasome",
      "plasma membrane-derived thylakoid lumen",
      "plasma membrane-derived thylakoid membrane",
      "plasma membrane-derived thylakoid photosystem II",
      "sperm plasma membrane",
      "cell outer membrane",
      "external side of plasma membrane"
    ]
  },
  {
    location: "cytoplasm",
    children: [
      "cytosol",
      "perinuclear region of cytoplasm",
      "dendrite cytoplasm"
    ]
  },
  {
    location: "nucleus",
    children: [
      "antipodal cell nucleus",
      "ascospore-type prospore nucleus",
      "CENP-A containing nucleosome",
      "condensed nuclear chromosome",
      "female germ cell nucleus",
      "female pronucleus",
      "generative cell nucleus",
      "germ cell nucleus",
      "left nucleus",
      "lobed nucleus",
      "macronucleus",
      "male germ cell nucleus",
      "male pronucleus",
      "megagametophyte egg cell nucleus",
      "megasporocyte nucleus",
      "micronucleus",
      "microsporocyte nucleus",
      "nuclear nucleosome",
      "nuclear replisome",
      "nuclear stress granule",
      "nucleoid",
      "nucleoplasm",
      "polar nucleus",
      "primary endosperm nucleus",
      "pronucleus",
      "right nucleus"
    ]
  },
  {
    location: "endosome",
    children: [
      "early endosome lumen",
      "early endosome",
      "late endosome",
      "late endosome lumen",
      "endosome lumen"
    ]
  },
  {
    location: "endosome membrane",
    children: [
      "cytoplasmic side of endosome membrane",
      "extrinsic component of endosome membrane",
      "integral component of endosome membrane",
      "intrinsic component of endosome membrane",
      "lumenal side of endosome membrane",
      "cytoplasmic side of early endosome membrane",
      "integral component of postsynaptic early endosome membrane",
      "lumenal side of early endosome membrane",
      "cytoplasmic side of late endosome membrane",
      "lumenal side of late endosome membrane",
      "extrinsic component of postsynaptic early endosome membrane",
      "intrinsic component of postsynaptic early endosome membrane",
      "extrinsic component of postsynaptic endosome membrane",
      "integral component of postsynaptic endosome membrane",
      "intrinsic component of postsynaptic endosome membrane",
      "extrinsic component of postsynaptic recycling endosome membrane",
      "integral component of postsynaptic recycling endosome membrane",
      "intrinsic component of postsynaptic recycling endosome membrane",
      "extrinsic component of presynaptic endosome membrane",
      "integral component of presynaptic endosome membrane",
      "intrinsic component of presynaptic endosome membrane",
      "early endosome membrane",
      "late endosome membrane"
    ]
  },
  {
    location: "mitochondrial membrane",
    children: ["mitochondrial outer membrane"]
  },
  {
    location: "mitochondrion",
    children: [
      "mitochondrial degradosome",
      "mitochondrial inner membrane",
      "mitochondrial intermembrane space",
      "mitochondrial matrix",
      "mitochondrial respirasome",
      "mitochondrial ribosome"
    ]
  },
  {
    location: "endoplasmic reticulum",
    children: [
      "endoplasmic reticulum cisternal network",
      "endoplasmic reticulum lumen",
      "endoplasmic reticulum quality control compartment"
    ]
  },
  {
    location: "endoplasmic reticulum membrane",
    children: [
      "cytoplasmic side of endoplasmic reticulum membrane",
      "extrinsic component of endoplasmic reticulum membrane",
      "integral component of cytoplasmic side of endoplasmic reticulum membrane",
      "integral component of endoplasmic reticulum membrane",
      "integral component of lumenal side of endoplasmic reticulum membrane",
      "intrinsic component of endoplasmic reticulum membrane",
      "lumenal side of endoplasmic reticulum membrane"
    ]
  },
  {
    location: "rough endoplasmic reticulum",
    children: ["rough endoplasmic reticulum lumen"]
  },
  {
    location: "rough endoplasmic reticulum membrane",
    children: [
      "lumenal side of rough endoplasmic reticulum membrane",
      "cytoplasmic side of rough endoplasmic reticulum membrane"
    ]
  },
  {
    location: "smooth endoplasmic reticulum",
    children: ["smooth endoplasmic reticulum lumen"]
  },
  {
    location: "smooth endoplasmic reticulum membrane",
    children: [
      "cytoplasmic side of smooth endoplasmic reticulum membrane",
      "lumenal side of smooth endoplasmic reticulum membrane"
    ]
  },
  {
    location:
      "endoplasmic reticulum-Golgi intermediate compartment (ERGIC) membrane",
    children: [
      "integral component of endoplasmic reticulum-Golgi intermediate compartment (ERGIC) membrane",
      "intrinsic component of endoplasmic reticulum-Golgi intermediate compartment (ERGIC) membrane"
    ]
  },
  {
    location: "autophagosome membrane",
    children: [
      "extrinsic component of autophagosome membrane",
      "integral component of autophagosome membrane",
      "intrinsic component of autophagosome membrane"
    ]
  },
  { location: "azurophil granule", children: ["azurophil granule lumen"] },
  {
    location: "desmosome",
    children: [
      "inner dense plaque of desmosome",
      "outer dense plaque of desmosome"
    ]
  },
  { location: "endocytic vesicle", children: ["endocytic vesicle lumen"] },
  { location: "endolysosome", children: ["endolysosome lumen"] },
  {
    location: "ficolin-1-rich granule",
    children: ["ficolin-1-rich granule lumen"]
  },
  {
    location: "fungal-type vacuole",
    children: ["fungal-type vacuole lumen"]
  },
  { location: "glycosome", children: ["glycosome lumen"] },
  { location: "golgi apparatus", children: ["golgi lumen"] },
  {
    location: "golgi-associated vesicle",
    children: ["golgi-associated vesicle lumen"]
  },
  {
    location: "host cell endoplasmic reticulum",
    children: ["host cell endoplasmic reticulum lumen"]
  },
  { location: "lysosome", children: ["lysosomal lumen"] },
  {
    location: "lysosome membrane",
    children: ["extrinsic component of lysosome membrane"]
  },
  { location: "melanosome", children: ["melanosome lumen"] },

  {
    location: "multivesicular body",
    children: ["multivesicular body lumen"]
  },

  {
    location: "omegasome membrane",
    children: [
      "extrinsic component of omegasome membrane",
      "integral component of omegasome membrane",
      "intrinsic component of omegasome membrane"
    ]
  },
  {
    location: "pathogen-containing vacuole",
    children: ["pathogen-containing vacuole lumen"]
  },
  { location: "peroxisome", children: ["peroxisomal matrix"] },
  { location: "phagocytic vesicle", children: ["phagocytic vesicle lumen"] },
  {
    location: "phagolysosome vesicle",
    children: ["phagolysosome vesicle lumen"]
  },
  {
    location: "photoreceptor",
    children: ["photoreceptor cell cilium", "photoreceptor connecting cilium"]
  },
  {
    location: "photoreceptor membrane",
    children: [
      "photoreceptor disc membrane",
      "photoreceptor inner segment membrane",
      "photoreceptor outer segment membrane"
    ]
  },
  {
    location: "plastid thylakoid membrane",
    children: [
      "extrinsic component of lumenal side of plastid thylakoid membrane",
      "extrinsic component of plastid thylakoid membrane"
    ]
  },
  {
    location: "platelet alpha granule",
    children: ["platelet alpha granule lumen"]
  },
  {
    location: "platelet dense granule",
    children: ["platelet dense granule lumen"]
  },
  {
    location: "protein storage vacuole",
    children: ["protein storage vacuole lumen"]
  },
  {
    location: "sarcoplasmic reticulum",
    children: ["sarcoplasmic reticulum lumen"]
  },
  { location: "secretory granule", children: ["secretory granule lumen"] },

  { location: "specific granule", children: ["specific granule lumen"] },
  { location: "tertiary granule", children: ["tertiary granule lumen"] },
  {
    location: "thylakoid membrane",
    children: ["intrinsic component of thylakoid membrane"]
  },
  { location: "vesicle", children: ["vesicle lumen"] }
];

export const GroupMapping = [
  // CLATHIN
  {
    component: "clathrin-coated_endocytic_vesicle",
    membrane: "clathrin-coated_endocytic_vesicle_membrane"
  },
  {
    component: "clathrin-sculpted_glutamate_transport_vesicle",
    membrane: "clathrin-sculpted_glutamate_transport_vesicle membrane"
  },
  {
    component: "clathrin-sculpted_monoamine_transport_vesicle",
    membrane: "clathrin-sculpted_monoamine_transport_vesicle membrane"
  },
  {
    component: "clathrin-sculpted_acetylcholine_transport_vesicle",
    membrane: "clathrin-sculpted_acetylcholine_transport_vesicle_membrane"
  },
  {
    component: "clathrin-sculpted_gamma-aminobutyric_acid_transport_vesicle",
    membrane:
      "clathrin-sculpted_gamma-aminobutyric_acid_transport_vesicle_membrane"
  },
  // ENDOSOME
  { component: "endosome", membrane: "endosome_membrane" },
  // {
  //   component: "endosome",
  //   membrane: "cytoplasmic_side_of_early_endosome_membrane"
  // },
  // { component: "endosome", membrane: "cytoplasmic_side_of_endosome_membrane" },
  // {
  //   component: "endosome",
  //   membrane: "cytoplasmic_side_of_late_endosome_membrane"
  // },
  { component: "early_endosome", membrane: "early_endosome_membrane" },
  { component: "late_endosome", membrane: "late_endosome_membrane" },
  {
    component: "postsynaptic_early_endosome",
    membrane: "postsynaptic_early_endosome_membrane"
  },
  {
    component: "postsynaptic_endosome",
    membrane: "postsynaptic_endosome_membrane"
  },
  {
    component: "postsynaptic_recycling_endosome",
    membrane: "postsynaptic_recycling_endosome membrane"
  },
  { component: "recycling_endosome", membrane: "recycling_endosome_membrane" },
  {
    component: "presynaptic_endosome",
    membrane: "presynaptic_endosome_membrane"
  },
  // ENDOPLASMIC RETICULUM
  {
    component: "endoplasmic_reticulum",
    membrane: "endoplasmic_reticulum_membrane"
  },
  // {
  //   component: "endoplasmic_reticulum",
  //   membrane: "cytoplasmic_side_of_endoplasmic_reticulum_membrane"
  // },
  // {
  //   component: "endoplasmic_reticulum",
  //   membrane: "endoplasmic_reticulum_membrane"
  // },
  // {
  //   component: "rough_endoplasmic_reticulum",
  //   membrane: "cytoplasmic_side_of_rough_endoplasmic_reticulum_membrane"
  // },
  // {
  //   component: "smooth_endoplasmic_reticulum",
  //   membrane: "cytoplasmic_side_of_smooth_endoplasmic_reticulum_membrane"
  // },
  {
    component: "smooth_endoplasmic_reticulum",
    membrane: "smooth_endoplasmic_reticulum membrane"
  },
  {
    component: "rough_endoplasmic_reticulum",
    membrane: "rough_endoplasmic_reticulum membrane"
  },
  {
    component: "endoplasmic_reticulum-Golgi_intermediate_compartment",
    membrane: "endoplasmic_reticulum-Golgi_intermediate_compartment_membrane"
  },
  // ER to Golgi
  {
    component: "ER_to_Golgi_transport_vesicle",
    membrane: "ER_to_Golgi_transport_vesicle_membrane"
  },
  // VESICLE
  {
    component: "cytoplasmic_vesicle",
    membrane: "cytoplasmic_vesicle_membrane"
  },
  { component: "endocytic_vesicle", membrane: "endocytic_vesicle_membrane" },
  { component: "transport_vesicle", membrane: "transport_vesicle_membrane" },
  { component: "vesicle", membrane: "vesicle_membrane" },
  { component: "synaptic_vesicle", membrane: "synaptic_vesicle_membrane" },
  { component: "phagocytic_vesicle", membrane: "phagocytic_vesicle_membrane" },
  {
    component: "phagolysosome_vesicle",
    membrane: "phagolysosome_vesicle_membrane"
  },
  // Golgi
  { component: "Golgi", membrane: "Golgi_membrane" },
  {
    component: "Golgi-associated_vesicle",
    membrane: "Golgi-associated_vesicle membrane"
  },
  {
    component: "trans-Golgi_network",
    membrane: "trans-Golgi_network_membrane"
  },
  // Host cell
  {
    component: "host_cell_endoplasmic_reticulum",
    membrane: "host_cell_endoplasmic_reticulum membrane"
  },
  { component: "host_cell_endosome", membrane: "host_cell_endosome_membrane" },
  {
    component: "host_cell_late_endosome",
    membrane: "host_cell_late_endosome_membrane"
  },
  {
    component: "host_cell_rough_endoplasmic_reticulum",
    membrane: "host_cell_rough_endoplasmic_reticulum membrane"
  },
  {
    component: "host_cell_smooth_endoplasmic_reticulum",
    membrane: "host_cell_smooth_endoplasmic_reticulum_membrane"
  },
  {
    component: "host_cell_endoplasmic_reticulum-Golgi_intermediate_compartment",
    membrane:
      "host_cell_endoplasmic_reticulum-Golgi_intermediate_compartment_membrane"
  },
  // Mitochondria
  { component: "mitochondrion", membrane: "mitochondrial_membrane" },

  // { component: "mitochondrion", membrane: "mitochondrial_inner_membrane" },
  // { component: "mitochondrion", membrane: "mitochondrial_outer_membrane" },
  {
    component: "mitochondria-associated_endoplasmic_reticulum",
    membrane: "mitochondria-associated_endoplasmic_reticulum_membrane"
  },
  // VACUOLE
  {
    component: "fungal-type_vacuole",
    membrane: "fungal-type_vacuole_membrane"
  },
  { component: "lytic_vacuole", membrane: "lytic_vacuole_membrane" },
  {
    component: "pathogen-containing_vacuole",
    membrane: "pathogen-containing_vacuole_membrane"
  },
  {
    component: "protein_storage_vacuole",
    membrane: "protein_storage_vacuole_membrane"
  },
  {
    component: "symbiont-containing_vacuole",
    membrane: "symbiont-containing_vacuole_membrane"
  },
  { component: "lysosome", membrane: "lysosomal_membrane" },
  { component: "centrosome", membrane: "centrosome_membrane" },
  { component: "omegasome", membrane: "omegasome_membrane" },
  { component: "glycosome", membrane: "glycosome_membrane" },
  { component: "chitosome", membrane: "chitosome_membrane" },
  { component: "amphisome", membrane: "aamphisome_membrane" },
  { component: "esterosome", membrane: "esterosome_membrane" },
  { component: "glyoxysome", membrane: "glyoxysome_membrane" },
  { component: "melanosome", membrane: "melanosome_membrane" },
  { component: "peroxisome", membrane: "peroxisomal_membrane" },
  { component: "reservosome", membrane: "reservosome_membrane" },
  { component: "endolysosome", membrane: "endolysosome_membrane" },
  { component: "sperm_plasma", membrane: "sperm_plasma_membrane" },
  { component: "phagolysosome", membrane: "phagolysosome_membrane" },
  { component: "autophagosome", membrane: "autophagosome_membrane" },
  { component: "lamellar_body", membrane: "lamellar_body_membrane" },
  { component: "acidocalcisome", membrane: "acidocalcisome_membrane" },
  { component: "specific_granule", membrane: "specific_granule_membrane" },
  { component: "tertiary_granule", membrane: "tertiary_granule_membrane" },
  { component: "secretory_granule", membrane: "secretory_granule_membrane" },
  {
    component: "platelet_alpha_granule",
    membrane: "platelet_alpha_granule_membrane"
  },
  {
    component: "platelet_dense_granule",
    membrane: "platelet_dense_granule_membrane"
  },
  {
    component: "ficolin-1-rich_granule",
    membrane: "ficolin-1-rich_granule_membrane"
  },
  {
    component: "sarcoplasmic_reticulum",
    membrane: "sarcoplasmic_reticulum_membrane"
  },
  {
    component: "phagophore_assembly_site",
    membrane: "phagophore_assembly_site_membrane"
  },
  { component: "photoreceptor_disc", membrane: "photoreceptor_disc_membrane" },
  {
    component: "photoreceptor_inner_segment",
    membrane: "photoreceptor_inner_segment_membrane"
  },
  {
    component: "photoreceptor_inner_segment",
    membrane: "photoreceptor_outer_segment_membrane"
  },
  {
    component: "azurophil_granule_lumen",
    membrane: "azurophil_granule_membrane"
  },
  { component: "nucleus", membrane: "nuclear_envelope" },
  {
    component: "platelet_dense_tubular_network",
    membrane: "platelet_dense_tubular_network_membrane"
  },
  { component: "early_phagosome", membrane: "early_phagosome_membrane" }
];
