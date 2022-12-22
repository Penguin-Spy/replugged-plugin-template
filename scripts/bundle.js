import asar from "@electron/asar";
import { readFileSync, readdirSync, statSync } from "fs";

function getAllFiles(dirPath) {
  const files = []
  readdirSync(dirPath).forEach(file => {
    const path = `${dirPath}/${file}`
    if(statSync(path).isDirectory()) {
      files.push(...getAllFiles(path))
    } else {
      files.push(path)
    }
  })
  return files
}

const manifest = JSON.parse(readFileSync("manifest.json", "utf-8"));
const filenames = ['manifest.json', ...getAllFiles("src")]

console.log(filenames)

asar.createPackageFromFiles("./", `${manifest.id}.asar`, filenames);
