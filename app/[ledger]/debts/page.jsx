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
            {debts.map(({payer, payee, amount}) => (
                <div key={payer + ':' + payee} className="card">
                    <p>
                        {payer} owes {payee}: {amount}
                    </p>
                    <hr/>
                </div>
            ))}
        </div>
    );
};

export default DebtsPage;
