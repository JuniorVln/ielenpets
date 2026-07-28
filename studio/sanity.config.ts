import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { buildLegacyTheme } from "sanity";

import { schemaTypes } from "./schemaTypes";
import { structure } from "./structure";

// Paleta da Ielenpet (Kenneli) aplicada ao painel.
const kenneli = {
  bg: "#effaf8",
  dark: "#24716d",
  darker: "#123f3c",
  accent: "#7ec9c4",
  light: "#d7f1ef",
  text: "#123f3c",
  white: "#ffffff",
};

const ielenTheme = buildLegacyTheme({
  "--black": kenneli.darker,
  "--white": kenneli.white,
  "--gray": "#7d908e",
  "--gray-base": "#7d908e",
  "--component-bg": kenneli.white,
  "--component-text-color": kenneli.text,
  "--brand-primary": kenneli.dark,
  "--default-button-color": "#7d908e",
  "--default-button-primary-color": kenneli.dark,
  "--default-button-success-color": kenneli.dark,
  "--default-button-warning-color": "#c98a2b",
  "--default-button-danger-color": "#b23b3b",
  "--state-info-color": kenneli.dark,
  "--state-success-color": kenneli.dark,
  "--state-warning-color": "#c98a2b",
  "--state-danger-color": "#b23b3b",
  "--main-navigation-color": kenneli.darker,
  "--main-navigation-color--inverted": kenneli.white,
  "--focus-color": kenneli.accent,
});

export default defineConfig({
  name: "ielenpets",
  title: "Ielenpet — Painel",
  projectId: "zfn09zm7",
  dataset: "production",
  theme: ielenTheme,
  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: "2024-06-01" }),
  ],
  schema: {
    types: schemaTypes,
  },
});
