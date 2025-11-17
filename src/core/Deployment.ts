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

import { IContext } from "../runtime/Context.js";
import { AsyncEventEmitter } from "./AsyncEventEmitter.js";
import { IDependable } from "./IDependable.js";
import { AbstractResource } from "./AbstractResource.js";
import { Variable } from "./Variable.js";

export const DEPLOYMENT_VERSION = Symbol.for("Stratoform.Deployment/v1.0.0");

/** 
 * Event names the base class uses 
 */
export const DeploymentEvents = {
    beforeDefine:     "beforeDefine"     as const,
    define:           "define"           as const,
    afterDefine:      "afterDefine"      as const,
    definitionError:  "definitionError"  as const,
    beforeValidate:   "beforeValidate"   as const, 
    validate:         "validate"         as const,
    afterValidate:    "afterValidate"    as const,
    validationError:  "validationError"  as const,
    beforeSpecutlate: "beforeSpecutlate" as const,
    specutlate:       "specutlate"       as const,
    afterSpecutlate:  "afterSpecutlate"  as const,
    speculationError: "speculationError" as const,
    beforeDeploy:     "beforeDeploy"     as const,
    deploy:           "deploy"           as const,
    afterDeploy:      "afterDeploy"      as const,
    deploymentError:  "deploymentError"  as const
};

/**
 * @description
 */
export interface IDeploymentConfig {
    name?: string
};

export type DefineDeploymentListener<D extends Deployment<any>> = (self: D, context: IContext | never) => Promise<void> | void;

/**
 * @description
 */
export class Deployment<C extends IDeploymentConfig = IDeploymentConfig> 
        extends AsyncEventEmitter 
        implements IDependable {
    public readonly [DEPLOYMENT_VERSION] = true;

    //private _resources               = new CompositeMap<this, Resource<any, any, any>>(this);
    private _inputs                  = new Map<string, Variable<any>>();
    private _outputs                 = new Map<string, Variable<any>>();
    //private _deployments             = new CompositeMap<this, Deployment>(this);
    //private _dependable:  Dependable = new Dependable();
    private _alias:       string;
    private _config:      C;

    public parent: Deployment | undefined; // Will be set and enforced during deployment operations.

    constructor(alias: string, config: C) {
        super();
        this._alias = alias;
        this._config = config;
    }

    get alias(): string {
        return this._alias;
    }

    set alias(alias: string) {
        this._alias = alias;
    }

    get config(): C {
        return this._config;
    }

    set config(config: C) {
        this._config = config;
    }

    deployResources(...resources: AbstractResource<any, any, any>[]): this {
        //this._resources.deployDependents(...resources);
        return this;
    }

    deployResource(resource: AbstractResource<any, any, any>): this {
        //this._resources.deployDependent(resource);
        return this;
    }

    getResource(alias: string, failIfUndefined: boolean = false): AbstractResource<any, any, any> | undefined {
        //return this._resources.getDependent(alias, failIfUndefined);
        return;
    }

    get resources(): Iterable<AbstractResource<any, any, any>> {
       // return this._resources.dependents;
       return {} as Iterable<AbstractResource<any, any, any>>;
    }

    declareInput(variable: Variable<any>): this {
        this._inputs.set(variable.name, variable);
        return this;
    }

    declareInputs(...variables: Variable<any>[]): this {
        for(const _variable of variables) {
            this.declareInput(_variable);
        }
        return this;
    }

    getInput(name: string): Variable<any> | undefined {
        return this._inputs.get(name);
    }

    get inputs(): Iterable<Variable<any>> {
        return this._inputs.values();
    }

    declareOutput(variable: Variable<any>): this {
        this._outputs.set(variable.name, variable);
        return this;
    }

    declareOutputs(...variables: Variable<any>[]): this {
        for(const _variable of variables) {
            this.declareOutput(_variable);
        }
        return this;
    }

    getOutput(name: string): Variable<any> | undefined {
        return this._outputs.get(name);
    }

    setOutput(name: string, value: any): void {
        // TODO: Populate this.
    }

    get outputs(): Iterable<Variable<any>> {
        return this._outputs.values();
    }
    
    linkDeployment(deployment: Deployment<any>): this {
        //this._deployments.deployDependent(deployment);
        return this;
    }

    linkDeployments(...deployments: Deployment<any>[]): this {
        //this._deployments.deployDependents(...deployments);
        return this;
    }

    getDeployment(name: string, failIfUndefined: boolean  = false): Deployment<any> | undefined {
        //return this._deployments.getDependent(name, failIfUndefined);
        return {} as Deployment<any> | undefined;
    }

    get deployments(): Iterable<Deployment<any>> {
        //return this._deployments.dependents;
        return {} as Iterable<Deployment<any>>
    }

    dependsOn(...items: IDependable[]): void {
       // this._dependable.dependsOn(...items);
    }

    async ready(): Promise<void> {
        //return this._dependable.ready();
    }

    async emitDefineEvent(context: IContext) {
        await this.emit(DeploymentEvents.beforeDefine, this, context);
        await this.emit(DeploymentEvents.define,       this, context);
        // Emit events for all the child deployments.
        // for(const _deployment of this._deployments.dependents) {
        //     await _deployment.emitDefineEvent(context);
        // }
        await this.emit(DeploymentEvents.afterDefine,  this, context);
    }

    async emitValidateEvent(context: IContext) {
        await this.emit(DeploymentEvents.beforeValidate, this, context);
        await this.emit(DeploymentEvents.validate,       this, context);
        // Emit events for all the child deployments.
        // for(const _deployment of this._deployments.dependents) {
        //     await _deployment.emitDefineEvent(context);
        // }
        await this.emit(DeploymentEvents.afterValidate,  this, context);
    }

    /**
     * @description 
     * @param this 
     * @param name 
     * @param config 
     * @param fn 
     * @returns 
     */
    static define<TR extends Deployment<any>, C>(this: new (alias: string, config: C) => TR, alias: string, config: C, fn?: DefineDeploymentListener<TR>): TR {
        const _instance = new this(alias, config);
        if(fn) _instance.on(DeploymentEvents.define, fn);
        return _instance;
    }

    /**
     * 
     * @param x 
     * @returns 
     */
    static is(x: unknown): x is Deployment {
        return !!x && typeof x === "object" && DEPLOYMENT_VERSION in (x as object);
    }
}