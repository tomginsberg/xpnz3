// app/[ledger]/members/page.jsx

"use client";

import {useContext} from 'react';
import {LedgerDataContext} from '../ledger-layout';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {UserRoundPen, UserRoundX, UserRoundPlus} from 'lucide-react';

function MembersRow(props) {
  const {member, onEdit, onDelete} = props;
  const {name, balance, paid} = member;

  const balanceString = `$${Math.abs(balance).toLocaleString()}`;
  const paidString = `$${Math.abs(paid).toLocaleString()}`;

  return (
      <div className="flex flex-row justify-between my-3 rounded-lg bg-card px-4 py-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{name}</h2>
          <p className="mt-1 font-normal tracking-tight text-gray-700 dark:text-gray-400">
            {balance === 0 ? '✓ settled up' : balance > 0 ? `↑ ${balanceString}` : `↓ ${balanceString}`}
            {' • '}
            {`${paidString} all time`}
          </p>
        </div>

        <div className="flex items-center">
          <Button variant="outline" size="icon" className="mx-1">
            <UserRoundPen className="text-gray-700 dark:text-gray-200"/>
          </Button>
          <TooltipProvider><Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-block mx-1">
                <Button variant="destructive" size="icon" disabled={member.balance !== 0}>
                  <UserRoundX />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              (member.balance !== 0) && <p>Balance must be zero.</p>
            </TooltipContent>
          </Tooltip></TooltipProvider>
        </div>
      </div>
  );
}

// relies on animate-blink defined in tailwind.config.js
const FakeCursor = () => (<span className="absolute focus:hidden peer-focus:hidden flex top-[0.3rem] left-0 h-[1.6rem] w-px bg-white animate-blink"></span>);

function MembersAdd(props) {
  const {onAdd, placeholder} = props;

  return (
    <div className="flex flex-row justify-between my-3 rounded-lg bg-card px-4 py-2 relative">
      <div className="relative flex-1">
        <Input
          className="bg-card shadow-none focus-visible:ring-0 peer text-gray-900 dark:text-white focus-visible:ring-transparent border-none px-0 py-0 focus-visible:ring-offset-0 ring-0 text-2xl font-bold w-full"
          placeholder={placeholder}
        />
      </div>
      <div className="flex items-center">
        <Button variant="outline" size="icon" className="mx-1">
          <UserRoundPlus className="text-gray-700 dark:text-gray-200"/>
        </Button>
      </div>
    </div>
  );
}

export default function MembersPage() {
  const {ledgerData} = useContext(LedgerDataContext);
  const {balances} = ledgerData;

  const MembersRows = () => balances.map((member) => (
    <MembersRow key={member.name} member={member} />
  ));

  return (
    <div className="mt-[70px]">
      <MembersAdd placeholder="Who's the new guy?" onAdd={() => {}} />
      <MembersRows />
    </div>
  );
};
