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
  createFile: () => createFile,
})
module.exports = __toCommonJS(index_exports)
var import_fs_extra = __toESM(require("fs-extra"))
var import_path = __toESM(require("path"))
function createFile(options) {
  let config
  return {
    name: "vite:create-file:serve",
    apply: "serve",
    buildStart: async () => {
      const { outDir } = config.build
      if (!import_fs_extra.default.existsSync(outDir)) import_fs_extra.default.mkdirSync(outDir)
      import_fs_extra.default.writeFileSync(import_path.default.resolve(outDir, options.name), options.contents)
    },
    buildEnd: async () => {
      const { outDir } = config.build
      import_fs_extra.default.removeSync(import_path.default.resolve(outDir, options.name))
    },
    configResolved(_config) {
      config = _config
    },
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    createFile,
  })
