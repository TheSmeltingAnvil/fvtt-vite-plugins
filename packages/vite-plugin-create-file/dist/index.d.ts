import * as Vite from 'vite';

interface CreateFileOptions {
    name: string;
    contents: string;
}
declare function createFile(options: CreateFileOptions): Vite.Plugin;

export { type CreateFileOptions, createFile };
