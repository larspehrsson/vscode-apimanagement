/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { HttpOperationResponse, ServiceClient } from "@azure/ms-rest-js";
import { TokenCredentialsBase } from "@azure/ms-rest-nodeauth";
import { TokenResponse } from "adal-node";
import { createGenericClient } from "vscode-azureextensionui";
import { nonNullValue } from "../../utils/nonNull";

export class GraphService {
    private accessToken: string;
    constructor(private credentials: TokenCredentialsBase,
                private graphEndpoint: string,
                private tenantId: string) {}

    public async acquireGraphToken(): Promise<void> {
        const token = await  this.credentials.getToken();
        this.credentials.authContext.acquireToken(
            this.graphEndpoint,
            nonNullValue(token.userId),
            this.credentials.clientId,
            (error, response) => {
                if (error == null) {
                    this.accessToken = (<TokenResponse>response).accessToken;
                }
            }
        );
    }

    // tslint:disable-next-line:no-any
    public async getUser(emailId: string): Promise<any> {
        const client: ServiceClient = await createGenericClient();
        const result: HttpOperationResponse = await client.sendRequest({
            method: "GET",
            url: `${this.graphEndpoint}/${this.tenantId}/users/${emailId}`,
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'api-version': '1.61-internal'
            }
        });
        // tslint:disable-next-line:no-any
        return <any>(result.parsedBody);
    }

     // tslint:disable-next-line:no-any
    public async getGroup(displayNameOrEmail: string): Promise<any> {
        const client: ServiceClient = await createGenericClient();
        const result: HttpOperationResponse = await client.sendRequest({
            method: "GET",
            url: `${this.graphEndpoint}/${this.tenantId}/groups?$filter=securityEnabled eq true and (startswith(displayName,'${displayNameOrEmail}') or startswith(mail,'${displayNameOrEmail}'))&$top=1`,
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'api-version': '1.61-internal'
            }
        });
         // tslint:disable-next-line: no-any no-unsafe-any
        return <any>(result.parsedBody.value[0]);
    }

     // tslint:disable-next-line:no-any
    public async getServicePrincipal(displayName: string): Promise<any> {
        const client: ServiceClient = await createGenericClient();
        const result: HttpOperationResponse = await client.sendRequest({
            method: "GET",
            url: `${this.graphEndpoint}/${this.tenantId}/servicePrincipals?$filter=startswith(displayName,'${displayName}')&$top=1`,
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'api-version': '1.61-internal'
            }
        });
        // tslint:disable-next-line: no-any no-unsafe-any
        return <any>(result.parsedBody.value[0]);
    }
}
