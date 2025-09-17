"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  foundryvtt: () => foundryvtt,
  provide: () => provide
});
module.exports = __toCommonJS(index_exports);
var import_vite_plugin_copy_static_files = require("@foundryvtt/vite-plugin-copy-static-files");
var import_vite_plugin_create_file = require("@foundryvtt/vite-plugin-create-file");
var import_vite_plugin_import_files = require("@foundryvtt/vite-plugin-import-files");
var import_vite_plugin_replace_vars = require("@foundryvtt/vite-plugin-replace-vars");
var fse = __toESM(require("fs-extra"));
var YAML = __toESM(require("js-yaml"));
var import_node_path = __toESM(require("path"));
var mappings;
async function foundryvtt(options) {
  var _a, _b;
  const packageJson = await readFromPackageJson(".");
  mappings = __spreadValues(__spreadValues({}, packageJson.foundry), (_b = (_a = options == null ? void 0 : options.replaceVars) == null ? void 0 : _a.mappings) != null ? _b : []);
  const message = "This file is for a running vite dev server and is not copied to a build";
  return [
    // Create required files.
    (0, import_vite_plugin_create_file.createFile)({
      name: "index.html",
      contents: `<h1>${message}</h1>
`
    }),
    (0, import_vite_plugin_create_file.createFile)({
      name: "index.mjs",
      contents: `/* ${message} */
import './index.ts';
`
      // REVIEW remove `src` when ??? (use root from options?)
    }),
    (0, import_vite_plugin_create_file.createFile)({
      name: "styles.css",
      contents: `/* ${message} */
`
    }),
    // Copy static files with reload if change.
    ...(0, import_vite_plugin_copy_static_files.copyStaticFiles)(
      resolveCopyStaticFilesOptions(options == null ? void 0 : options.root, options == null ? void 0 : options.copyStaticFiles)
    ),
    // Allow importing JSON and YAML files in code.
    (0, import_vite_plugin_import_files.importJson)(),
    (0, import_vite_plugin_import_files.importYaml)(),
    // Replace variables in files.
    (0, import_vite_plugin_replace_vars.replaceVars)({ mappings }),
    // Provide `dist` files.
    provide()
  ];
  async function readFromPackageJson(parent) {
    const filePath = import_node_path.default.join(parent != null ? parent : ".", "package.json");
    const packageJson2 = await fse.readFile(filePath, "utf-8");
    return JSON.parse(packageJson2);
  }
  function resolveCopyStaticFilesOptions(root, options2) {
    var _a2, _b2;
    const defaultOptions = {
      files: [
        {
          pattern: "**/*.hbs",
          root: "src",
          serve: { reloadOnChange: "reload:template" }
        },
        {
          pattern: "**/*.json",
          root: ".",
          ignore: [
            "package.json",
            "package-lock.json",
            "tsconfig.json",
            "tsconfig.*.json",
            "foundryconfig.json",
            "foundryconfig.*.json",
            "src/**"
          ],
          transform: replaceFileVars
        },
        {
          pattern: "**/*.json",
          root: "src",
          transform: replaceFileVars
        },
        {
          pattern: ["**/*.yml", "**/*.yaml"],
          root: ".",
          ignore: [
            "foundryconfig.yml",
            "foundryconfig.*.yml",
            "foundryconfig.yaml",
            "foundryconfig.*.yaml",
            "src/**",
            "packs/**",
            "pnpm-lock.yaml"
          ],
          rename: "*.json",
          transform: replaceFileVars
        },
        {
          pattern: ["**/*.yml", "**/*.yaml"],
          root: "src",
          rename: "*.json",
          transform: replaceFileVars
        }
      ],
      ignore: [
        "node_modules/**",
        "packs/**",
        "public/**",
        "static/**",
        "dist/**",
        "FoundryVTT/**",
        "yarn.lock"
      ]
    };
    if (options2 === void 0 || options2 === true) return defaultOptions;
    if (options2 === false) {
      return {
        ignore: "all",
        files: []
      };
    }
    const ignore = (() => {
      var _a3;
      switch (options2.ignore) {
        case false:
          return [];
        case "all":
          return "all";
        default:
          return [...defaultOptions.ignore, ...(_a3 = options2.ignore) != null ? _a3 : []];
      }
    })();
    return {
      root: (_a2 = root != null ? root : options2.root) != null ? _a2 : defaultOptions.root,
      files: [...defaultOptions.files, ...(_b2 = options2.files) != null ? _b2 : []],
      ignore
    };
  }
  function replaceFileVars(content, filename) {
    for (const k in mappings) {
      const re = new RegExp(`{{${k}}}`, "g");
      const value = mappings[k];
      if (value) {
        content = content.replaceAll(re, value);
      }
    }
    const data = YAML.load(content, { filename, json: true });
    return JSON.stringify(data, null, 2);
  }
}
function provide() {
  let config;
  return {
    name: "vite:provide-src",
    apply: "serve",
    configResolved: async (configResolved) => {
      config = configResolved;
    },
    configureServer: async (server) => {
      const { middlewares } = server;
      return () => {
        middlewares.use(provideDist(config));
      };
    }
  };
  function provideDist(config2) {
    return async (req, res, next) => {
      var _a;
      try {
        let pathname = decodeURI((_a = req.originalUrl) != null ? _a : "");
        pathname = `${config2.build.outDir}/${pathname.replace(
          config2.base,
          ""
        )}`;
        if (!await fse.exists(pathname)) return next();
        const file = await fse.stat(pathname);
        sendStatic(req, res, pathname, file);
      } catch (e) {
        if (e instanceof Error) return next(e);
        throw e;
      }
    };
  }
  function getStaticHeaders(stats) {
    return {
      "Content-Length": stats.size,
      "Last-Modified": stats.mtime.toUTCString(),
      ETag: `W/"${stats.size}-${stats.mtime.getTime()}"`,
      "Cache-Control": "no-cache"
    };
  }
  function sendStatic(req, res, file, stats) {
    const staticHeaders = getStaticHeaders(stats);
    if (req.headers["if-none-match"] === staticHeaders["ETag"]) {
      res.writeHead(304);
      return res.end();
    }
    let code = 200;
    const headers = getMergeHeaders(staticHeaders, res);
    const opts = {};
    if (import_node_path.default.extname(file) === ".mjs" && headers["Content-Type"] !== "text/javascript") {
      headers["Content-Type"] = "text/javascript";
    }
    if (req.headers.range) {
      code = 206;
      const [x, y] = req.headers.range.replace("bytes=", "").split("-");
      let end = (y ? parseInt(y, 10) : 0) || stats.size - 1;
      const start = (x ? parseInt(x, 10) : 0) || 0;
      opts.end = end;
      opts.start = start;
      if (end >= stats.size) {
        end = stats.size - 1;
      }
      if (start >= stats.size) {
        res.setHeader("Content-Range", `bytes */${stats.size}`);
        res.statusCode = 416;
        return res.end();
      }
      headers["Content-Range"] = `bytes ${start}-${end}/${stats.size}`;
      headers["Content-Length"] = end - start + 1;
      headers["Accept-Ranges"] = "bytes";
    }
    res.writeHead(code, headers);
    fse.createReadStream(file, opts).pipe(res);
  }
}
function getMergeHeaders(headers, res) {
  headers = __spreadValues({}, headers);
  for (const key in headers) {
    const tmp = res.getHeader(key);
    if (tmp) headers[key] = tmp;
  }
  const contentTypeHeader = res.getHeader("content-type");
  if (contentTypeHeader) headers["Content-Type"] = contentTypeHeader;
  return headers;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  foundryvtt,
  provide
});
