import * as Vite from "vite"
import { ResolvedCopyStaticFilesOptions, ResolvedFile } from "./_types"
import { build } from "./build"
import { serve } from "./serve"
import { CopyStaticFilesOptions, FileOptions } from "./types"

export function copyStaticFiles(options: CopyStaticFilesOptions): Vite.Plugin[] {
  const resolvedOptions = resolveOptions(options)
  return [serve(resolvedOptions), build(resolvedOptions)]

  function resolveOptions(options: CopyStaticFilesOptions): ResolvedCopyStaticFilesOptions {
    function resolveFiles(files: (string | FileOptions)[]): ResolvedFile[] {
      return files.map((file) => {
        return typeof file === "string"
          ? {
              dest: "",
              ignore: false,
              overwrite: true,
              pattern: file,
              root: resolvedOptions.root ?? "",
            }
          : {
              ...file,
              dest: file.dest ?? "",
              ignore: file.ignore ?? false,
              overwrite: file.overwrite ?? true,
              root: file.root ?? "",
            }
      })
    }

    const build = options.build?.hook
      ? (options.build as ResolvedCopyStaticFilesOptions["build"])
      : { hook: "writeBundle" }
    build.hook = build.hook ? build.hook : "writeBundle"
    const resolved: ResolvedCopyStaticFilesOptions = {
      build,
      files: options.ignore === "all" ? [] : resolveFiles(options.files),
      ignore: options.ignore ?? false,
      root: options.root,
      watch: {
        options: options.watch?.options ?? {},
        reloadPageOnChange: options.watch?.reloadPageOnChange ?? false,
      },
    }
    if (typeof options.ignore === "string" && options.ignore === "all") resolved.watch.options.ignored = ["**/*"]
    else if (typeof options.ignore === "object") resolved.watch.options.ignored = options.ignore
    return resolved
  }
}
