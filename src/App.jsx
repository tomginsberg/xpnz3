// App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, Navigate } from 'react-router-dom';
import Toolbar from '@/components/toolbar';
import Topbar from '@/components/topbar';
import ExpensesTab from '@/pages/expenses';
import MembersTab from '@/pages/members'; // Dummy component
import DebtsTab from '@/pages/debts';     // Dummy component
import { ThemeProvider } from '@/components/theme-provider';
import { generateRandomLedgerData } from '@/api/get'; // Your random data generator

export default function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <Router>
                <Routes>
                    {/* Redirect root to a default ledger or a selection page */}
                    <Route path="/" element={<Navigate to="/defaultLedger" />} />

                    {/* Ledger Routes */}
                    <Route path="/:ledgerName/*" element={<LedgerApp />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

function LedgerApp() {
    const { ledgerName } = useParams();
    const [expenses, setExpenses] = useState([]);

    // Fetch random expenses for the given ledgerName
    useEffect(() => {
        const { expenses } = generateRandomLedgerData(10); // Simulate API call to get expenses
        setExpenses(expenses);
    }, [ledgerName]);

    return (
        <>
            <Topbar ledger={ledgerName} onSearch={(x) => null} />
            <Content ledgerName={ledgerName} expenses={expenses} />
            <Toolbar ledger={ledgerName} onClickPlus={() => null} />
        </>
    );
}

function Content({ ledgerName, expenses }) {
    return (
        <Routes>
            <Route path="/" element={<ExpensesTab ledgerName={ledgerName} expenses={expenses} />} />
            <Route path="members" element={<MembersTab ledgerName={ledgerName} />} />
            <Route path="debts" element={<DebtsTab ledgerName={ledgerName} />} />
            {/* Handle 404 */}
            <Route path="*" element={<div className="mt-[70px]">Page Not Found</div>} />
        </Routes>
    );
}
