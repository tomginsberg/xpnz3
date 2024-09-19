// app/[ledger]/page.jsx

"use client"

import React, { useContext } from 'react';
import { LedgerDataContext } from './ledger-layout';

const TransactionsPage = () => {
    const { ledgerData } = useContext(LedgerDataContext);
    const { expenses } = ledgerData;

    return (
        <div>
            <h2>Transactions</h2>
            <hr className="py-2"/>
            {expenses.map((expense) => (
                <div key={expense.id} className="card">
                    <h3>{expense.name}</h3>
                    <p>Date: {expense.date}</p>
                    <p>Amount: {expense.amount}</p>
                    <hr />
                </div>
            ))}
        </div>
    );
};

export default TransactionsPage;
