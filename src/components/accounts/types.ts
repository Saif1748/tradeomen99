 export interface Account {
   id: string;
   name: string;
   type: 'personal' | 'business' | 'demo';
   balance: number;
   currency: string;
   isDefault: boolean;
   members: AccountMember[];
   createdAt: string;
 }
 
 export interface AccountMember {
   id: string;
   name: string;
   email: string;
   role: 'owner' | 'admin' | 'member' | 'viewer';
   avatar?: string;
 }
 
 export interface AccountExecution {
   id: string;
   type: 'buy' | 'sell';
   symbol: string;
   quantity: number;
   price: number;
   total: number;
   timestamp: string;
 }
 
 export interface AccountTransaction {
   id: string;
   type: 'deposit' | 'withdraw';
   amount: number;
   timestamp: string;
   status: 'completed' | 'pending' | 'failed';
   note?: string;
 }
 
 // Demo data
 export const demoAccounts: Account[] = [
   {
     id: '1',
     name: 'Personal Trading',
     type: 'personal',
     balance: 12485.78,
     currency: 'USD',
     isDefault: true,
     members: [
       { id: '1', name: 'John Doe', email: 'john@example.com', role: 'owner' }
     ],
     createdAt: '2024-01-15'
   },
   {
     id: '2',
     name: 'Algo Trading LLC',
     type: 'business',
     balance: -45230.50,
     currency: 'USD',
     isDefault: false,
     members: [
       { id: '1', name: 'John Doe', email: 'john@example.com', role: 'owner' },
       { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'admin' },
       { id: '3', name: 'Bob Wilson', email: 'bob@example.com', role: 'member' }
     ],
     createdAt: '2024-02-20'
   },
   {
     id: '3',
     name: 'Demo Account',
     type: 'demo',
     balance: 100000.00,
     currency: 'USD',
     isDefault: false,
     members: [
       { id: '1', name: 'John Doe', email: 'john@example.com', role: 'owner' }
     ],
     createdAt: '2024-03-01'
   }
 ];
 
 export const demoTransactions: AccountTransaction[] = [
   { id: '1', type: 'deposit', amount: 50000, timestamp: '2024-01-15T10:00:00Z', status: 'completed', note: 'Initial deposit' },
   { id: '2', type: 'withdraw', amount: 5000, timestamp: '2024-02-01T14:30:00Z', status: 'completed', note: 'Monthly withdrawal' },
   { id: '3', type: 'deposit', amount: 10000, timestamp: '2024-02-15T09:15:00Z', status: 'completed' },
   { id: '4', type: 'withdraw', amount: 2500, timestamp: '2024-03-01T16:45:00Z', status: 'pending' },
 ];