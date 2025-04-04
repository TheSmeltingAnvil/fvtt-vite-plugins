import * as Vite from "vite"
import fs from "fs-extra"
import toSource from "tosource"
import * as YAML from "js-yaml"

const yamlExtensions = [/\.yml$/, /\.yaml$/]

export function importYaml(): Vite.Plugin {
  return {
    name: "vite:import-files:yaml",
    transform: async (code: string, id: string) => {
      const doProcessFile = yamlExtensions.some((pattern) => pattern.test(id))
      if (!doProcessFile) return null

      const yaml = fs.readFileSync(id, "utf-8")
      const data = YAML.load(yaml, { filename: id, json: true })
      const source = toSource(data)
      return {
        code: `const data = ${source};\nexport default data;`,
        map: { mappings: "" },
      }
    },
  }
}
