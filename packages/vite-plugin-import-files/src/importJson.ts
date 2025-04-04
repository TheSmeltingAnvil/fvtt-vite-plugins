import * as Vite from "vite"
import fs from "fs-extra"
import toSource from "tosource"

const jsonExtensions = [/\.json$/]

export function importJson(): Vite.Plugin {
  return {
    name: "vite:import-files:json",
    transform: async (code: string, id: string) => {
      const doProcessFile = jsonExtensions.some((pattern) => pattern.test(id))
      if (!doProcessFile) return null

      const json = fs.readFileSync(id, "utf-8")
      const data = JSON.parse(json)
      const source = toSource(data)
      return {
        code: `const data = ${source};\nexport default data;`,
        map: { mappings: "" },
      }
    },
  }
}
