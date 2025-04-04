import { Options } from "tsup"

export default {
  splitting: false,
  clean: true,
  entryPoints: ["src/index.ts"],
  format: ["cjs"],
  dts: true,
} as Options
