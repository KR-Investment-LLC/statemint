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

import { Deployment } from "../../core/Deployment.js";
import { IConfig } from "../../core/IConfig.js";
import { IContext } from "../../runtime/Context.js";
import { AzureResource } from "../AzureResource.js";
import { VirtualNetwork } from "./VirtualNetwork.js";

/**
 * 
 */
export interface ISubnetConfig extends IConfig {
    //
};

/**
 * 
 */
export class Subnet extends AzureResource<ISubnetConfig, VirtualNetwork> {
    async handleValidateEvent(resource: this, deployment: Deployment, context: IContext): Promise<void> {
        if(!(this.parent instanceof VirtualNetwork))
            throw new Error(`Subnet must be a child of VirtualNetwork.`);
    }

    get path(): string {
        return "subnets";
    }

    get apiVersion(): string {
        return "2023-09-01";
    }

    get identifier(): string {
        return this.alias;
    }
}