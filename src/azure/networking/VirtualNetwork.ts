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

import { IConfig } from "../../core/IConfig.js";
import { AzureResource } from "../AzureResource.js";
import { ResourceGroup } from "../ResourceGroup.js";
import { Subnet } from "./Subnet.js";

/**
 * 
 */
export interface IVirtualNetworkConfig extends IConfig {
    
};

export type VirtualNetworkChild<C extends IConfig> = AzureResource<C, VirtualNetwork, any>;

/**
 * 
 */
export class VirtualNetwork  extends AzureResource<IVirtualNetworkConfig, ResourceGroup, VirtualNetworkChild<any>>  {

    /**
     * @description 
     * @param subnet 
     * @returns 
     */
    deploySubnet(subnet: Subnet): this {
        return this.deployChild(subnet);
    }

    get path(): string {
        return "providers/Microsoft.Network/virtualNetworks";
    }

    get apiVersion(): string {
        return "2023-09-01";
    }

    get identifier(): string {
        return this.alias;
    }
}