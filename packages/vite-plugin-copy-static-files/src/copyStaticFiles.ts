import * as Vite from "vite"
import { ResolvedCopyStaticFilesOptions } from "./_types"
import { build } from "./build"
import { serve } from "./serve"
import { CopyStaticFilesOptions } from "./types"

export function copyStaticFiles(options: CopyStaticFilesOptions): Vite.Plugin[] {
  const resolvedOptions = resolveOptions(options)
  return [serve(resolvedOptions), build(resolvedOptions)]

  function resolveOptions(options: CopyStaticFilesOptions): ResolvedCopyStaticFilesOptions {
    const build = options.build ?? {}
    build.hook = build.hook || "writeBundle"
    const resolved = {
      build: build as { hook: string },
      files: (() => {
        switch (options.ignored) {
          case "all":
            return []
          default:
            return options.files
        }
      })(),
      ignored: options.ignored,
      root: options.root,
      watch: {
        options: options.watch?.options ?? {},
        reloadPageOnChange: options.watch?.reloadPageOnChange ?? false,
      },
    }
    if (typeof options.ignored === "string" && options.ignored === "all") resolved.watch.options.ignored = ["**/*"]
    else if (typeof options.ignored === "object") resolved.watch.options.ignored = options.ignored

    return resolved
  }
}
