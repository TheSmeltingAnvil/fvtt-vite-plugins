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
function collectFiles(srcDir, options) {
  var _a, _b, _c, _d, _e;
  const globalGlobOptions = {
    cwd: srcDir,
    dot: false,
    onlyFiles: true,
    unique: true
  };
  const files = [];
  for (const file of options.files) {
    if (typeof file === "string") {
      for (const found of glob.globSync(file, globalGlobOptions))
        files.push({ src: found, dst: import_node_path.default.dirname(found), overwrite: true });
    } else {
      const of = file;
      const globOptions = __spreadValues({}, globalGlobOptions);
      if (of.root) globOptions.cwd = import_node_path.default.isAbsolute(of.root) ? of.root : import_node_path.default.resolve(srcDir, of.root);
      if (of.ignored) globOptions.ignore = Array.isArray(of.ignored) ? of.ignored : [of.ignored];
      (_b = globOptions.ignore) == null ? void 0 : _b.push(...(_a = options.ignored) != null ? _a : []);
      for (const found of glob.globSync(of.src, globOptions))
        files.push(__spreadProps(__spreadValues({}, of), {
          src: import_node_path.default.resolve((_c = of.root) != null ? _c : "", found),
          dst: import_node_path.default.join((_d = of.dst) != null ? _d : "", import_node_path.default.dirname(found)),
          overwrite: (_e = of.overwrite) != null ? _e : true
        }));
    }
  }
  return files;
}
async function copyFiles(srcDir, dstDir, files, options = {}) {
  const resolvedFiles = files.map(async (file) => {
    const resolvedSrc = import_node_path.default.resolve(srcDir, file.root, file.src);
    const { base, dir } = import_node_path.default.parse(resolvedSrc);
    let resolvedDst = import_node_path.default.resolve(dstDir, file.dst);
    const newName = file.rename ? await renameFile(dir, base, file.rename) : base;
    resolvedDst = import_node_path.default.join(resolvedDst, newName);
    return __spreadProps(__spreadValues({}, file), {
      resolvedSrc,
      resolvedDst
    });
  });
  resolvedFiles.forEach(async (promise) => {
    var _a;
    if (options.ignored === "all") return;
    const ignored = (_a = options.ignored) != null ? _a : [];
    const file = await promise;
    const matching = ignored.some((pattern) => {
      return (0, import_minimatch.minimatch)(file.src, pattern);
    });
    if (matching) return;
    if (file.transform) {
      const transform = resolveTransformOption(file.transform);
      const transformedContent = await getTransformedContent(file.resolvedSrc, transform);
      if (transformedContent) await fs.outputFile(file.resolvedDst, transformedContent);
    } else {
      await fs.copy(file.resolvedSrc, file.resolvedDst, {
        overwrite: file.overwrite === true,
        errorOnExist: file.overwrite === "error"
      });
    }
  });
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
  return {
    name: "vite:copy-static-files:build",
    apply: "build",
    buildEnd: () => {
      output = false;
    },
    configResolved: async (configResolved) => {
      config = configResolved;
    },
    [options.build.hook]: async () => {
      var _a, _b;
      if (output) return;
      output = true;
      const files = collectFiles((_a = options.root) != null ? _a : config.root, options);
      await copyFiles((_b = options.root) != null ? _b : config.root, config.build.outDir, files);
    }
  };
}

// src/serve.ts
var chokidar = __toESM(require("chokidar"));
var fs2 = __toESM(require("fs-extra"));
var import_mrmime = require("mrmime");
var import_node_path2 = __toESM(require("path"));
var colors = __toESM(require("picocolors"));
var import_throttle_debounce = require("throttle-debounce");
function serve(options) {
  let config;
  let srcDir;
  let watcher;
  let ws;
  let logger;
  const files = /* @__PURE__ */ new Map();
  return {
    name: "vite:copy-static-files:serve",
    apply: "serve",
    closeBundle: async () => {
      await watcher.close();
    },
    configResolved: async (configResolved) => {
      var _a;
      config = configResolved;
      logger = config.logger;
      srcDir = options.root && import_node_path2.default.isAbsolute(options.root) ? options.root : import_node_path2.default.resolve(config.root, (_a = options.root) != null ? _a : "");
    },
    configureServer: async (server) => {
      ws = server.ws;
      const { middlewares } = server;
      const paths = options.files.flatMap((target) => typeof target === "string" ? target : target.src);
      watcher = watchFilesForCollection(srcDir, paths, config, options, files, logger);
      return () => {
        middlewares.use(serveStaticFiles(config, options, files));
      };
    },
    watchChange: async (filepath, change) => {
      var _a, _b;
      function reload(filepath2, reloadEvent) {
        ws.send(reloadEvent, { path: filepath2 });
        logger.info(colors.green("hot reload static file: ") + colors.dim(filepath2), {
          timestamp: true
        });
      }
      const key = import_node_path2.default.posix.join("/", import_node_path2.default.relative(srcDir, filepath).replaceAll(import_node_path2.default.sep, import_node_path2.default.posix.sep));
      let file = files.get(key);
      if (!file) {
        file = files.values().find((file2) => file2.src === key.substring(1));
        if (!file) return;
      }
      copyFiles(srcDir, config.build.outDir, [file], options);
      if ((_a = file.serve) == null ? void 0 : _a.reloadOnChange) {
        reload(key, (_b = file.serve) == null ? void 0 : _b.reloadOnChange);
      }
      if (change.event === "delete") {
        files.delete(key);
      }
    }
  };
}
function watchFilesForCollection(rootpath, paths, config, options, files, logger) {
  async function collectAndCopyFiles() {
    var _a;
    try {
      const rootDir = config.root;
      const srcDir = import_node_path2.default.resolve(rootDir, (_a = options.root) != null ? _a : "");
      logger.info(colors.green("Collecting files..."));
      const collectedFiles = collectFiles(srcDir, options);
      logger.info(colors.green(`${collectedFiles.length} files collected.`));
      await copyFiles(srcDir, config.build.outDir, collectedFiles, options);
      collectedFiles.forEach(async (file) => {
        const { base, dir } = import_node_path2.default.parse(file.src);
        const name = file.rename ? await renameFile(dir, base, file.rename) : base;
        const pathname = import_node_path2.default.posix.join("/", dir, name);
        if (!files.has(pathname)) files.set(pathname, file);
      });
    } catch (e) {
      logger.error(colors.red(e));
    }
  }
  const watcher = chokidar.watch(paths, __spreadValues({
    cwd: rootpath,
    ignoreInitial: false
  }, options.watch.options));
  watcher.on("add", () => {
    (0, import_throttle_debounce.debounce)(100, async () => collectAndCopyFiles());
  });
  collectAndCopyFiles();
  return watcher;
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
    const build2 = (_a = options2.build) != null ? _a : {};
    build2.hook = (_b = build2.hook) != null ? _b : "writeBundle";
    const resolved = {
      build: build2,
      files: options2.ignored === "all" ? [] : options2.files,
      ignored: options2.ignored,
      root: options2.root,
      watch: {
        options: (_d = (_c = options2.watch) == null ? void 0 : _c.options) != null ? _d : {},
        reloadPageOnChange: (_f = (_e = options2.watch) == null ? void 0 : _e.reloadPageOnChange) != null ? _f : false
      }
    };
    if (typeof options2.ignored === "string" && options2.ignored === "all") resolved.watch.options.ignored = ["**/*"];
    else if (typeof options2.ignored === "object") resolved.watch.options.ignored = options2.ignored;
    return resolved;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  copyStaticFiles
});
