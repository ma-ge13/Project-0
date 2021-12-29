export default interface Client {
    id: string,
    firstName: string,
    lastName: string,
    accounts?: Account[]
}

export interface Account {
    accountName: string,
    balance: number
}