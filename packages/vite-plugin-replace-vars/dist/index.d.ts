import * as Vite from "vite"

interface ReplaceVarsOptions {
  mappings: Record<string, string>
}
declare function replaceVars(options: ReplaceVarsOptions): Vite.Plugin

export { type ReplaceVarsOptions, replaceVars }
