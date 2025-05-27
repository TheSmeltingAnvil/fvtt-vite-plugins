import * as chokidar from "chokidar"
import * as fs from "fs-extra"
import { ServerResponse } from "http"
import { lookup } from "mrmime"
import { OutgoingHttpHeaders } from "node:http2"
import path from "node:path"
import * as colors from "picocolors"
import { debounce } from "throttle-debounce"
import * as Vite from "vite"
import { FileMap, FileValue, ResolvedCopyStaticFilesOptions } from "./_types"
import * as utils from "./_utils"
import { TransformOptionObject } from "./types"

export function serve(options: ResolvedCopyStaticFilesOptions): Vite.Plugin {
  let config: Vite.ResolvedConfig
  let srcDir: string
  let watcher: chokidar.FSWatcher
  let ws: Vite.WebSocketServer
  let logger: Vite.Logger
  const files: FileMap = new Map()

  return {
    name: "vite:copy-static-files:serve",
    apply: "serve",
    closeBundle: async () => {
      await watcher.close()
    },
    configResolved: async (configResolved: Vite.ResolvedConfig) => {
      config = configResolved
      logger = config.logger
      srcDir =
        options.root && path.isAbsolute(options.root) ? options.root : path.resolve(config.root, options.root ?? "")
    },
    configureServer: async (server: Vite.ViteDevServer) => {
      ws = server.ws
      const { middlewares } = server

      const paths: string[] = options.files.flatMap((target) => (typeof target === "string" ? target : target.src))
      watcher = watchFilesForCollection(srcDir, paths, config, options, files, logger)

      return () => {
        middlewares.use(serveStaticFiles(config, options, files))
      }
    },
    watchChange: async (filepath: string, change: { event: Vite.Rollup.ChangeEvent }) => {
      function reload(filepath: string, reloadEvent: string) {
        ws.send(reloadEvent, { path: filepath })
        logger.info(colors.green("hot reload static file: ") + colors.dim(filepath), {
          timestamp: true,
        })
      }

      const key = path.posix.join("/", path.relative(srcDir, filepath).replaceAll(path.sep, path.posix.sep))
      let file = files.get(key)
      if (!file) {
        file = files.values().find((file) => file.src === key.substring(1))
        if (!file) return
      }

      utils.copyFiles(srcDir, config.build.outDir, [file], options)
      if (file.serve?.reloadOnChange) {
        reload(key, file.serve?.reloadOnChange)
      }

      if (change.event === "delete") {
        files.delete(key)
      }
    },
  }
}

function watchFilesForCollection(
  rootpath: string,
  paths: string[],
  config: Vite.ResolvedConfig,
  options: ResolvedCopyStaticFilesOptions,
  files: FileMap,
  logger: Vite.Logger,
): chokidar.FSWatcher {
  async function collectAndCopyFiles() {
    try {
      const rootDir = config.root
      const srcDir = path.resolve(rootDir, options.root ?? "")

      logger.info(colors.green("Collecting files..."))
      const collectedFiles = utils.collectFiles(srcDir, options)
      logger.info(colors.green(`${collectedFiles.length} files collected.`))

      await utils.copyFiles(srcDir, config.build.outDir, collectedFiles, options)

      collectedFiles.forEach(async (file) => {
        const { base, dir } = path.parse(file.src)
        const name = file.rename ? await utils.renameFile(dir, base, file.rename) : base
        const pathname = path.posix.join("/", dir, name)
        if (!files.has(pathname)) files.set(pathname, file)
      })
    } catch (e) {
      logger.error(colors.red(e as string))
    }
  }

  const watcher = chokidar.watch(paths, {
    cwd: rootpath,
    ignoreInitial: false,
    ...options.watch.options,
  })
  watcher.on("add", () => {
    debounce(100, async () => collectAndCopyFiles())
  })
  collectAndCopyFiles()
  return watcher
}

function serveStaticFiles(
  config: Vite.ResolvedConfig,
  options: ResolvedCopyStaticFilesOptions,
  files: FileMap,
): Vite.Connect.NextHandleFunction {
  return async (req: Vite.Connect.IncomingMessage, res: ServerResponse, next: Vite.Connect.NextFunction) => {
    const { server } = config
    const rootDir = config.root
    const srcDir = path.resolve(rootDir, options.root ?? "")
    try {
      let pathname = decodeURI(req.originalUrl ?? "")
      pathname = pathname.replace(config.base, "/")
      const data = getLocalFileData(srcDir, files, pathname)
      if (!data || data.stats.isDirectory()) return return404(res, next)

      setHeaders(res, pathname, server.headers)

      if (data.transform) {
        const transformOption = utils.resolveTransformOption(data.transform)
        const transformedContent = await utils.getTransformedContent(data.filepath, transformOption)
        if (!transformedContent) return return404(res, next)

        return sendTransform(req, res, transformOption, transformedContent)
      }

      sendStatic(req, res, data.filepath, data.stats)
    } catch (e) {
      if (e instanceof Error) return next(e)

      throw e
    }
  }
}

