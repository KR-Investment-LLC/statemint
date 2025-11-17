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
import { Deployment } from "./Deployment.js";
import { IConfig } from "./IConfig.js";
import { IDependable } from "./IDependable.js";
import { v4 as uuidv4 } from "uuid";


/** 
 * @description Event names the base class uses 
 */
export const ResourceEvents = {
    beforeSpecutlate: "beforeSpecutlate" as const,     // (target, source, deployment, context): Promise<void> : void
    speculate:        "speculate"        as const,     // (target, source, deployment, context): Promise<void> : void
    afterSpecutlate:  "afterSpecutlate"  as const,     // (target, source, deployment, context): Promise<void> : void
    speculationError: "speculationError" as const,     // (target, source, error, deployment, context): Promise<void> : void
    beforeDeploy:     "beforeDeploy"     as const,     // (resource, operation, deployment, context, filter?: any): Promise<void> : void
    deploy:           "deploy"           as const,     // (resource, operation, deployment, context, filter?: any): Promise<void> : void
    afterDeploy:      "afterDeploy"      as const,     // (resource, operation, deployment, context, filter?: any): Promise<void> : void
    deploymentError:  "deploymentError"  as const,     // (resource, operation, error, deployment, context, filter?: any): Promise<void> : void
    /**
     * @description Listener: (resource, error, deployment, context): Promise<void> : void
     */
    error: "error" as const
};

/**
 * @description
 * @enum {string}
 */
export enum ResourceOperation {
    Create  = "Create",
    Read    = "Read",
    Modify  = "Modify",
    Destroy = "Destroy"
}

export type ResourceListener<TR extends AbstractResource<any, any, any>> = 
        (resource: TR, deployment?: Deployment, context?: IContext) => Promise<void> | void;

export type ResourceErrorListener<TR extends AbstractResource<any, any, any>> = 
        (resource: TR, error: any, deployment?: Deployment, context?: IContext) => Promise<void> | void;

export type SpeculateListener<TR extends AbstractResource<any, any, any>> = 
        (target: TR, source: TR, deployment?: Deployment, context?: IContext) => Promise<void> | void;

export type SpeculateErrorListener<TR extends AbstractResource<any, any, any>> = 
        (target: TR, source: TR, error: any, deployment?: Deployment, context?: IContext) => Promise<void> | void;

export type DeploymentListener<TR extends AbstractResource<any, any, any>> = 
        (resource: TR, operation: ResourceOperation, deployment?: Deployment, context?: IContext, filter?: any) => Promise<void> | void;

export type DeploymentErrorListener<TR extends AbstractResource<any, any, any>> = 
        (resource: TR, operation: ResourceOperation, error: any, deployment?: Deployment, context?: IContext, filter?: any) => Promise<void> | void;

/** 
 * @description Every resource has a name, config, and is an async event emitter. 
 */
