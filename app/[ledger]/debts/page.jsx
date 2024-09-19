// app/[ledger]/debts/page.jsx

'use client';

import React, { useContext } from 'react';
import { LedgerDataContext } from '../ledger-layout';

const DebtsPage = () => {
    const { ledgerData } = useContext(LedgerDataContext);
    const { debts } = ledgerData;

    return (
        <div>
            <h2>Debts</h2>
            <hr className="py-2"/>
            {debts.map((debt, index) => (
                <div key={index} className="card">
                    <p>
                        {debt[0]} owes {debt[1]}: {debt[2].toFixed(2)}
                    </p>
                    <hr/>
                </div>
            ))}
        </div>
    );
};

export default DebtsPage;
