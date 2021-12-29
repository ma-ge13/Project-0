import express from "express";
import ClientDAO, { ClientAzureDAO } from "./dao/azure-dao";
import Client, {Account} from "./entities/client";
import _ from "lodash";

const app = express();
const clientDao: ClientDAO = new ClientAzureDAO();

app.use(express.json());

app.listen(4444, () => console.log("This Ponzi scheme is OPEN for business!"))


// ROUTES TO CREATE:

// Client Object
app.post("/clients", async (req, res) => {
    const clientProperties = ["id", "firstName", "lastName"];

    for (const property of clientProperties)
        if (!(req.body).hasOwnProperty(property))
            return res.status(406).send(`Your request is missing the "${property}:" property within its body.`)

    const client = await clientDao.createClient(req.body);
    
    res.status(201).send(client);   
})

// Account Object
app.post("/clients/:id", async (req, res) => {
    let client = await verifyClientState(req.params.id, res);
    if(client === undefined) return;
    
    client = await clientDao.createAccount(req.params.id, req.body);
    
    res.status(201).send(client);
})



// ROUTES TO READ:

// All Client-objects
app.get("/clients", async (req, res) => {
    const clients: Client[] = await clientDao.getAllClients();
    
    res.status(200).send(clients);
})

// Specific Client-object
app.get("/clients/:id", async (req, res) => {
    const client = await verifyClientState(req.params.id, res);
    if(client === undefined) return;

    res.status(200).send(client);
})

// All *OR* Specific Account-objects of Specific Client-object
app.get("/clients/:id/accounts", async (req, res) => {
    if((await verifyClientState(req.params.id, res)) === undefined) return;

   let accounts: Account[] = [];
    if (!_.isEmpty(req.query))
        accounts = await clientDao.getAccountsByQuery(req.params.id, 
            Number(req.query.amountGreaterThan), Number(req.query.amountLessThan));
    else
        accounts = await clientDao.getAllAccountsById(req.params.id);

    res.status(200).send(accounts);
})



// ROUTES TO UPDATE:

// Properties of Specific Client-object
app.put("/clients/:id", async (req, res) => {
    let client = await verifyClientState(req.params.id, res);
    if(client === undefined) return;
    
    client = await clientDao.updateClientById(req.params.id, req.body);
    
    res.status(201).send(client);
})

// Increase in funds for Specific Account-object of Specific Client-object
app.patch("/clients/:id/accounts/:accountName/deposit", async (req, res) => {
    if((await verifyClientState(req.params.id, res)) === undefined) return;

    let account = await verifyAccountState(req.params.id, req.params.accountName, res);
    if(account === undefined) return;

    account = await clientDao.depositIntoAccountByName(req.params.id, req.params.accountName, req.body.amount);

    res.status(200).send(account);
})

// Decrease in funds for Specific Account-object of Specific Client-object
app.patch("/clients/:id/accounts/:accountName/withdraw", async (req, res) => {
    if((await verifyClientState(req.params.id, res)) === undefined) return;

    let account = await verifyAccountState(req.params.id, req.params.accountName, res, req.body.amount);
    if(account === undefined) return;
    
    account = await clientDao.withdrawFromAccountByName(req.params.id, req.params.accountName, req.body.amount);

    res.status(200).send(account);
})


// ROUTES TO DELETE:

// Specific Client-object
app.delete("/clients/:id", async (req, res) => {
    if((await verifyClientState(req.params.id, res)) === undefined) return;
    
    await clientDao.deleteClientById(req.params.id);
    
    res.status(205).send(`Client ${req.params.id} has been deleted.`);
})



// VERIFICATION ROUTINES:

async function verifyClientState(clientId: string, response): Promise<Client> {
    let client: Client;

    try {
        client = await clientDao.getClientById(clientId);
    } catch (error) {
        response.status(404).send("CLIENT DOES NOT EXIST.");
    }

    return client;
}

async function verifyAccountState(clientId: string, accountName: string, response, amount?: number): Promise<Account> {
    let account: Account;

    try {
        account = (await clientDao.getAccountByName(clientId, accountName));
    } catch (error) {
        response.status(404).send("ACCOUNT DOES NOT EXIST.");
    }

    try {
        if (amount < 0 || (account.balance - amount) < 0) throw("INSUFFICIENT FUNDS.");
    } catch (error) {
        response.status(422).send(error);
        account = undefined;
    }

    return account;
}
