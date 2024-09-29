// app/[ledger]/debts/page.jsx

'use client';

import React, { useContext } from 'react';
import { LedgerDataContext } from '../ledger-layout';

function DebtsRow(props) {
  const {payer, payee, amount} = props;
    
  return (
    <div className="flex flex-row justify-between my-3 rounded-lg bg-card px-4 py-3">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {payer} → {payee}
          <p className="mt-1 text-sm font-normal tracking-tight text-gray-700 dark:text-gray-400">
            ${amount}
          </p>
        </h2>
      </div>
    </div>
  );
}

export default function DebtsPage() {
    const { ledgerData } = useContext(LedgerDataContext);
    const { debts } = ledgerData;

    const DebtsRows = () => debts.map(({payer, payee, amount}) => (
      <DebtsRow key={`${payer}:${payee}`} payer={payer} payee={payee} amount={amount} />
    ));

    return (
      <div className="mt-[70px]">
        <DebtsRows />
      </div>
    );
};
