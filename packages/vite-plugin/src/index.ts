import { copyStaticFiles, CopyStaticFilesOptions } from "@foundryvtt/vite-plugin-copy-static-files"
import { createFile } from "@foundryvtt/vite-plugin-create-file"
import { importJson, importYaml } from "@foundryvtt/vite-plugin-import-files"
import { replaceVars } from "@foundryvtt/vite-plugin-replace-vars"
import * as fse from "fs-extra"
import * as YAML from "js-yaml"
import { OutgoingHttpHeaders, ServerResponse } from "node:http"
import path from "node:path"
import * as Vite from "vite"

export interface FoundryVttOptions {
  copyStaticFiles: boolean | Partial<CopyStaticFilesOptions> | undefined
  serve?: {
    link?: boolean
  }
}

let mappings: Record<string, string>

export async function foundryvtt(options?: FoundryVttOptions): Promise<Vite.Plugin[]> {
  const packageJson = await readFromPackageJson(".")
  mappings = packageJson.foundry
  const message = "This file is for a running vite dev server and is not copied to a build"
  return [
    // Create required files.
    createFile({
      name: "index.html",
      contents: `<h1>${message}</h1>\n`,
    }),
    createFile({
      name: "index.mjs",
      contents: `/* ${message} */\nimport './src/index.ts';\n`,
    }),
    createFile({
      name: "styles.css",
      contents: `/* ${message} */\n`,
    }),
    // Copy static files with reload if change.
    ...copyStaticFiles(resolveCopyStaticFilesOptions(options?.copyStaticFiles)),
    // Allow importing JSON and YAML files in code.
    importJson(),
    importYaml(),
    // Replace variables in files.
    replaceVars({ mappings }),
    // Provide `dist` files.
    provide(),
  ]

  async function readFromPackageJson(parent?: string) {
    const filePath = path.join(parent ?? ".", "package.json")
    const packageJson = await fse.readFile(filePath, "utf-8")
    return JSON.parse(packageJson)
  }

  function resolveCopyStaticFilesOptions(options?: boolean | Partial<CopyStaticFilesOptions>): CopyStaticFilesOptions {
    const defaultOptions: CopyStaticFilesOptions = {
      files: [
        {
          pattern: "**/*.hbs",
          root: "src",
          serve: { reloadOnChange: "reload:template" },
        },
        {
          pattern: "**/*.json",
          root: ".",
          ignore: ["package.json", "tsconfig.json", "tsconfig.*.json", "src/**"],
          transform: replaceFileVars,
        },
        {
          pattern: "**/*.json",
          root: "src",
          transform: replaceFileVars,
        },
        {
          pattern: ["**/*.yml", "**/*.yaml"],
          root: ".",
          ignore: ["foundryconfig.*.yml", "foundryconfig.*.yaml", "src/**", "packs/**"],
          rename: "*.json",
          transform: replaceFileVars,
        },
        {
          pattern: ["**/*.yml", "**/*.yaml"],
          root: "src",
          rename: "*.json",
          transform: replaceFileVars,
        },
      ],
      ignore: ["node_modules/**", "packs/**", "public/**", "static/**", "dist/**"],
    }

    if (options === undefined || options === true) return defaultOptions

    if (options === false) {
      return {
        ignore: "all",
        files: [],
      }
    }

    return {
      ...defaultOptions,
      ...options,
    }
  }

  function replaceFileVars(content: string, filename: string) {
    for (const k in mappings) {
      const re = new RegExp(`{{${k}}}`, "g")
      const value = mappings[k]
      if (value) {
        content = content.replaceAll(re, value)
      }
    }
    const data = YAML.load(content, { filename, json: true })
    return JSON.stringify(data, null, 2)
  }
}

export function provide(): Vite.Plugin {
  let config: Vite.ResolvedConfig
  return {
    name: "vite:provide-src",
    apply: "serve",
    configResolved: async (configResolved: Vite.ResolvedConfig) => {
      config = configResolved
    },
    configureServer: async (server: Vite.ViteDevServer) => {
      const { middlewares } = server
      return () => {
        middlewares.use(provideDist(config))
        //middlewares.use(provideSources(config))
      }
    },
  }

  function provideDist(config: Vite.ResolvedConfig): Vite.Connect.NextHandleFunction {
    return async (req: Vite.Connect.IncomingMessage, res: ServerResponse, next: Vite.Connect.NextFunction) => {
      try {
        let pathname = decodeURI(req.originalUrl ?? "")
        pathname = `${config.build.outDir}/${pathname.replace(config.base, "")}`

        if (!(await fse.exists(pathname))) return next()

        const file = await fse.stat(pathname)
        sendStatic(req, res, pathname, file)
      } catch (e) {
        if (e instanceof Error) return next(e)
        throw e
      }
    }
  }

  ////function provideSources(config: Vite.ResolvedConfig): Vite.Connect.NextHandleFunction {
  ////  return async (req: Vite.Connect.IncomingMessage, res: ServerResponse, next: Vite.Connect.NextFunction) => {
  ////    try {
  ////      let pathname = decodeURI(req.originalUrl ?? "")
  ////      pathname = `${config.root}/${pathname.replace(config.base, "")}`

  ////      if (!(await fse.exists(pathname))) return next()

  ////      const file = await fse.stat(pathname)
  ////      sendStatic(req, res, pathname, file)
  ////    } catch (e) {
  ////      if (e instanceof Error) return next(e)

  ////      throw e
  ////    }
  ////  }
  ////}

  function getStaticHeaders(stats: fse.Stats): OutgoingHttpHeaders {
    return {
      "Content-Length": stats.size,
      "Last-Modified": stats.mtime.toUTCString(),
      ETag: `W/"${stats.size}-${stats.mtime.getTime()}"`,
      "Cache-Control": "no-cache",
    }
  }

  function sendStatic(req: Vite.Connect.IncomingMessage, res: ServerResponse, file: string, stats: fse.Stats) {
    const staticHeaders = getStaticHeaders(stats)
    if (req.headers["if-none-match"] === staticHeaders["ETag"]) {
      res.writeHead(304)
      return res.end()
    }

    let code = 200
    const headers = getMergeHeaders(staticHeaders, res)
    const opts: { start?: number; end?: number } = {}

    if (path.extname(file) === ".mjs" && headers["Content-Type"] !== "text/javascript") {
      headers["Content-Type"] = "text/javascript"
    }

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
    fse.createReadStream(file, opts).pipe(res)
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