function getLocalFileData(
  root: string,
  files: FileMap,
  pathname: string,
): (FileValue & { filepath: string; stats: fs.Stats }) | undefined {
  if (pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1)
  }
  const file = files.get(pathname)
  if (!file) return undefined

  const filepath = path.resolve(root, file.src)
  const stats = fs.statSync(filepath, { throwIfNoEntry: false })
  if (!stats) return undefined

  return { ...file, filepath, stats }
}

function return404(res: ServerResponse, next: Vite.Connect.NextFunction) {
  if (next) return next()

  res.statusCode = 404
  res.end()
}

const knownJavascriptExtensionRE = /\.(?:[tj]sx?|[cm][tj]s)$/
function setHeaders(res: ServerResponse, pathname: string, headers: OutgoingHttpHeaders | undefined) {
  // Matches js, jsx, ts, tsx, mts, mjs, cjs, cts, ctx, mtx
  // The reason this is done, is that the .ts and .mts file extensions are
  // reserved for the MIME type video/mp2t. In almost all cases, we can expect
  // these files to be TypeScript files, and for Vite to serve them with
  // this Content-Type.
  if (knownJavascriptExtensionRE.test(pathname)) {
    res.setHeader("Content-Type", "text/javascript")
  } else {
    let ctype = lookup(pathname) || ""
    if (ctype === "text/html") ctype += ";charset=utf-8"
    res.setHeader("Content-Type", ctype)
  }

  if (headers) {
    for (const name in headers) res.setHeader(name, headers[name]!)
  }
}

function sendStatic(req: Vite.Connect.IncomingMessage, res: ServerResponse, file: string, stats: fs.Stats) {
  const staticHeaders = getStaticHeaders(stats)
  if (req.headers["if-none-match"] === staticHeaders["ETag"]) {
    res.writeHead(304)
    return res.end()
  }

  let code = 200
  const headers = getMergeHeaders(staticHeaders, res)
  const opts: { start?: number; end?: number } = {}

  if (req.headers.range) {
    code = 206
    const [x, y] = req.headers.range.replace("bytes=", "").split("-")
    let end = (y ? parseInt(y, 10) : 0) || stats.size - 1
    const start = (x ? parseInt(x, 10) : 0) || 0
    opts.end = end
    opts.start = start

    if (end >= stats.size) {
      end = stats.size - 1
    }

    if (start >= stats.size) {
      res.setHeader("Content-Range", `bytes */${stats.size}`)
      res.statusCode = 416
      return res.end()
    }

    headers["Content-Range"] = `bytes ${start}-${end}/${stats.size}`
    headers["Content-Length"] = end - start + 1
    headers["Accept-Ranges"] = "bytes"
  }

  res.writeHead(code, headers)
  fs.createReadStream(file, opts).pipe(res)
}

function sendTransform(
  req: Vite.Connect.IncomingMessage,
  res: ServerResponse,
  transform: TransformOptionObject,
  content: string | Buffer,
) {
  const transformHeaders = getTransformHeaders(
    // @ts-expect-error xyz
    transform.encoding,
    content,
  )

  if (req.headers["if-none-match"] === transformHeaders["ETag"]) {
    res.writeHead(304)
    return res.end()
  }

  const code = 200
  const headers = getMergeHeaders(transformHeaders, res)

  res.writeHead(code, headers)
  res.end(content)
}

function getStaticHeaders(stats: fs.Stats): OutgoingHttpHeaders {
  return {
    "Content-Length": stats.size,
    "Last-Modified": stats.mtime.toUTCString(),
    ETag: `W/"${stats.size}-${stats.mtime.getTime()}"`,
    "Cache-Control": "no-cache",
  }
}

function getTransformHeaders(encoding: BufferEncoding | "buffer", content: string | Buffer): OutgoingHttpHeaders {
  return {
    "Content-Length": Buffer.byteLength(content, encoding === "buffer" ? undefined : encoding),
    ETag: `W/"${utils.calculateMd5Base64(content)}"`,
    "Cache-Control": "no-cache",
  }
}

function getMergeHeaders(headers: OutgoingHttpHeaders, res: ServerResponse) {
  headers = { ...headers }
  for (const key in headers) {
    const tmp = res.getHeader(key)
    if (tmp) headers[key] = tmp
  }

  const contentTypeHeader = res.getHeader("content-type")
  if (contentTypeHeader) headers["Content-Type"] = contentTypeHeader

  return headers
}
