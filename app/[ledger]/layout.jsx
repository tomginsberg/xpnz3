// app/[ledger]/layout.tsx

import LedgerLayout from './ledger-layout';
import { getExpenses } from '../../api/get';

export default async function Layout({ children, params }) {
    const { ledger } = params;
    const initialData = await getExpenses ('trap2');

    return (
        <LedgerLayout ledger={ledger} initialData={initialData}>
            {children}
        </LedgerLayout>
    );
}
