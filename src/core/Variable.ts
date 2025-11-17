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

import { IValidator } from "./IValidator.js"
import { AsyncEventEmitter } from "./AsyncEventEmitter.js";

export interface IVariableConfig<T> {
    defaultValue?: T ;
    required?:     boolean;
    secure?:       boolean;
    desscription?: string;
    validations?:  IValidator<T>[];
};

export const VariableEvents = {
    declare:         "declare"         as const,
    beforeValueSet:  "beforeValueSet"  as const,
    afterValueSet:   "afterValueSet"   as const,
    beforeValidate:  "beforeValidate"  as const,
    afterValidate:   "afterValidate"   as const,
    validationError: "validationError" as const
};

/**
 * 
 */
export class Variable<T, C extends IVariableConfig<T> = IVariableConfig<T>> extends AsyncEventEmitter {
    private _name:   string;
    private _config: C;
    private _value:  T | undefined;

    constructor(name: string, config: C = {} as C) {
        super();
        this._name   = name;
        this._config = config;
        this._value  = this._config.defaultValue;
    }

    get name(): string {
        return this._name;
    }

    get config(): C | undefined {
        return this._config;
    }

    set config(config: C) {
        this._config = config;
    }

    get value(): T | undefined {
        return this._value;
    }

    async setValue(value: T): Promise<void> {
        await this.emit(VariableEvents.beforeValidate, this, value);
        // TODO: Validate
        await this.emit(VariableEvents.afterValidate, this, value);
        await this.emit(VariableEvents.beforeValueSet, this, value);
        this._value = value;
        await this.emit(VariableEvents.afterValueSet, this, value)
    }

    static declare<T, C extends IVariableConfig<T> = IVariableConfig<T>, TR extends Variable<T, C> = Variable<T, C>>(
            this: new (name: string, config?: C) => TR, name: string, config?: C, fn?: (self: TR) => Promise<void> | void): TR {
        const _instance = new this(name, config);
        if(fn) _instance.on(VariableEvents.declare, () => fn(_instance));
        return _instance;
    }
}