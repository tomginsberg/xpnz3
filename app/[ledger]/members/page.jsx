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
            {balances.map(({name, balance}) => (
                <div key={name} className="card">
                    <h3>{name}</h3>
                    <p>Balance: {balance}</p>
                    <hr/>
                </div>
            ))}
        </div>
    );
};

export default MembersPage;
