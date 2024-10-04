// App.jsx
import {useEffect, useMemo, useState} from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    useParams,
    useResolvedPath,
    useLocation,
    Navigate
} from 'react-router-dom';
import Toolbar from '@/components/toolbar';
import Topbar from '@/components/topbar';
import ExpensesTab from '@/pages/expenses';
import MembersTab from '@/pages/members'; // Dummy component
import DebtsTab from '@/pages/debts';     // Dummy component
import {ThemeProvider} from '@/components/theme-provider';
import {generateRandomLedgerData} from '@/api/get'; // Your random data generator
import {emptyExpense} from "@/api/get";
import ExpenseDrawer from "@/components/expense-drawer.jsx";

function FourOhFour() {
    return <h1 className="text-white">404</h1>;
}

export default function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <Router>
                <Routes>
                    <Route path="/" element={<Navigate to="/trap"/>}/>
                    <Route path="/:ledgerName" element={<LedgerApp target="expenses"/>}/>
                    <Route path="/:ledgerName/expenses" element={<LedgerApp target="expenses"/>}/>
                    <Route path="/:ledgerName/members" element={<LedgerApp target="members"/>}/>
                    <Route path="/:ledgerName/debts" element={<LedgerApp target="debts"/>}/>

                    <Route path="*" element={<FourOhFour/>}/>
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

import Fuse from 'fuse.js';
import useTransaction from "@/hooks/useTransaction.js";

function LedgerApp({target}) {
    const {ledgerName} = useParams();
    const ledgerData = generateRandomLedgerData(50);
    const [members, setMembers] = useState(Object.keys(ledgerData.balances));
    const [expenses, setExpenses] = useState(ledgerData.expenses);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredExpenses, setFilteredExpenses] = useState([])

    const {
        isDrawerOpen,
        isEditMode,
        selectedExpense,
        openAddExpenseDrawer,
        openEditExpenseDrawer,
        closeExpenseDrawer,
    } = useTransaction();


    const fuse = useMemo(() => new Fuse(expenses, {
        keys: ['name', 'category'],
        threshold: 0.1,
    }), [expenses]);

    useEffect(() => {
        if (searchTerm) {
            const results = fuse.search(searchTerm);
            setFilteredExpenses(results.map(result => result.item));
        } else {
            setFilteredExpenses(expenses);
        }
    }, [searchTerm, fuse, expenses]);

    const CurrentTab = () => {
        switch (target) {
            case 'expenses':
                return <ExpensesTab
                    ledgerName={ledgerName}
                    expenses={filteredExpenses}
                    setExpenses={setExpenses}
                    openEditDrawer={openEditExpenseDrawer}
                />;
            case 'members':
                return <MembersTab ledgerName={ledgerName}/>;
            case 'debts':
                return <DebtsTab ledgerName={ledgerName}/>;
            default:
                return <FourOhFour/>;
        }
    };

    return (
        <>
            <Topbar ledger={ledgerName} onSearch={setSearchTerm} pageType={target}/>
            <CurrentTab/>
            <Toolbar ledger={ledgerName} onClickPlus={openAddExpenseDrawer}/>
            {isDrawerOpen && (
                <ExpenseDrawer
                    selectedExpense={selectedExpense}
                    isEditMode={isEditMode}
                    isDrawerOpen={isDrawerOpen}
                    handleCloseDrawer={closeExpenseDrawer}
                    members={members}
                    setExpenses={setExpenses}
                />
            )}
        </>
    );
}
