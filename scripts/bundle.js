import asar from "@electron/asar";
import { readFileSync, writeFileSync } from "fs";
import { transpile } from "./parse.js"

const manifest = JSON.parse(readFileSync("manifest.json", "utf-8"));
writeFileSync("dist/renderer.js", transpile(manifest.renderer))
manifest.renderer = "renderer.js"
writeFileSync("dist/manifest.json", JSON.stringify(manifest))

asar.createPackage("dist", `${manifest.id}.asar`);
