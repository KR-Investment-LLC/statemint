/*
 * MIT License
 *
 * Copyright (c) 2025 KRI, LLC
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import path from "node:path";
import { pathToFileURL } from "node:url";
import fg from "fast-glob";
import { 
    AsyncEventEmitter, 
    IAsyncEventEmitter 
} from "../core/AsyncEventEmitter.js";
import { IContext } from "./Context.js";
import { 
    Deployment, 
    DEPLOYMENT_VERSION, 
    DeploymentEvents
} from "../core/Deployment.js";

/**
 * @description
 */
export interface IRuntime extends IAsyncEventEmitter {
    readonly context: IContext;

    /**
     * @description
     */
    run(): Promise<void>;
}

/**
 * @description Factory method for creating a user-defined context.
 */
export type RuntimeFactory = (context: IContext) => BaseRuntime;

export const RuntimeEvents = {
        beforeRun:             "beforeRun"             as const,
        afterRun:              "afterRun"              as const,
        runError:              "runError"              as const,
        beforeLoadDeployments: "beforeLoadDeployments" as const,
        afterLoadDeployments:  "afterLoadDeployments"  as const,
        loadDeploymentsError:  "loadDeploymentsError"  as const,
        beforeLoadDeployment:  "beforeLoadDeployment"  as const,
        afterLoadDeployment:   "afterLoadDeployment"   as const,
        loadDeploymentError:   "loadDeploymentError"   as const,
        beforeLoadState:       "beforeLoadState"       as const,
        afterLoadState:        "afterLoadState"        as const,
        loadStateError:        "loadStateError"        as const,
        beforeDefine:          "beforeDefine"          as const,
        afterDefine:           "afterDefine"           as const,
        definitionError:       "definitionError"       as const,
        beforeValidate:        "beforeValidate"        as const, 
        afterValidate:         "afterValidate"         as const,
        validationError:       "validationError"       as const,
        beforeSpecutlate:      "beforeSpecutlate"      as const,
        afterSpecutlate:       "afterSpecutlate"       as const,
        speculationError:      "speculationError"      as const,
        beforeReadState:       "beforeReadState"       as const,
        afterReadState:        "afterReadState"        as const,
        readStateError:        "readStateError"        as const,
        beforeSyncState:       "beforeSyncState"       as const,
        afterSyncState:        "afterSyncState"        as const,
        syncStateError:        "syncStateError"        as const,
        beforeDeploy:          "beforeDeploy"          as const,
        afterDeploy:           "afterDeploy"           as const,
        deploymentError:       "deploymentError"       as const,
        beforeDestroy:         "beforeDestroy"         as const,
        afterDestroy:          "afterDestroy"          as const,
        destroyError:          "destroyError"          as const
    };

/**
 * 
 * @param x 
 * @returns 
 */
function isDeployment(x: unknown): x is Deployment {
  return !!x && typeof x === "object" && (DEPLOYMENT_VERSION in (x as object));
}

/**
 * @description
 */
export class BaseRuntime extends AsyncEventEmitter implements IRuntime {
    protected _context: IContext;

    constructor(context: IContext) {
        super();
        this._context = context;
    }

    private async loadDeployments() {
        // Find files by include/exclude paths
        const _files = await fg(this._context.config.include, {
            ignore:   this._context.config.exclude,
            cwd:      this._context.config.workingDirectory,
            absolute: true, // optional, returns full paths
        });

        // Loop through and load files default deployments
        for (const _file of _files) {
            this._context.log.debug(`Processing file '${_file}'...`);
            const _deployment: Deployment = await BaseRuntime.importDefault<Deployment>(_file, isDeployment, this);
            await this.emit(RuntimeEvents.beforeLoadDeployment, this, _deployment);
            this._context.log.debug(`Adding deployment '${_deployment.alias}'.`);
            this._context.addDeployment(_deployment);
            await this.emit(RuntimeEvents.afterLoadDeployment, this, _deployment);
            this._context.log.debug(`'${_file}' processed.`);
        }
    }

    /**
     * 
     */
    async run(): Promise<void> {
        this._context.log.info(`Running stratoform in '${this._context.config.workingDirectory}'`);
        this._context.log.debug(`Including file pattern '${JSON.stringify(this._context.config.include)}'.`);
        this._context.log.debug(`Excluding file pattern '${JSON.stringify(this._context.config.exclude)}'.`);

        try {
            await this.emit(RuntimeEvents.beforeRun, this);

            // Loading the plugins
            
            // Loading the depoyments
            await this.emit(RuntimeEvents.beforeLoadDeployments, this);
            await this.loadDeployments();
            await this.emit(RuntimeEvents.afterLoadDeployments, this);

            
        }
        catch(err) {
            await this.emit(RuntimeEvents.runError, this, err);
        }
        finally {
            await this.emit(RuntimeEvents.afterRun, this);
        }
    }

    /**
     * 
     */
    get context(): IContext {
        return this._context;
    }

    /**
     * @description
     * @param file 
     * @returns 
     */
    private static async importDefault<T extends Deployment>(file: string, isT: (v: unknown) => v is T, runtime: IRuntime): Promise<T> {
        const _url = pathToFileURL(path.resolve(file)).href;
        const _mod = await import(_url);
        if(!("default" in _mod))
            throw new Error(`No default export in ${file}`);
        let _val = (_mod as { default: unknown }).default;
        _val     = typeof _val === "function" ? await (_val as any)(runtime) : _val;
        if(!isT(_val)) {
            let preview = "";
            try { 
                preview = JSON.stringify(_val); 
            }
            catch { 
                preview = Object.prototype.toString.call(_val); 
            }
            throw new TypeError(
                `Default export in '${file}' is not a Deployment. ` +
                `Expected type ${String(DEPLOYMENT_VERSION)}. Got: ${preview}`
            );
        }
        return _val;
    }
}

/**
 * 
 * @param context 
 * @param factory 
 */
export function createRuntime(context: IContext, factory?: RuntimeFactory): IRuntime {
    return (factory)? factory(context) : new BaseRuntime(context);
}