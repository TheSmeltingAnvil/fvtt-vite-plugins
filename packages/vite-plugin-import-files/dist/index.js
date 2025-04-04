"use strict"
var __create = Object.create
var __defProp = Object.defineProperty
var __getOwnPropDesc = Object.getOwnPropertyDescriptor
var __getOwnPropNames = Object.getOwnPropertyNames
var __getProtoOf = Object.getPrototypeOf
var __hasOwnProp = Object.prototype.hasOwnProperty
var __export = (target, all) => {
  for (var name in all) __defProp(target, name, { get: all[name], enumerable: true })
}
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === "object") || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        })
  }
  return to
}
var __toESM = (mod, isNodeMode, target) => (
  (target = mod != null ? __create(__getProtoOf(mod)) : {}),
  __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod,
  )
)
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod)

// src/index.ts
var index_exports = {}
__export(index_exports, {
  importJson: () => importJson,
  importYaml: () => importYaml,
})
module.exports = __toCommonJS(index_exports)

// src/importJson.ts
var import_fs_extra = __toESM(require("fs-extra"))
var import_tosource = __toESM(require("tosource"))
var jsonExtensions = [/\.json$/]
function importJson() {
  return {
    name: "vite:import-files:json",
    transform: async (code, id) => {
      const doProcessFile = jsonExtensions.some((pattern) => pattern.test(id))
      if (!doProcessFile) return null
      const json = import_fs_extra.default.readFileSync(id, "utf-8")
      const data = JSON.parse(json)
      const source = (0, import_tosource.default)(data)
      return {
        code: `const data = ${source};
export default data;`,
        map: { mappings: "" },
      }
    },
  }
}

// src/importYaml.ts
var import_fs_extra2 = __toESM(require("fs-extra"))
var import_tosource2 = __toESM(require("tosource"))
var YAML = __toESM(require("js-yaml"))
var yamlExtensions = [/\.yml$/, /\.yaml$/]
function importYaml() {
  return {
    name: "vite:import-files:yaml",
    transform: async (code, id) => {
      const doProcessFile = yamlExtensions.some((pattern) => pattern.test(id))
      if (!doProcessFile) return null
      const yaml = import_fs_extra2.default.readFileSync(id, "utf-8")
      const data = YAML.load(yaml, { filename: id, json: true })
      const source = (0, import_tosource2.default)(data)
      return {
        code: `const data = ${source};
export default data;`,
        map: { mappings: "" },
      }
    },
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    importJson,
    importYaml,
  })
