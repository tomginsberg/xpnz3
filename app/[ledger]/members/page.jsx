// app/[ledger]/members/page.jsx

'use client';

import {useContext, useState} from 'react';
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


const MembersPage = () => {
  const {ledgerData} = useContext(LedgerDataContext);
  const {balances} = ledgerData;
  const [newMember, setNewMember] = useState("");

  function makeMemberRow(member) {
    const {name, balance} = member;

    return (
        <div key={name} className="flex flex-row justify-between my-3 rounded-lg bg-card px-4 py-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {name}
            </h2>
            <p className="mt-1 font-normal tracking-tight text-gray-700 dark:text-gray-400">
              {balance === 0 ? "✓ settled up" : `${balance > 0 ? "↑" : "↓"} $${Math.abs(balance)}`}
              {" | "}
              {`$${member.paid} all time`}
            </p>
          </div>

          <div className="flex items-center">
            <Button variant="outline" size="icon" className="mx-1">
              <UserRoundPen className="text-gray-700 dark:text-gray-200"/>
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-block mx-1">
                    <Button variant="destructive" size="icon" disabled={member.balance !== 0}>
                      <UserRoundX />
                    </Button>
                  </div>
                </TooltipTrigger>
                { member.balance !== 0 && (
                <TooltipContent>
                  <p>Balance must be zero.</p>
                </TooltipContent> ) }
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
    );
  }

  // TODO: When a new member is added, the "add-member" button should morph into a spinner, then when the new member is added
  // the spinner should shoot off to the right and the new member row should morph into the list.

  return (
    <div className="mt-[70px]">
      <div className="flex flex-row justify-between my-3 rounded-lg bg-card px-4 py-2 relative">
        <div className="relative flex-1">
          <Input
            className="bg-card focus-visible:ring-0 peer focus-visible:ring-transparent border-none px-0 py-0 focus-visible:ring-offset-0 ring-0 text-2xl font-bold w-full"
            onChange={(e) => setNewMember(e.target.value)}
          />
          {/* Fake Cursor Indicator */
            newMember.length === 0 && (<span className="absolute focus:hidden peer-focus:hidden flex top-[0.3rem] left-0 h-[1.6rem] w-px bg-white animate-blink"></span>)
          }
        </div>
        <div className="flex items-center">
          <Button variant="outline" size="icon" className="mx-1">
            <UserRoundPlus className="text-gray-700 dark:text-gray-200"/>
          </Button>
        </div>
      </div>
      {balances.map(makeMemberRow)}
    </div>
  );
};

export default MembersPage;
