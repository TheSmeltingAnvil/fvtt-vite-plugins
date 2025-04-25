import * as Vite from 'vite';
import { ChokidarOptions } from 'chokidar';

type RenameFunc = (fileName: string, fileExtension: string, fullPath: string) => Promise<string> | string;
type TransformFunc<T extends string | Buffer> = (content: T, filename: string) => Promise<T | null> | T | null;
type TransformOptionObject = {
    encoding: Omit<BufferEncoding, "binary">;
    handler: TransformFunc<string>;
} | {
    encoding: "buffer";
    handler: TransformFunc<Buffer>;
};
type TransformOption = TransformFunc<string> | TransformOptionObject;
interface File {
    src: string | string[];
    dst?: string;
    rename?: string | RenameFunc;
    transform?: TransformOption;
    overwrite?: boolean | "error";
    serve?: {
        reloadOnChange?: string;
    };
}
interface CopyStaticFilesOptions {
    build?: {
        hook?: string;
    };
    files: (string | File)[];
    ignored?: "all" | string[];
    root?: string;
    watch?: {
        options?: ChokidarOptions;
        reloadPageOnChange?: boolean;
    };
}

declare function copyStaticFiles(options: CopyStaticFilesOptions): Vite.Plugin[];

export { type CopyStaticFilesOptions, type File, type RenameFunc, type TransformFunc, type TransformOption, type TransformOptionObject, copyStaticFiles };
