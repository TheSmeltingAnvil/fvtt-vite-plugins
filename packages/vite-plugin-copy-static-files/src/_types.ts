import { ChokidarOptions } from "chokidar"
import { File, TransformOption } from "./types"

export interface FileValue {
  src: string
  dst: string
  overwrite: boolean | "error"
  transform?: TransformOption
  serve?: {
    reloadOnChange?: string
  }
}

export type FileMap = Map<string, FileValue>

export interface ResolvedCopyStaticFilesOptions {
  build: {
    hook: string
  }
  files: (string | File)[]
  ignored?: "all" | string[]
  root?: string
  watch: {
    options?: ChokidarOptions
    reloadPageOnChange?: boolean
  }
}
