import * as glob from "fast-glob"
import * as fs from "fs-extra"
import { minimatch } from "minimatch"
import crypto from "node:crypto"
import path from "node:path"
import { ResolvedCopyStaticFilesOptions } from "./_types"
import { File as OriginalFile, RenameFunc, TransformOption, TransformOptionObject } from "./types"

interface File {
  src: string
  dst: string
  overwrite: boolean | "error"
  rename?: string | RenameFunc
  transform?: TransformOption
  serve?: {
    reloadOnChange?: string
  }
}

export function collectFiles(srcDir: string, options: ResolvedCopyStaticFilesOptions): File[] {
  const globOptions = {
    cwd: srcDir,
    dot: true,
    onlyFiles: true,
    unique: true,
  }
  const files: File[] = []
  for (const file of options.files) {
    if (typeof file === "string") {
      for (const found of glob.globSync(file, globOptions))
        files.push({ src: found, dst: path.dirname(found), overwrite: true })
    } else {
      const of = file as OriginalFile
      for (const found of glob.globSync(of.src, globOptions))
        files.push({
          ...of,
          src: found,
          dst: path.join(of.dst ?? "", path.dirname(found)),
          overwrite: of.overwrite ?? true,
        })
    }
  }
  return files
}

export interface ResolvedFile extends File {
  resolvedSrc: string
  resolvedDst: string
}

export async function copyFiles(
  srcDir: string,
  dstDir: string,
  files: File[],
  options: Partial<ResolvedCopyStaticFilesOptions> = {},
) {
  const resolvedFiles: Promise<ResolvedFile>[] = files.map(async (file: File) => {
    const resolvedSrc = path.resolve(srcDir, file.src)
    const { base, dir } = path.parse(resolvedSrc)
    let resolvedDst = path.resolve(dstDir, file.dst)
    const newName = file.rename ? await renameFile(dir, base, file.rename) : base
    resolvedDst = path.join(resolvedDst, newName)
    return {
      ...file,
      resolvedSrc,
      resolvedDst,
    }
  })
  resolvedFiles.forEach(async (promise) => {
    if (options.ignored === "all") return
    const ignored = options.ignored ?? []
    const file = await promise
    const matching = ignored.some((pattern) => {
      return minimatch(file.src, pattern)
    })
    if (matching) return
    if (file.transform) {
      const transform = resolveTransformOption(file.transform)
      const transformedContent = await getTransformedContent(file.resolvedSrc, transform)
      if (transformedContent) await fs.outputFile(file.resolvedDst, transformedContent)
    } else {
      await fs.copy(file.resolvedSrc, file.resolvedDst, {
        overwrite: file.overwrite === true,
        errorOnExist: file.overwrite === "error",
      })
    }
  })
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
