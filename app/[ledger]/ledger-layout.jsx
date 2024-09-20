// app/[ledger]/ledger-layout.jsx

'use client';

import React, {useState, createContext, useEffect} from 'react';
import Toolbar from './toolbar';
import Topbar from './topbar';
import {compputeBalance, emptyExpense, settle} from "../../api/get";
import ExpenseDrawer from "../../components/expense-drawer";

export const LedgerDataContext = createContext();

const LedgerLayout = ({ledger, initialData, children}) => {
    const [ledgerData, setLedgerData] = useState(initialData);
    const {balances} = ledgerData;
    const members = balances.map((balance) => balance.name);
    const [addTransaction, setAddTransaction] = useState(false);
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedExpense, setSelectedExpense] = useState(emptyExpense)

    // provide the updated search term to the provider when it changes
    // this will allow the provider to re-render the children components
    // that depend on the search term

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

    function handlePlus(){
        setAddTransaction(true)
    }

    return (
        <LedgerDataContext.Provider value={{ledgerData, searchTerm}}>
            <div className="min-h-screen flex flex-col bg-white dark:bg-black mb-64">
                {/* Header */}
                <Topbar ledger={ledger} onSearch={setSearchTerm}/>

                <main className="mx-3 my-4">{children}</main>

                <ExpenseDrawer
                    isDrawerOpen={addTransaction}
                    selectedExpense={selectedExpense}
                    setSelectedExpense={setSelectedExpense}
                    isEditMode={false}
                    handleCloseDrawer={() => setAddTransaction(false)}
                    members={members}
                />

                {/* Toolbar */}
                <Toolbar onClickPlus={handlePlus} ledger={ledger}/>
            </div>
        </LedgerDataContext.Provider>
    );
};

export default LedgerLayout;
