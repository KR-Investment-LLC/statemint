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

import { Command }        from "commander";
import { IRuntimeConfig } from "./RuntimeConfig.js";
import { Logger } from "winston";
import { getLogger } from "../core/Logger.js";
import { Deployment } from "../core/Deployment.js";

/**
 * @description
 * @author Robert R Murrell
 */
export interface IContext {
    readonly config:  IRuntimeConfig;
    readonly process: Command;
    readonly log:     Logger;

    getDeployment(name: string): Deployment | undefined;
    addDeployment(deployment: Deployment): this;
    removeDeployment(deployment: string | Deployment): Deployment | undefined;
    containsDeployment(deployment: string | Deployment): boolean;
    readonly deployments: Iterable<Deployment>;
};

/**
 * @description Factory method for creating a user-defined context.
 */
export type ContextFactory = (config: IRuntimeConfig, opts: any) => BaseContext;

/**
 * 
 */
export class BaseContext implements IContext {
    public _config!:  IRuntimeConfig;
    public _process!: Command;
    public _logger!:  Logger;

    private _deployments: Map<string, Deployment> = new Map<string, Deployment>();

    get config(): IRuntimeConfig {
        return this._config;
    }

    get process(): Command {
        return this._process;
    }

    get log(): Logger {
        return this._logger;
    }

    getDeployment(alias: string): Deployment | undefined {
        return this._deployments.get(alias);
    }

    addDeployment(deployment: Deployment): this {
        this._deployments.set(deployment.alias, deployment)
        return this;
    }

    removeDeployment(deployment: string | Deployment): Deployment | undefined {
        const _key     = (typeof deployment === "string")? deployment : deployment.alias;
        const _deleted = this._deployments.get(_key);
        if(_deleted) this._deployments.delete(_key);
        return _deleted;
    }

    containsDeployment(deployment: string | Deployment): boolean {
        const _key = (typeof deployment === "string")? deployment : deployment.alias;
        return this._deployments.has(_key);
    }

    get deployments(): Iterable<Deployment> {
        return this._deployments.values();
    }
}

/**
 * @description Creates a new Context based on the runtime config.
 *              If factory is specified, it will be invoked to create the context.
 * 
 * @param config  The runtime config loaded from file.
 * @param factory Optional factory method for create a user-defined context.
 * 
 * @returns The context for this run.
 */
export function createContext(config: IRuntimeConfig, process: Command, opts: any, factory?:ContextFactory): IContext {
    let _context = (factory)? factory(config, opts) : new BaseContext();
    _context._config  = config;
    _context._process = process;
    _context._logger  = getLogger(config);
    return _context;
}