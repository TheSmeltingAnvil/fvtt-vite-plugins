"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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
  copyStaticFiles: () => copyStaticFiles
});
module.exports = __toCommonJS(index_exports);

// src/_utils.ts
var glob = __toESM(require("fast-glob"));
var fs = __toESM(require("fs-extra"));
var import_minimatch = require("minimatch");
var import_node_crypto = __toESM(require("crypto"));
var import_node_path = __toESM(require("path"));
var colors = __toESM(require("picocolors"));
async function collectFiles(cwd, dest, options, logger) {
  var _a, _b, _c;
  const globalGlobOptions = {
    cwd,
    dot: false,
    onlyFiles: true,
    unique: true,
    ignore: (() => {
      switch (options.ignore) {
        case "all":
          return ["**"];
        case false:
          return [];
        default:
          return options.ignore;
      }
    })()
  };
  logger.info(colors.green("Collecting files..."));
  const globOptions = __spreadValues({}, globalGlobOptions);
  const files = /* @__PURE__ */ new Map();
  for (const file of options.files) {
    globOptions.cwd = import_node_path.default.isAbsolute(file.root) ? (_a = file.root) != null ? _a : "" : import_node_path.default.resolve(cwd, file.root);
    if (file.ignore) (_b = globOptions.ignore) == null ? void 0 : _b.push(...Array.isArray(file.ignore) ? file.ignore : [file.ignore]);
    for (const found of glob.globSync(file.pattern, globOptions)) {
      const src = import_node_path.default.resolve(file.root, found);
      const relativeTo = import_node_path.default.resolve(cwd, file.root);
      const { base, dir } = import_node_path.default.parse(import_node_path.default.relative(relativeTo, src));
      const filename = file.rename ? await renameFile(dir, base, file.rename) : base;
      const dst = import_node_path.default.resolve(dest, file.dest, dir, filename);
      const url = ((_c = file.serve) == null ? void 0 : _c.reloadOnChange) ? import_node_path.default.posix.join(dir.replaceAll(import_node_path.default.win32.sep, import_node_path.default.posix.sep), filename) : void 0;
      files.set(src, __spreadProps(__spreadValues({}, file), {
        src,
        dst,
        url
      }));
    }
  }
  logger.info(colors.green(`${files.size} files collected.`));
  return files;
}
async function copyFiles(files, options) {
  var _a;
  for (const file of files) {
    if ((options == null ? void 0 : options.ignore) === "all") return;
    const ignore = (_a = options == null ? void 0 : options.ignore) != null ? _a : false;
    const matching = ignore && ignore.some((pattern) => (0, import_minimatch.minimatch)(file.src, pattern));
    if (matching) return;
    if (file.transform) {
      const transform = resolveTransformOption(file.transform);
      const transformedContent = await getTransformedContent(file.src, transform);
      if (transformedContent) await fs.outputFile(file.dst, transformedContent);
    } else {
      await fs.copy(file.src, file.dst, {
        overwrite: file.overwrite === true,
        errorOnExist: file.overwrite === "error"
      });
    }
  }
}
function renameFile(dir, file, rename) {
  const { name, ext } = import_node_path.default.parse(file);
  return typeof rename === "string" ? rename.startsWith("*.") ? rename.replace("*", name) : rename : rename(name, ext, dir);
}
function getTransformedContent(file, transform) {
  if (transform.encoding === "buffer") {
    const buffer = fs.readFileSync(file);
    return transform.handler(buffer, file);
  }
  const content = fs.readFileSync(file, transform.encoding);
  return transform.handler(content, file);
}
function resolveTransformOption(transform) {
  return typeof transform === "function" ? { handler: transform, encoding: "utf-8" } : transform;
}
function calculateMd5Base64(content) {
  return import_node_crypto.default.createHash("md5").update(content).digest("base64");
}

