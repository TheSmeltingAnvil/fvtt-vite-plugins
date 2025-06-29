import * as Vite from "vite"
import { ResolvedCopyStaticFilesOptions } from "./_types"
import * as utils from "./_utils"

export function build(options: ResolvedCopyStaticFilesOptions): Vite.Plugin {
  let config: Vite.ResolvedConfig
  let output = false
  let logger: Vite.Logger

  return {
    name: "vite:copy-static-files:build",
    apply: "build",
    buildEnd: () => {
      output = false
    },
    configResolved: async (resolvedConfig: Vite.ResolvedConfig) => {
      config = resolvedConfig
      logger = config.logger
    },
    [options.build.hook]: async () => {
      if (output) return
      output = true
      const collectedFiles = await utils.collectFiles(options.root ?? config.root, config.build.outDir, options, logger)
      await utils.copyFiles(collectedFiles.values().toArray())
    },
  }
}
