import { CopyStaticFilesOptions } from '@foundryvtt/vite-plugin-copy-static-files';
import * as Vite from 'vite';

interface FoundryVttOptions {
    copyStaticFiles: boolean | Partial<CopyStaticFilesOptions> | undefined;
    serve?: {
        link?: boolean;
    };
}
declare function foundryvtt(options?: FoundryVttOptions): Promise<Vite.Plugin[]>;
declare function provide(): Vite.Plugin;

export { type FoundryVttOptions, foundryvtt, provide };