// src/build.ts
function build(options) {
  let config;
  let output = false;
  let logger;
  return {
    name: "vite:copy-static-files:build",
    apply: "build",
    buildEnd: () => {
      output = false;
    },
    configResolved: async (resolvedConfig) => {
      config = resolvedConfig;
      logger = config.logger;
    },
    [options.build.hook]: async () => {
      var _a;
      if (output) return;
      output = true;
      const collectedFiles = await collectFiles((_a = options.root) != null ? _a : config.root, config.build.outDir, options, logger);
      await copyFiles(collectedFiles.values().toArray());
    }
  };
}

// src/serve.ts
var chokidar = __toESM(require("chokidar"));
var fs2 = __toESM(require("fs-extra"));
var import_mrmime = require("mrmime");
var import_node_path2 = __toESM(require("path"));
var colors2 = __toESM(require("picocolors"));
var import_throttle_debounce = require("throttle-debounce");
function serve(options) {
  let config;
  let foundryPackageRootDir;
  let watcher;
  let ws;
  let logger;
  let collectedFiles;
  return {
    name: "vite:copy-static-files:serve",
    apply: "serve",
    closeBundle: async () => {
      await watcher.close();
    },
    configResolved: async (resolvedConfig) => {
      var _a;
      config = resolvedConfig;
      logger = config.logger;
      foundryPackageRootDir = options.root && import_node_path2.default.isAbsolute(options.root) ? options.root : import_node_path2.default.resolve(config.root, (_a = options.root) != null ? _a : "");
    },
    configureServer: async (server) => {
      async function watch2(patterns2) {
        async function collectAndCopyFiles() {
          try {
            collectedFiles = await collectFiles(foundryPackageRootDir, config.build.outDir, options, logger);
            await copyFiles(collectedFiles.values().toArray(), options);
          } catch (e) {
            logger.error(colors2.red(e));
          }
        }
        const watcher2 = chokidar.watch(patterns2, __spreadValues({
          cwd: foundryPackageRootDir,
          ignoreInitial: false
        }, options.watch.options));
        watcher2.on("add", () => (0, import_throttle_debounce.debounce)(100, async () => collectAndCopyFiles()));
        await collectAndCopyFiles();
        return watcher2;
      }
      ws = server.ws;
      const { middlewares } = server;
      const patterns = options.files.flatMap((target) => target.pattern);
      watcher = await watch2(patterns);
      return () => {
        middlewares.use(serveStaticFiles(config, options, collectedFiles));
      };
    },
    watchChange: async (filepath, change) => {
      var _a;
      function reload(filepath2, reloadEvent) {
        ws.send(reloadEvent, { path: filepath2 });
        logger.info(colors2.green("hot reload static file: ") + colors2.dim(filepath2), {
          timestamp: true
        });
      }
      filepath = import_node_path2.default.normalize(filepath.replaceAll(import_node_path2.default.win32.sep, import_node_path2.default.posix.sep));
      const file = collectedFiles.get(filepath);
      if (!file) return;
      await copyFiles([file], options);
      if (file.url && ((_a = file.serve) == null ? void 0 : _a.reloadOnChange)) {
        reload(file.url, file.serve.reloadOnChange);
      }
      if (change.event === "delete") {
        collectedFiles.delete(filepath);
      }
    }
  };
}
function serveStaticFiles(config, options, files) {
  return async (req, res, next) => {
    var _a, _b;
    const { server } = config;
    const rootDir = config.root;
    const srcDir = import_node_path2.default.resolve(rootDir, (_a = options.root) != null ? _a : "");
    try {
      let pathname = decodeURI((_b = req.originalUrl) != null ? _b : "");
      pathname = pathname.replace(config.base, "/");
      const data = getLocalFileData(srcDir, files, pathname);
      if (!data || data.stats.isDirectory()) return return404(res, next);
      setHeaders(res, pathname, server.headers);
      if (data.transform) {
        const transformOption = resolveTransformOption(data.transform);
        const transformedContent = await getTransformedContent(data.filepath, transformOption);
        if (!transformedContent) return return404(res, next);
        return sendTransform(req, res, transformOption, transformedContent);
      }
      sendStatic(req, res, data.filepath, data.stats);
    } catch (e) {
      if (e instanceof Error) return next(e);
      throw e;
    }
  };
}
function getLocalFileData(root, files, pathname) {
  if (pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }
  const file = files.get(pathname);
  if (!file) return void 0;
  const filepath = import_node_path2.default.resolve(root, file.src);
  const stats = fs2.statSync(filepath, { throwIfNoEntry: false });
  if (!stats) return void 0;
  return __spreadProps(__spreadValues({}, file), { filepath, stats });
}
function return404(res, next) {
  if (next) return next();
  res.statusCode = 404;
  res.end();
}
var knownJavascriptExtensionRE = /\.(?:[tj]sx?|[cm][tj]s)$/;
function setHeaders(res, pathname, headers) {
  if (knownJavascriptExtensionRE.test(pathname)) {
    res.setHeader("Content-Type", "text/javascript");
  } else {
    let ctype = (0, import_mrmime.lookup)(pathname) || "";
    if (ctype === "text/html") ctype += ";charset=utf-8";
    res.setHeader("Content-Type", ctype);
  }
  if (headers) {
    for (const name in headers) res.setHeader(name, headers[name]);
  }
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
  fs2.createReadStream(file, opts).pipe(res);
}
function sendTransform(req, res, transform, content) {
  const transformHeaders = getTransformHeaders(
    // @ts-expect-error xyz
    transform.encoding,
    content
  );
  if (req.headers["if-none-match"] === transformHeaders["ETag"]) {
    res.writeHead(304);
    return res.end();
  }
  const code = 200;
  const headers = getMergeHeaders(transformHeaders, res);
  res.writeHead(code, headers);
  res.end(content);
}
function getStaticHeaders(stats) {
  return {
    "Content-Length": stats.size,
    "Last-Modified": stats.mtime.toUTCString(),
    ETag: `W/"${stats.size}-${stats.mtime.getTime()}"`,
    "Cache-Control": "no-cache"
  };
}
function getTransformHeaders(encoding, content) {
  return {
    "Content-Length": Buffer.byteLength(content, encoding === "buffer" ? void 0 : encoding),
    ETag: `W/"${calculateMd5Base64(content)}"`,
    "Cache-Control": "no-cache"
  };
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

// src/copyStaticFiles.ts
function copyStaticFiles(options) {
  const resolvedOptions = resolveOptions(options);
  return [serve(resolvedOptions), build(resolvedOptions)];
  function resolveOptions(options2) {
    var _a, _b, _c, _d, _e, _f;
    function resolveFiles(files) {
      return files.map((file) => {
        var _a2, _b2, _c2, _d2, _e2;
        return typeof file === "string" ? {
          dest: "",
          ignore: false,
          overwrite: true,
          pattern: file,
          root: (_a2 = resolvedOptions.root) != null ? _a2 : ""
        } : __spreadProps(__spreadValues({}, file), {
          dest: (_b2 = file.dest) != null ? _b2 : "",
          ignore: (_c2 = file.ignore) != null ? _c2 : false,
          overwrite: (_d2 = file.overwrite) != null ? _d2 : true,
          root: (_e2 = file.root) != null ? _e2 : ""
        });
      });
    }
    const build2 = ((_a = options2.build) == null ? void 0 : _a.hook) ? options2.build : { hook: "writeBundle" };
    build2.hook = build2.hook ? build2.hook : "writeBundle";
    const resolved = {
      build: build2,
      files: options2.ignore === "all" ? [] : resolveFiles(options2.files),
      ignore: (_b = options2.ignore) != null ? _b : false,
      root: options2.root,
      watch: {
        options: (_d = (_c = options2.watch) == null ? void 0 : _c.options) != null ? _d : {},
        reloadPageOnChange: (_f = (_e = options2.watch) == null ? void 0 : _e.reloadPageOnChange) != null ? _f : false
      }
    };
    if (typeof options2.ignore === "string" && options2.ignore === "all") resolved.watch.options.ignored = ["**/*"];
    else if (typeof options2.ignore === "object") resolved.watch.options.ignored = options2.ignore;
    return resolved;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  copyStaticFiles
});
