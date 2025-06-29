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
interface FileOptions {
    dest?: string;
    ignore?: false | string | string[];
    overwrite?: boolean | "error";
    pattern: string | string[];
    rename?: string | RenameFunc;
    root?: string;
    transform?: TransformOption;
    serve?: {
        reloadOnChange?: string;
    };
}
interface CopyStaticFilesOptions {
    build?: {
        hook?: string;
    };
    files: (string | FileOptions)[];
    ignore?: false | string[] | "all";
    root?: string;
    watch?: {
        options?: ChokidarOptions;
        reloadPageOnChange?: boolean;
    };
}

declare function copyStaticFiles(options: CopyStaticFilesOptions): Vite.Plugin[];

export { type CopyStaticFilesOptions, type FileOptions, type RenameFunc, type TransformFunc, type TransformOption, type TransformOptionObject, copyStaticFiles };
