import * as Vite from "vite"
import { ResolvedCopyStaticFilesOptions } from "./_types"
import { collectFiles, copyFiles } from "./_utils"

export function build(options: ResolvedCopyStaticFilesOptions): Vite.Plugin {
  let config: Vite.ResolvedConfig
  let output = false

  return {
    name: "vite:copy-static-files:build",
    apply: "build",
    buildEnd: () => {
      output = false
    },
    configResolved: async (configResolved: Vite.ResolvedConfig) => {
      config = configResolved
    },
    [options.build.hook]: async () => {
      if (output) return
      output = true
      const files = collectFiles(config.root, options)
      await copyFiles(options.root ?? config.root, config.build.outDir, files)
    },
  }
}
