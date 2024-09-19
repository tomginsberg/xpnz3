// app/[ledger]/members/page.jsx

'use client';

import React, {useContext} from 'react';
import {LedgerDataContext} from '../ledger-layout';

const MembersPage = () => {
    const {ledgerData} = useContext(LedgerDataContext);
    const {balances} = ledgerData;

    return (
        <div>
            <h2>Members</h2>
            <hr className="py-2"/>
            {Object.entries(balances).map(([member, balance]) => (
                <div key={member} className="card">
                    <h3>{member}</h3>
                    <p>Balance: {balance.toFixed(2)}</p>
                    <hr/>
                </div>
            ))}
        </div>
    );
};

export default MembersPage;
