import { CopyStaticFilesOptions } from '@foundryvtt/vite-plugin-copy-static-files';
import { ReplaceVarsOptions } from '@foundryvtt/vite-plugin-replace-vars';
import * as Vite from 'vite';

interface FoundryvttOptions {
    root?: string;
    copyStaticFiles?: boolean | Partial<CopyStaticFilesOptions>;
    replaceVars?: ReplaceVarsOptions;
    serve?: {
        link?: boolean;
    };
}
declare function foundryvtt(options?: FoundryvttOptions): Promise<Vite.Plugin[]>;
declare function provide(): Vite.Plugin;

export { type FoundryvttOptions, foundryvtt, provide };
