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

import { Subnet } from "../src/azure/networking/Subnet.js";
import { VirtualNetwork } from "../src/azure/networking/VirtualNetwork.js";
import { ResourceGroup } from "../src/azure/ResourceGroup.js";
import { 
    Subscription, 
    WorkloadType 
} from "../src/azure/Subscription.js";
import { Deployment } from "../src/core/Deployment.js";
import { Variable } from "../src/core/Variable.js";
import { IContext } from "../src/runtime/Context.js";

export default Deployment.define("MyApplicationInfrastructureDeployment", {}, 
    (deployment: Deployment, context: IContext) => {
        context.log.info(`Defining deployment '${deployment.alias}'...`);

        deployment.declareInputs(
            Variable.declare<string>("environment", {
                required: true
            }),
            Variable.declare<string>("criticallity", {
                required: true
            })
        )
        // Now the resources, starting with the subscription
        .deployResource(Subscription.deploy("MySubscriptionOne", {
                name:         "my-subscription-one-sub",
                workloadType: WorkloadType.Production
            }, 
            (mySubscriptionOne: Subscription) => {
                // add the first resource group.
                mySubscriptionOne.deployChildren(
                    ResourceGroup.deploy("MyResourceGroupOne", {
                            name: "my-resource-group-one-rg",
                        }, 
                        (myResourceGroupOne: ResourceGroup) => {        
                            // Add the VNET to resource group 1
                            myResourceGroupOne.deployChild(VirtualNetwork.deploy("MyVirtualNetworkOne", {
                                name: "my-virtual-network-one-vnet"
                            },
                            (myVirtualNetworkOne: VirtualNetwork) => {
                                // add the subnet
                                myVirtualNetworkOne.deploySubnet(Subnet.deploy("MyVirtualNetworkOneMainSubnet", {
                                    name: "main-subnet"
                                }));
                        }));
                    }),
                    ResourceGroup.deploy("MyResourceGroupTwo", {
                            name: "my-resource-group-two-rg",
                        }, 
                        (myResourceGroupTwo: ResourceGroup) => {
                            // Add the VNET to resource group 1
                        },
                        mySubscriptionOne.getChild("MyResourceGroupOne", true)
                    )
                )
        }));

        context.log.info(`Deployment '${deployment.alias}' defined.`);
});