export abstract class AbstractResource<CONFIG extends IConfig, 
                                       PARENT extends AbstractResource<any, any, any> | Deployment = never,
                                       CHILD  extends AbstractResource<any, any, any> = never> 
        extends AsyncEventEmitter 
        implements IDependable {
    private _stratoId                  = uuidv4();
    private _operation                 = ResourceOperation.Read;
    private _dependents: IDependable[] = []; 

    private _resove!:      () => void;
    private _alias:        string;
    private _config:       CONFIG;
    private _semaphore:    Promise<void>;
    private _children?:    Map<string, CHILD>;
    public  parent?:       PARENT; // Will be set and enforced during deployment operations.

    /**
     * @description
     * @param alias 
     * @param config 
     */
    constructor(alias: string, config: CONFIG) { 
        super(); 
        this._alias  = alias;
        this._config = config;

        this._semaphore = new Promise<void>((resolve) => {
            this._resove = resolve;
        });

        // set up the callbacks for the resource operations.
        this.on(ResourceEvents.speculate, this.handleSpeculateEvent);
        this.on(ResourceEvents.deploy,    this.dispatchDeploy);
    }

    async handleCreateEvent(resource: this, deployment: Deployment, context: IContext): Promise<void> {}

    async handleReadEvent(resource: this, deployment: Deployment, context: IContext): Promise<void> {}

    async handleModifyEvent(resource: this, deployment: Deployment, context: IContext): Promise<void> {}

    async handleDestroyEvent(resource: this, deployment: Deployment, context: IContext): Promise<void> {}

    async handleSpeculateEvent(resource: this, deployment: Deployment, context: IContext): Promise<void> {}

    async handleLookupEvent(resource: this, filter: any, deployment: Deployment, context: IContext): Promise<void> {}

    async dispatchDeploy(resource: this, operation: ResourceOperation, deployment: Deployment, context: IContext, filter?: any): Promise<void> {
        // Disptach the deployment request to the correct handler.
        let _promise: Promise<void> | undefined;
        switch(operation) {
            case ResourceOperation.Create: 
                _promise = resource.handleCreateEvent(resource, deployment, context);
                break;
            case ResourceOperation.Read: 
                _promise = resource.handleReadEvent(resource, deployment, context);
                break;
            case ResourceOperation.Modify: 
                _promise = resource.handleModifyEvent(resource, deployment, context);
                break;
            case ResourceOperation.Destroy: 
                _promise = resource.handleDestroyEvent(resource, deployment, context);
                break;
            default:
                throw new Error(`Unhandled operation '${operation}' in resource '${this._alias}'.`);
        }
        return _promise;
    }

    get stratoId(): string {
        return this._stratoId;
    }

    get alias(): string {
        return this._alias;
    }

    set alias(alias: string) {
        this._alias = alias;
    }

    get config(): CONFIG {
        return this._config;
    }

    set config(config: CONFIG) {
        this._config = config;
    }

    get operation(): ResourceOperation {
        return this._operation;
    }

    dependsOn(...items: (IDependable | undefined)[]): void {
        this._dependents.push(...items.filter((d): d is IDependable => d !== undefined));
    }

    async ready(): Promise<void> {
        return this._semaphore;
    }

    /**
     * @description Sets if this resource is composite and can have children. Developers, if your resource doesnt allow child resources then
     *              override this readonly property and return false.
     * @returns true if this is a composite resource, false otherwise.
     */
    get isCompositeResource(): boolean {
        return true;
    }

    private get _ensureChildren(): Map<string, CHILD> {
        if(!this.isCompositeResource)
            throw new Error(`Resource '${this.alias}' of type '${this.constructor.name}' is not composite and does not allow child resources.`);
        if(!this._children)
            this._children = new Map<string, CHILD>();
        return this._children;
    }

    deployChild(resource: CHILD): this {
        resource.parent = this;
        this._ensureChildren.set(resource.alias, resource);
        return this;
    }

    deployChildren(...dependents: CHILD[]): this {
        for(const _dependent of dependents) {
            this.deployChild(_dependent);
        }
        return this;
    }

    /**
     * @description Gets a child by the statoform name from this resource. If children ARE NOT supported by this resource then undefined is returned. 
     *              If <code>failIfUndefined</code> is true, then ANY undefined value will throw an error, include if this resource does not support children.
     * @param alias           The statoform name of the child resource to retrieve
     * @param failIfUndefined Throw an error is the child is not found
     * 
     * @returns The child element of this resource names <code>name</code>.
     */
    getChild(alias: string, failIfUndefined: boolean = false): CHILD | undefined {
        let _dependent = undefined;
        if(this._children) 
            _dependent = this._children.get(alias);
        if(failIfUndefined && !_dependent) 
            throw new Error(`Child resource '${alias}' not found in '${this.alias}' of type '${this.constructor.name}' and failIfUndefined was true.`);
        return _dependent;
    }

    hasChild(alias: string): boolean {
        if(!this._children)
            return false;
        else return this._ensureChildren.has(alias);
    }

    get children(): Iterable<CHILD> {
        if(!this._children)
            return [] as CHILD[];
        else return this._ensureChildren.values();
    }

    /**
     * @description       Static constructor to create a new resource for deployment.
     * @param alias       The alias for this resource in stratoform, nor the name of the resource in your cloud provider. 
     * @param config      The config for this resource
     * @param [fn]        The deploy event callback for this resource 
     * @param [dependsOs] Expanded array of resources or deployments this resource is dependent on.
     * @returns 
     */
    static deploy<RESOIURCE_TYPE extends AbstractResource<any, any, any>, CONFIG extends IConfig>(
                    this: new (alias: string, config: CONFIG) => RESOIURCE_TYPE, alias: string, config: CONFIG, fn?: DeploymentListener<RESOIURCE_TYPE>, ...dependsOs: (IDependable | undefined)[]): RESOIURCE_TYPE {
        const _instance = new this(alias, config);
        _instance.dependsOn(...dependsOs);
        if(fn) _instance.on(ResourceEvents.deploy, fn);
        return _instance;
    }

    static lookup<TR extends AbstractResource<any, any, any>, C>(): TR {
        return {} as TR;
    };
}