import asar from "@electron/asar";
import { readFileSync, readdirSync } from "fs";

const manifest = JSON.parse(readFileSync("manifest.json", "utf-8"));
const filenames = ['manifest.json', ...readdirSync("src").map(v => `src/${v}`)]

console.log(filenames)

asar.createPackageFromFiles("./", `${manifest.id}.asar`, filenames);
