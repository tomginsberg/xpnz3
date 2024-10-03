// App.jsx
import {useEffect, useState} from 'react';
import {BrowserRouter as Router, Routes, Route, useParams, useResolvedPath, useLocation, Navigate} from 'react-router-dom';
import Toolbar from '@/components/toolbar';
import Topbar from '@/components/topbar';
import ExpensesTab from '@/pages/expenses';
import MembersTab from '@/pages/members'; // Dummy component
import DebtsTab from '@/pages/debts';     // Dummy component
import {ThemeProvider} from '@/components/theme-provider';
import {generateRandomLedgerData} from '@/api/get'; // Your random data generator

function FourOhFour() {
  return <h1 className="text-white">404</h1>;
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/trap" />} />
          <Route path="/:ledgerName" element={<LedgerApp target="expenses"/>} />
          <Route path="/:ledgerName/expenses" element={<LedgerApp target="expenses"/>} />
          <Route path="/:ledgerName/members" element={<LedgerApp target="members"/>} />
          <Route path="/:ledgerName/debts" element={<LedgerApp target="debts"/>} />

          <Route path="*" element={<FourOhFour />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

function LedgerApp({target}) {
  const {ledgerName} = useParams();

  const CurrentTab = () => {
    switch (target) {
      case 'expenses':
        return <ExpensesTab ledgerName={ledgerName} expenses={[]}/>;
      case 'members':
        return <MembersTab ledgerName={ledgerName} />;
      case 'debts':
        return <DebtsTab ledgerName={ledgerName} />;
      default:
        return <FourOhFour />;
    }
  };

  return (
    <>
      <Topbar ledger={ledgerName} onSearch={(x) => null} pageType={target}/>
      <CurrentTab />
      <Toolbar ledger={ledgerName} onClickPlus={() => null} />
    </>
  );
}
