// app/[ledger]/page.jsx

"use client"

import React, {useContext, useEffect, useState} from 'react';
import {LedgerDataContext} from './ledger-layout';
import ExpensesTab from "@/components/expenses";
import {emptyExpense} from "@/api/get";
import Fuse from 'fuse.js';
import ExpenseDrawer from "../../components/expense-drawer";
import {compputeBalance, settle} from "../../api/get";

const TransactionsPage = () => {
    const {ledgerData, searchTerm} = useContext(LedgerDataContext);
    const [expenses, setExpenses] = useState(ledgerData.expenses);
    const [balances, setBalances] = useState(ledgerData.balances);
    const [debts, setDebts] = useState(ledgerData.debts);
    const members = balances.map((balance) => balance.name);

    const [filteredExpenses, setFilteredExpenses] = useState([])
    const [selectedExpense, setSelectedExpense] = useState(emptyExpense)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false);
    const [isUnequalSplit, setIsUnequalSplit] = useState(false);
    const [isIncome, setIncome] = useState(false);

    useEffect(() => {
        setExpenses(ledgerData.expenses);
    }, [ledgerData.expenses]);


    useEffect(() => {
        if (searchTerm) {
            const fuse = new Fuse(expenses, {
                keys: ['name', 'category'],
                threshold: 0.3,
            })
            const results = fuse.search(searchTerm)
            setFilteredExpenses(results.map(result => result.item))
        } else {
            setFilteredExpenses(expenses)
        }
    }, [searchTerm, expenses])

    function handleExpenseClick(expense) {
        setSelectedExpense(expense)
        setIsDrawerOpen(true)
        setIsEditMode(true)
    }

    const handleCloseDrawer = (updatedExpense) => {
        // replace the expense with matching ID in the expenses array
        if (updatedExpense.id) {
            const updatedExpenses = expenses.map(expense =>
                expense.id === updatedExpense.id ? updatedExpense : expense
            );
            setExpenses(updatedExpenses);
        }
        setIsDrawerOpen(false)
    }

    return (
        <>
            <ExpensesTab expenses={filteredExpenses} onExpenseClick={handleExpenseClick}/>
            <ExpenseDrawer
                selectedExpense={selectedExpense}
                setSelectedExpense={setSelectedExpense}
                isDrawerOpen={isDrawerOpen}
                isEditMode={true}
                handleCloseDrawer={handleCloseDrawer}
                members={members}
            />
        </>
    );
};

export default TransactionsPage;
