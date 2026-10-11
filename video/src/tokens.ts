// Quantum Observatory design tokens — mirrors src/design-tokens.css
export const C = {
  paper: "#f4f0e6",
  surface: "#fdfaf2",
  ink: "#171a21",
  inkSoft: "#3a3f4d",
  display: "#0b0d13", // dark measurement inset
  displayEdge: "#1c2030",
  blue: "#1f46b4",
  teal: "#0c8f84",
  amber: "#d97413",
  red: "#c82436",
  violet: "#6b3fc0",
};

export const FONT = {
  display: "'Fraunces', serif",
  body: "'Spectral', serif",
  mono: "'IBM Plex Mono', monospace",
};

// emission-spectrum ramp used for rules / accents
export const SPECTRUM = [C.red, C.amber, "#c9a400", C.teal, C.blue, C.violet];

export const GRID_BG = `repeating-linear-gradient(0deg, rgba(23,26,33,0.045) 0 1px, transparent 1px 48px), repeating-linear-gradient(90deg, rgba(23,26,33,0.045) 0 1px, transparent 1px 48px)`;
