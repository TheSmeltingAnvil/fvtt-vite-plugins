import * as Vite from "vite"

export interface ReplaceVarsOptions {
  mappings: Record<string, string>
}

export function replaceVars(options: ReplaceVarsOptions): Vite.Plugin {
  return {
    name: "vite:replace-vars",
    apply: "serve",
    transform: async (code: string, _id: string) => {
      const doProcessCode = /\{\{[^}]+\}\}/g.test(code)
      if (!doProcessCode) return code

      for (const k in options.mappings) {
        const re = new RegExp(`{{${k}}}`, "g")
        const value = options.mappings[k]
        if (value) code = code.replaceAll(re, value)
      }

      return {
        code,
        map: { mappings: "" },
      }
    },
  }
}
