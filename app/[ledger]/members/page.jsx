// app/[ledger]/members/page.jsx

'use client';

import React, {useContext} from 'react';
import {LedgerDataContext} from '../ledger-layout';

const MembersPage = () => {
    const {ledgerData} = useContext(LedgerDataContext);
    const {balances} = ledgerData;

    function getMemberOwingString(balance) {
        if (balance > 0) {
            return "↑ $" + balance;
        } else if (balance < 0) {
            return "↓ $" + Math.abs(balance);
        } else {
            return "✓ settled up";
        }
    }

    return (
        <div className="mt-[70px]">
            {balances.map(({name, balance}) => (
                <div key={name} className="flex flex-row justify-between my-3 rounded-lg bg-card p-4">
                    <div>
                        <h2
                            className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
                        >
                            {name}
                        </h2>
                        <p
                            className="mt-1 font-normal tracking-tight text-gray-700 dark:text-gray-400"
                        >
                            {getMemberOwingString(balance)}
                        </p>
                    </div>

                    <div>
                        <button
                        // onClick="openEditMemberDialog(member[0])"
                        className="rounded-lg bg-gray-200 p-2 shadow-lg hover:bg-blue-500 focus:outline-none focus:ring-4
                        focus:ring-blue-300 dark:bg-gray-700 dark:text-white dark:hover:bg-blue-600"
                        >
                        <svg
                            className="h-6 w-6 text-gray-800 dark:text-white"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <path
                                stroke="currentColor"
                                strokeLinecap="square"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M7 19H5a1 1 0 0 1-1-1v-1a3 3 0 0 1 3-3h1m4-6a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm7.441 1.559a1.907 1.907 0 0 1 0 2.698l-6.069 6.069L10 19l.674-3.372 6.07-6.07a1.907 1.907 0 0 1 2.697 0Z"
                            />
                        </svg>
                    </button>
                </div>
                </div>
                )
            )
            }
</div>
)
;
}
;

export default MembersPage;
