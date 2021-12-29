import Client, {Account} from "../entities/client";
import { v4 } from "uuid";
import { CosmosClient } from "@azure/cosmos";
import _ from "lodash";

const client = new CosmosClient(process.env.COSMOS_CONNECTION!);
const database = client.database("ponzi-banking-db");
const container = database.container("Client Accounts");

export default interface ClientDAO {
    createClient(client: Client): Promise<Client>;

    createAccount(clientId: string, account: Account): Promise<Client>;
    
    getAllClients(): Promise<Client[]>;
    
    getClientById(clientId: string): Promise<Client>;

    getAllAccountsById(id: string): Promise<Account[]>;

    getAccountsByQuery(clientId: string, minThreshold?: number, maxThreshold?: number): Promise<Account[]>;

    getAccountByName(clientId: string, name: string): Promise<Account>;

    updateClientById(clientId: string, client: Client): Promise<Client>;

    depositIntoAccountByName(clientId: string, accountName: string, amount: number): Promise<Account>;

    withdrawFromAccountByName(clientId: string, name: string, amount: number): Promise<Account>;

    deleteClientById(clientId: string): Promise<Client>;

}

export class ClientAzureDAO implements ClientDAO {

    async createClient(client: Client): Promise<Client> {
        if(_.isEmpty(client.id)) client.id = v4();
        
        await container.items.create(client);
        
        return this.getClientById(client.id);
    }
    
    async createAccount(clientId: string, account: Account): Promise<Client>{
        const response = await this.getClientById(clientId);
        response.accounts?.push(account);
        
        await container.item(clientId, clientId).replace<Client>(response);

        return response;
    }

    async getAllClients(): Promise<Client[]> {
        const response = (await container.items.readAll<Client>().fetchAll()).resources;
        const clients: Client[] = this.parseCosmosRecords(response);
        
        return clients;
    }

    async getClientById(clientId: string): Promise<Client> {
        const {id, firstName, lastName, accounts} = (await container.item(clientId, clientId).read<Client>()).resource;
        
        return {id, firstName, lastName, accounts};
    }
    
    async getAllAccountsById(clientId: string): Promise<Account[]> {
        const {accounts} = await this.getClientById(clientId);
        
        return accounts;
    }
    
    async getAccountsByQuery(clientId: string, minThreshold?: number, mamxThreshold?: number): Promise<Account[]> {
        const client: Client = await this.getClientById(clientId);
        let accounts: Account[];

        if (minThreshold && mamxThreshold)
            accounts = [...client.accounts.filter(a => minThreshold < a.balance && a.balance < mamxThreshold)];
        else if (minThreshold)
            accounts = [...client.accounts.filter(a => minThreshold < a.balance)];
        else
            accounts = [...client.accounts.filter(a => a.balance < mamxThreshold)];

        return accounts;
    }

    async getAccountByName(clientId: string, name: string): Promise<Account> {
        const accounts = await this.getAllAccountsById(clientId);
        const {accountName, balance} = accounts.filter(a => a.accountName === name)[0];

        return {accountName, balance};
    }

    async updateClientById(clientId: string, client: Client): Promise<Client> {
        let response = await container.item(clientId, clientId).replace<Client>(client);
        
        return this.getClientById(clientId);
    }
    
    async depositIntoAccountByName(clientId: string, name: string, amount: number): Promise<Account> {
        const response = await this.getClientById(clientId);
        const account = response.accounts.filter(a => a.accountName === name)[0];
        
        const updatedAccount = {accountName: account.accountName, balance: account.balance + amount};
        
        response.accounts.splice(response.accounts.indexOf(account), 1, updatedAccount);
        
        await container.item(clientId, clientId).replace<Client>(response);
        
        return await this.getAccountByName(clientId, name);
    }
    
    async withdrawFromAccountByName(clientId: string, name: string, amount: number): Promise<Account> {
        const response = await this.getClientById(clientId);
        const account = response.accounts.filter(a => a.accountName === name)[0];

        const updatedAccount = {accountName: account.accountName, balance: account.balance - amount};
        
        response.accounts.splice(response.accounts.indexOf(account), 1, updatedAccount);
        
        await container.item(clientId, clientId).replace<Client>(response);
        
        return await this.getAccountByName(clientId, name);
    }

    async deleteClientById(clientId: string): Promise<any> {
        await container.item(clientId, clientId).delete<Client>();
        
        return;
    }

    private parseCosmosRecords(response: Client[]) {
        const clients: Client[] = [];

        for (let client of response) {
            const { id, firstName, lastName, accounts } = _.omit(client, ["_rid", "_self", "_etag", "_attachments", "_ts"]);

            clients.push({ id, firstName, lastName, accounts });
        }
        return clients;
    }
}