import { ChokidarOptions } from "chokidar"

export type RenameFunc = (fileName: string, fileExtension: string, fullPath: string) => Promise<string> | string

export type TransformFunc<T extends string | Buffer> = (content: T, filename: string) => Promise<T | null> | T | null

export type TransformOptionObject =
  | {
      encoding: Omit<BufferEncoding, "binary">
      handler: TransformFunc<string>
    }
  | {
      encoding: "buffer"
      handler: TransformFunc<Buffer>
    }

export type TransformOption = TransformFunc<string> | TransformOptionObject

export interface File {
  src: string | string[]
  dst?: string
  ignored?: string | string[]
  rename?: string | RenameFunc
  transform?: TransformOption
  overwrite?: boolean | "error"
  serve?: {
    reloadOnChange?: string /*| ReloadFunc*/
  }
}

export interface CopyStaticFilesOptions {
  build?: {
    hook?: string
  }
  files: (string | File)[]
  ignored?: "all" | string[]
  root?: string
  watch?: {
    options?: ChokidarOptions
    reloadPageOnChange?: boolean
  }
}
