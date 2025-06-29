import { ChokidarOptions } from "chokidar"
import { FileOptions } from "./types"

export interface ResolvedFile extends Omit<FileOptions, "dest" | "overwrite" | "root"> {
  dest: string
  overwrite: boolean | "error"
  root: string
}

export interface ResolvedCopyStaticFilesOptions {
  build: {
    hook: string
  }
  files: ResolvedFile[]
  ignore: false | string[] | "all"
  root?: string
  watch: {
    options: ChokidarOptions
    reloadPageOnChange?: boolean
  }
}

export interface CollectedFile extends ResolvedFile {
  src: string
  dst: string
  url?: string
}
