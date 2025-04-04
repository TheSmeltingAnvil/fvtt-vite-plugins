import * as Vite from "vite"
import fs from "fs-extra"
import path from "path"

export interface CreateFileOptions {
  name: string
  contents: string
}

export function createFile(options: CreateFileOptions): Vite.Plugin {
  let config: Vite.ResolvedConfig
  return {
    name: "vite:create-file:serve",
    apply: "serve",
    buildStart: async () => {
      const { outDir } = config.build
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)
      fs.writeFileSync(path.resolve(outDir, options.name), options.contents)
    },
    buildEnd: async () => {
      const { outDir } = config.build
      fs.removeSync(path.resolve(outDir, options.name))
    },
    configResolved(_config: Vite.ResolvedConfig) {
      config = _config
    },
  }
}
