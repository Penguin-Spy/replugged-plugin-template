import { readFileSync } from "fs";

const DEFAULT_KEY = "_$default"
const FILENAME_KEY = name => `_\$${name.replace(/\W/g, "_")}`

/* --- util functions --- */
function consumeLiteral(input, regex) {
  let match = input.match(regex)
  if(match === null) throw new SyntaxError(`Expected "${regex.toString()}", got "${input.substring(0, 20)}"...`)
  return input.substring(match[0].length)
}

// convert "a as b" to "a: b"
function importToDestructure(identifier) {
  const match = identifier.match(/^\s*(\S+)(?: as (\S+))?\s*$/)
  identifier = match[1]
  if(match[2]) identifier += ": " + match[2]
  return identifier
}

function exportToDestructure(identifier) {
  const match = identifier.match(/^\s*(\S+)(?: as (\S+))?\s*$/)
  identifier = match[1]
  if(match[2]) identifier = match[2] + ": " + identifier
  return identifier
}


/* --- parsing functions --- */
function readFile(fileName) {
  const file = {}
  file.name = fileName
  file.input = readFileSync(fileName).toString()
  file.output = ""
  file.requiredFiles = [] // requirements are parsed by parseAndModifyImports
  file.imported = false
  return file
}

// parses file requirements, modifies import statements to const destructuring statements
function parseAndModifyImports(file) {
  let input = file.input;
  let output = file.output;

  // imports
  while(true) {
    let import_identifiers, import_source, match

    // "import "
    try { input = consumeLiteral(input, /^\s*import\s*/) }
    catch(e) { break }

    // "{" or identifier
    if((match = input.match(/^{(.*)}/)) !== null) { // { A, B as C }
      const identifiers = match[1].split(",")
      import_identifiers = "{ " + identifiers.map(importToDestructure).join(", ") + " }"

    } else if((match = input.match(/^\S*/)) !== null) { // A
      import_identifiers = `{ ${DEFAULT_KEY}: ${importToDestructure(match[0])}}`

    } else {
      throw new SyntaxError(`Invalid syntax after "import ": "${input.substring(0, 16)}"...`)
    }
    input = input.substring(match[0].length)

    // " from "
    input = consumeLiteral(input, /^\s*from\s*/)

    // import source
    if((match = input.match(/^"(\S*)"\s*(?:\n|;)/)) !== null) {
      let module = match[1]

      if(module.startsWith("replugged")) {
        import_source = module.replace("/", ".")
      } else if(module.startsWith("./")) {
        import_source = FILENAME_KEY(module.substring(2))
        // mark that this file requires this import
        file.requiredFiles.push("src/" + module.substring(2))
      } else {
        throw new SyntaxError(`Invalid module source: "${module}"`)
      }
    } else {
      throw new SyntaxError(`Invalid syntax after " from ": "${input.substring(0, 16)}"...`)
    }
    input = input.substring(match[0].length)


    // generate full statement
    output += `const ${import_identifiers} = ${import_source};\n`
  }

  file.input = input;
  file.output = output;
}

// removes "export ", replaces with "return { stuff }" at the end
function modifyExports(file) {
  let input = file.input;
  let output = file.output;

  // look for exports
  const exportList = [];

  const exportRegex = /^\s*export\s*/m;
  let match = input.match(exportRegex)
  while(match !== null) {
    const exportStr = match[0]

    output += input.substring(0, match.index)
    input = input.substring(match.index + exportStr.length) // put start of input at end of "export "

    if(input.startsWith("default")) {
      input = consumeLiteral(input, /^default\s*/)
      output += `const ${DEFAULT_KEY} = `
      exportList.push(DEFAULT_KEY)

    } else if(input.startsWith("{")) {
      // read all of { ... };, remove it from input
      const [fullMatch, identifiers] = input.match(/^{(.*)}/)
      input = input.substring(fullMatch.length)

      // convert "x as y" to "y: x" & push into exportList
      exportList.push(...identifiers.split(",").map(exportToDestructure))
    } else {
      // find name of thing, add it to exportList
      const [, identifier] = input.match(/^(?:async)?\s*\S*\s*([^\s({=,]*)/)
      exportList.push(identifier)
    }

    match = input.match(exportRegex)
  }

  output += input + "\nreturn { " + exportList.join(", ") + " }"

  file.input = "";
  file.output = output;
}

function wrapFile(file) {
  modifyExports(file)

  file.output = `${FILENAME_KEY(file.name)} = await(async function(){\n${file.output}\n})()\n`
}


const importedFiles = {};
// key = "path/filename.js"
// values = file object

function recursivelyImport(fileName) {
  if(fileName in importedFiles) return // do nothing if it's already imported
  const file = readFile(fileName)
  parseAndModifyImports(file)
  importedFiles[fileName] = file
  file.requiredFiles.forEach(recursivelyImport)
}

// TODO: how to find dependency errors (cyclic)
//  if returned undefined but there are stil files left to import?
function nextImportableFile() {
  const nextFile = Object.values(importedFiles).find(file => {
    return !file.imported && (file.requiredFiles.length === 0 || file.requiredFiles.every(k => k in importedFiles))
  })
  if(nextFile !== undefined) {
    nextFile.imported = true
    return nextFile
  }
  if(Object.values(importedFiles).some(file => file.imported === false)) {
    throw new Error("Cyclic dependency error; some files are still required but depend on eachother.\nRelevant files: [ '" +
      Object.values(importedFiles).filter(file => file.imported === false).join("', '") + "' ]")
  } else {
    console.log("done importing?")
  }
}


/* --- main --- */
export function transpile(rendererFilename) {

  // todo: read manifest.json for renderer path
  const renderer = readFile(rendererFilename)
  parseAndModifyImports(renderer)
  renderer.requiredFiles.forEach(recursivelyImport)

  console.log(renderer)

  let output = ""
  let file = nextImportableFile()
  while(file) {
    wrapFile(file)
    console.log(file)
    output += `// ${file.name}\n` + file.output
    file = nextImportableFile()
  }

  output += `// ${renderer.name}\n` + renderer.output + renderer.input

  return output
}
