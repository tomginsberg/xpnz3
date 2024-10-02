import React, {useState, useEffect} from 'react';
import Toolbar from '@/components/toolbar';
import Topbar from '@/components/topbar';

import ExpensesTab from "@/pages/expenses";
import {generateRandomLedgerData} from "@/api/get.js";
import { ThemeProvider } from "@/components/theme-provider"
import { BrowserRouter as Router, Routes, Route, useParams, useLocation } from 'react-router-dom';

export default function App() {
    const [ledgerName, setLedgerName] = useState(() => {
        const pathParts = window.location.pathname.split('/');
        return pathParts[1] || 'defaultLedger';
    });

    const [expenses, setExpenses] = useState(generateRandomLedgerData(20)['expenses']);

    const [route, setRoute] = useState<String>(() => window.location.hash.replace('#', '') || '');

    useEffect(() => {
        const handleLocationChange = () => {
            const pathParts = window.location.pathname.split('/');
            setLedgerName(pathParts[1] || 'defaultLedger');
            setRoute(window.location.hash.replace('#', '') || '');
        };

        window.addEventListener('popstate', handleLocationChange);
        window.addEventListener('hashchange', handleLocationChange);

        return () => {
            window.removeEventListener('popstate', handleLocationChange);
            window.removeEventListener('hashchange', handleLocationChange);
        };
    }, []);

    // Update the URL when route changes
    useEffect(() => {
        const url = route ? `/${ledgerName}/#${route}` : `/${ledgerName}`;
        window.history.pushState({}, '', url);
    }, [route, ledgerName]);

    // Fetch data when ledgerName or route changes
    useEffect(() => {
        // Fetch ledger data using ledgerName
        // Fetch data based on route
    }, [ledgerName, route]);


    // Determine which component to render based on the route
    const renderContent = () => {
        switch (route) {
            case 'members':
                return <div className="mt-[700px]">Members</div>;
            case 'debts':
                return <div className="mt-[700px]">Debts</div>;
            default:
                return <ExpensesTab expenses={expenses} onExpenseClick={() => null}/>;
        }
    };

    return (
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <Topbar ledger={"test"} route={route} onSearch={(x) => null}/>
            {renderContent()}
            <Toolbar onClickPlus={() => null}
                     ledger={ledgerName}
                     activeTab={route}
                     onTabClick={setRoute}
            />
        </ThemeProvider>
    );
}
