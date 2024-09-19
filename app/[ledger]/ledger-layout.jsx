// app/[ledger]/ledger-layout.jsx

'use client';

import React, {useState, createContext} from 'react';
import Toolbar from './toolbar';
import Topbar from './topbar';
import {compputeBalance, settle} from "../../api/get";
import {ScrollArea} from "@/components/ui/scroll-area";

export const LedgerDataContext = createContext();

const LedgerLayout = ({ledger, initialData, children}) => {
    const [ledgerData, setLedgerData] = useState(initialData);
    const [addTransaction, setAddTransaction] = useState(false);
    const [search, setSearch] = useState('');

    // Function to update ledgerData (e.g., adding a transaction)
    const addTransactionData = (newTransaction) => {
        setLedgerData((prevData) => {
            const newExpenses = [...prevData.expenses, newTransaction];

            const updatedBalances = compputeBalance(newExpenses);
            const updatedDebts = settle(updatedBalances);

            return {
                expenses: newExpenses,
                balances: updatedBalances,
                debts: updatedDebts,
            };
        });
    };

    return (
        <LedgerDataContext.Provider value={{ledgerData, addTransactionData}}>
            <div className="min-h-screen flex flex-col">
                {/* Header */}
                <Topbar ledger={ledger} onSearch={(value) => setSearch(value)}/>

                <main className="flex-grow container mx-auto p-4">{children}</main>

                {/* Toolbar */}
                <Toolbar ledger={ledger} setIsDrawerOpen={setAddTransaction}/>
            </div>
        </LedgerDataContext.Provider>
    );
};

export default LedgerLayout;
