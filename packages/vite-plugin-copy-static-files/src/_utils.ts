import * as glob from "fast-glob"
import * as fs from "fs-extra"
import { minimatch } from "minimatch"
import crypto from "node:crypto"
import path from "node:path"
import { CollectedFile, ResolvedCopyStaticFilesOptions } from "./_types"
import { RenameFunc, TransformOption, TransformOptionObject } from "./types"
import * as Vite from "vite"
import * as colors from "picocolors"

export async function collectFiles(
  cwd: string,
  dest: string,
  options: ResolvedCopyStaticFilesOptions,
  logger: Vite.Logger,
): Promise<Map<string, CollectedFile>> {
  const globalGlobOptions: glob.Options = {
    cwd: cwd,
    dot: false,
    onlyFiles: true,
    unique: true,
    ignore: (() => {
      switch (options.ignore) {
        case "all":
          return ["**"]
        case false:
          return []
        default:
          return options.ignore
      }
    })(),
  }
  logger.info(colors.green("Collecting files..."))
  const globOptions: glob.Options = { ...globalGlobOptions }
  const files = new Map()
  for (const file of options.files) {
    globOptions.cwd = path.isAbsolute(file.root) ? (file.root ?? "") : path.resolve(cwd, file.root)
    if (file.ignore) globOptions.ignore?.push(...(Array.isArray(file.ignore) ? file.ignore : [file.ignore]))
    for (const found of glob.globSync(file.pattern, globOptions)) {
      const src = path.resolve(file.root, found)
      const relativeTo = path.resolve(cwd, file.root)
      const { base, dir } = path.parse(path.relative(relativeTo, src))
      const filename = file.rename ? await renameFile(dir, base, file.rename) : base
      const dst = path.resolve(dest, file.dest, dir, filename)
      const url = file.serve?.reloadOnChange ? path.posix.join(dir.replaceAll(path.win32.sep, path.posix.sep), filename) : undefined
      files.set(src, {
        ...file,
        src,
        dst,
        url,
      })
    }
  }
  logger.info(colors.green(`${files.size} files collected.`))
  return files
}

export async function copyFiles(files: CollectedFile[], options?: ResolvedCopyStaticFilesOptions): Promise<void> {
  for (const file of files) {
    if (options?.ignore === "all") return
    const ignore = options?.ignore ?? false
    const matching = ignore && ignore.some((pattern: string) => minimatch(file.src, pattern))
    if (matching) return

    if (file.transform) {
      const transform = resolveTransformOption(file.transform)
      const transformedContent = await getTransformedContent(file.src, transform)
      if (transformedContent) await fs.outputFile(file.dst, transformedContent)
    } else {
      await fs.copy(file.src, file.dst, {
        overwrite: file.overwrite === true,
        errorOnExist: file.overwrite === "error",
      })
    }
  }
}

export function renameFile(dir: string, file: string, rename: string | RenameFunc) {
  const { name, ext } = path.parse(file)
  return typeof rename === "string"
    ? rename.startsWith("*.")
      ? rename.replace("*", name)
      : rename
    : rename(name, ext, dir)
}

export function getTransformedContent(
  file: string,
  transform: TransformOptionObject,
): Promise<string | Buffer> | string | Buffer {
  if (transform.encoding === "buffer") {
    const buffer: Buffer = fs.readFileSync(file)
    // @ts-expect-error xyz
    return transform.handler(buffer, file)
  }

  // @ts-expect-error xyz
  const content = fs.readFileSync(file, transform.encoding)
  // @ts-expect-error xyz
  return transform.handler(content, file)
}

export function resolveTransformOption(transform: TransformOption): TransformOptionObject {
  return typeof transform === "function" ? { handler: transform, encoding: "utf-8" } : transform
}

export function calculateMd5Base64(content: string | Buffer) {
  return crypto.createHash("md5").update(content).digest("base64")
}
