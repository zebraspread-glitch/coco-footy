// generatePatterns.js
// Creates the SAME SVG pattern for every AFL club in /public/patterns
// Pattern: base background + two vertical stripes (left + right colours)

import fs from "fs";
import path from "path";

const AFL_CLUBS = [
  { name: "Collingwood", primary: "#000000", text: "#FFFFFF", stripeLeft: "#FFFFFF", stripeRight: "#FFFFFF" },
  { name: "Carlton", primary: "#021e2e", text: "#FFFFFF", stripeLeft: "#FFFFFF", stripeRight: "#FFFFFF" },
  { name: "Richmond", primary: "#F7B500", text: "#FFFFFF", stripeLeft: "#000000", stripeRight: "#000000" },
  { name: "Essendon", primary: "#C8102E", text: "#FFFFFF", stripeLeft: "#000000", stripeRight: "#000000" },
  { name: "Geelong", primary: "#0F2A4A", text: "#FFFFFF", stripeLeft: "#FFFFFF", stripeRight: "#FFFFFF" },
  { name: "Hawthorn", primary: "#4B2E1E", text: "#FFFFFF", stripeLeft: "#F7B500", stripeRight: "#F7B500" },
  { name: "Melbourne", primary: "#0A2A5E", text: "#FFFFFF", stripeLeft: "#C8102E", stripeRight: "#C8102E" },
  { name: "Sydney", primary: "#E41E2B", text: "#FFFFFF", stripeLeft: "#FFFFFF", stripeRight: "#FFFFFF" },
  { name: "Brisbane", primary: "#7C003E", text: "#FFD200", stripeLeft: "#FFD200", stripeRight: "#002F6C" },
  { name: "West Coast", primary: "#002B5C", text: "#FFD200", stripeLeft: "#FFD200", stripeRight: "#FFD200" },
  { name: "Fremantle", primary: "#2B0A3D", text: "#FFFFFF", stripeLeft: "#FFFFFF", stripeRight: "#FFFFFF" },
  { name: "Adelaide", primary: "#0f1432", text: "#E41E2B", stripeLeft: "#E41E2B", stripeRight: "#FFD200" },
  { name: "Port Adelaide", primary: "#008bab", text: "#111111", stripeLeft: "#FFFFFF", stripeRight: "#111111" },
  { name: "St Kilda", primary: "#FFFFFF", text: "#E41E2B", stripeLeft: "#000000", stripeRight: "#E41E2B" },
  { name: "Western Bulldogs", primary: "#0047AB", text: "#FFFFFF", stripeLeft: "#C8102E", stripeRight: "#FFFFFF" },
  { name: "North Melbourne", primary: "#003A70", text: "#FFFFFF", stripeLeft: "#FFFFFF", stripeRight: "#FFFFFF" },
  { name: "Gold Coast", primary: "#B30000", text: "#FFD200", stripeLeft: "#FFD200", stripeRight: "#FFD200" },
  { name: "GWS", primary: "#ff7800", text: "#adadad", stripeLeft: "#111111", stripeRight: "#FFFFFF" },
];

function clubSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function svgWrap(inner) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="160" viewBox="0 0 600 160">
${inner}
</svg>`;
}

// Two centered vertical stripes
function twoVerticalLines(base, leftColor, rightColor) {
  const W = 600;
  const H = 160;

  const stripeW = 30; // thickness
  const gap = 30;     // space between stripes
  const center = W / 2;

  const x1 = center - stripeW - gap / 2;
  const x2 = center + gap / 2;

  return svgWrap(`
<rect width="${W}" height="${H}" fill="${base}" />
<rect x="${x1}" y="0" width="${stripeW}" height="${H}" fill="${leftColor}" />
<rect x="${x2}" y="0" width="${stripeW}" height="${H}" fill="${rightColor}" />
`);
}

// ✅ THIS was missing in your file
function patternForClub(club) {
  const base = club.primary;

  // Use YOUR chosen stripe colours (not text)
  let left = club.stripeLeft ?? "#FFFFFF";
  let right = club.stripeRight ?? "#FFFFFF";

  return twoVerticalLines(base, left, right);
}

/** ---------- Write files ---------- */
const outDir = path.join(process.cwd(), "public", "patterns");
fs.mkdirSync(outDir, { recursive: true });

for (const club of AFL_CLUBS) {
  const file = path.join(outDir, `${clubSlug(club.name)}.svg`);
  fs.writeFileSync(file, patternForClub(club), "utf8");
  console.log("Wrote", file);
}

console.log("✅ Done. Patterns created.");
