import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const palettePath = resolve(root, "src/lib/constants/color-palette.json");
const globalsPath = resolve(root, "src/app/globals.css");
const palette = JSON.parse(readFileSync(palettePath, "utf8"));

const semanticNames = Object.keys(palette.semantic);
const vars = {
  "--color-navy": palette.brand.navy,
  "--color-navy-wash": palette.brand.navyWash.toLowerCase(),
};

for (const name of semanticNames) {
  const shades = palette.semantic[name];
  vars[`--color-${name}-50`] = shades["50"];
  vars[`--color-${name}-100`] = shades["100"];
  vars[`--color-${name}-200`] = shades["200"];
  vars[`--color-${name}-600`] = shades["600"];
  vars[`--color-${name}-700`] = shades["700"];
  vars[`--color-${name}-800`] = shades["600"];
  vars[`--color-${name}-900`] = shades["700"];
}

vars["--color-clay-500"] = palette.semantic.clay["600"];

const paletteLines = Object.entries(vars).map(([key, value]) => `  ${key}: ${value};`).join("\n");
const paletteBlock = `  /* @theme-palette-start — generated from color-palette.json (npm run generate:theme) */\n${paletteLines}\n  /* @theme-palette-end */`;

const globals = readFileSync(globalsPath, "utf8");
const startMarker = "  /* @theme-palette-start";
const endMarker = "  /* @theme-palette-end */";

const startIndex = globals.indexOf(startMarker);
const endIndex = globals.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find @theme-palette markers in src/app/globals.css");
  process.exit(1);
}

const updatedGlobals = `${globals.slice(0, startIndex)}${paletteBlock}${globals.slice(endIndex + endMarker.length)}`;
writeFileSync(globalsPath, updatedGlobals, "utf8");

const manifestPath = resolve(root, "public/manifest.webmanifest");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
manifest.theme_color = palette.brand.navyWash;
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log("Updated palette tokens in src/app/globals.css and synced manifest theme_color.");
