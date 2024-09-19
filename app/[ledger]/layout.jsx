// app/[ledger]/layout.tsx

import LedgerLayout from './ledger-layout';
import { generateRandomLedgerData } from '../../api/get';

export default function Layout({ children, params }) {
    const { ledger } = params;
    const initialData = generateRandomLedgerData(200); // Fetch 200 expenses

    return (
        <LedgerLayout ledger={ledger} initialData={initialData}>
            {children}
        </LedgerLayout>
    );
}
