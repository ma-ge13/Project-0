import ClientDAO, { ClientAzureDAO } from "../dao/azure-dao"
import Client, { Account } from "../entities/client";

describe("Client Azure DAO tests", () => {
    const clientDAO: ClientDAO = new ClientAzureDAO();
    const newAccount: Account = { "accountName": "Getaway Fund", "balance": 60000000 };

    const newClientData: Client = { "id": "", "firstName": "Bernie", "lastName": "Madoff", 
    "accounts": [ { "accountName": "Legal Defense Fund", "balance": 500000 },
     { "accountName": "Public Relations Fund", "balance": 1000 }, { "accountName": "New Personality Fund", "balance": 500 },
     { "accountName": "Charity Fund", "balance": 10  } ] };

    const updatedClientData: Client = {"id": "", "firstName":"Bernard", "lastName":"Madoff",
    "accounts": [ { "accountName": "Legal Defense Fund", "balance": 500000 },
     { "accountName": "Public Relations Fund", "balance": 1000 }, { "accountName": "New Personality Fund", "balance": 500 },
     { "accountName": "Charity Fund", "balance": 10 }, { "accountName": "Getaway Fund", "balance": 60000000 } ] };




    it("Should CREATE a NEW CLIENT in Cosmos", async () => {
        const newClient = await clientDAO.createClient(newClientData);
        updatedClientData.id = newClient.id;
        expect(newClient).not.toBeFalsy();
    })

    it("Should CREATE a NEW ACCOUNT for SPECIFIC CLIENT in Cosmos", async () => {
        const newClient = await clientDAO.createAccount(updatedClientData.id, newAccount);
        expect(newClient).not.toBeFalsy();
    })

    it("Should RETRIEVE ALL CLIENTS in Cosmos", async () => {
        const response = await clientDAO.getAllClients();
        expect(response).not.toBeFalsy();
    })

    it("Should RETRIEVE A SPECIFIC CLIENT in Cosmos", async () => {
        const response = await clientDAO.getClientById(updatedClientData.id);
        expect(response).not.toBeFalsy();
    })

    it("Should RETRIEVE ALL ACCOUNTS for SPECIFIC CLIENT in Cosmos", async () => {
        const response = await clientDAO.getAllAccountsById(updatedClientData.id);
        expect(response).not.toBeFalsy();
    })

    it("Should RETRIEVE ANY ACCOUNTS for SPECIFIC CLIENT in Cosmos per query condition(s)", async () => {
        const response = await clientDAO.getAccountsByQuery(updatedClientData.id, 400, 2000);
        expect(response).not.toBeFalsy();
    })

    it("Should RETRIEVE a SPECIFIC ACCOUNT for SPECIFIC CLIENT in Cosmos by ACCOUNT NAME", async () => {
        const response = await clientDAO.getAccountByName(updatedClientData.id, "Legal Defense Fund");
        expect(response).not.toBeFalsy();
    })

    it("Should UPDATE a SPECIFIC CLIENT in Cosmos", async () => {
        const response = await clientDAO.updateClientById(updatedClientData.id, updatedClientData);
        expect(response).not.toBeFalsy();
    })

    it("Should DEPOSIT AMOUNT into SPECIFIC ACCOUNT for SPECIFIC CLIENT in Cosmos", async () => {
        const response = await clientDAO.depositIntoAccountByName(updatedClientData.id, "Getaway Fund", 5000000);
        expect(response).not.toBeFalsy();
    })

    it("Should WITHDRAW AMOUNT out of SPECIFIC ACCOUNT for SPECIFIC CLIENT in Cosmos", async () => {
        const response = await clientDAO.depositIntoAccountByName(updatedClientData.id, "Charity Fund", 4.75);
        expect(response).not.toBeFalsy();
    })

    it("Should DELETE a SPECIFIC CLIENT in Cosmos", async () => {
        const response = await clientDAO.deleteClientById(updatedClientData.id);
        expect(response).not.toBeTruthy();
    })
})