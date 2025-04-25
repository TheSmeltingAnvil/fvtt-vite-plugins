import * as Vite from 'vite';

declare function importJson(): Vite.Plugin;

declare function importYaml(): Vite.Plugin;

export { importJson, importYaml };
