// app/[ledger]/members/page.jsx

"use client";

import {useParams} from 'next/navigation';
import {useState, useEffect} from 'react';
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
          { /* <Button variant="outline" size="icon" className="mx-1" onClick={() => onEdit && onEdit(member)}>
            <UserRoundPen className="text-gray-700 dark:text-gray-200"/>
          </Button> */ }
          <TooltipProvider><Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-block mx-1">
                <Button variant="destructive" size="icon" disabled={member.balance !== 0} onClick={() => onDelete && onDelete(member)}>
                  <UserRoundX />
                </Button>
              </div>
            </TooltipTrigger>
            {member.balance !== 0 && <TooltipContent>
              <p>Balance must be zero.</p>
            </TooltipContent>}
          </Tooltip></TooltipProvider>
        </div>
      </div>
  );
}

// relies on animate-blink defined in tailwind.config.js
const FakeCursor = () => (<span className="absolute focus:hidden peer-focus:hidden flex top-[0.3rem] left-0 h-[1.6rem] w-px bg-white animate-blink"></span>);

function MembersAdd(props) {
  const {onAdd, placeholder, existingMembers} = props;
  const [name, setName] = useState('');

  const isDuplicate = existingMembers ? existingMembers.includes(name.trim()) : false;

  const handleAdd = (e) => {
    e.preventDefault();
    onAdd && onAdd(name);
    setName('');
  };

  return (
    <form onSubmit={handleAdd}>
      <div
        className={`flex flex-row justify-between my-3 rounded-lg bg-card px-4 py-2 relative
          ${isDuplicate ? 'ring-1 ring-red-500' : ''}`}
      >
        <div className="relative flex-1">
          <Input
            className="bg-card shadow-none focus-visible:ring-0 peer text-gray-900 dark:text-white focus-visible:ring-transparent border-none px-0 py-0 focus-visible:ring-offset-0 ring-0 text-2xl font-bold w-full"
            placeholder={placeholder}
            onChange={(e) => setName(e.target.value)}
            value={name}
          />
        </div>
        <div className="flex items-center">
          <Button variant="outline" size="icon" className="mx-1" disabled={!name.trim() || isDuplicate} type="submit">
            <UserRoundPlus className="text-gray-700 dark:text-gray-200"/>
          </Button>
        </div>
      </div>
    </form>
  );
}

async function fetchMembers(ledger) {
  return await fetch(`http://localhost:3001/ledgers/${encodeURIComponent(ledger)}/balance`, {cache: "no-store"}).then(r => r.json()).catch(console.error);
}

export default function MembersPage() {
  const {ledger} = useParams();
  const [members, setMembers] = useState([]);

  useEffect(() => {
    fetchMembers(ledger).then(setMembers);
  }, [ledger]);

  function onAdd(name) {
    const encodedName = encodeURIComponent(name);
    const encodedLedger = encodeURIComponent(ledger);

    fetch(`http://localhost:3001/members/${encodedLedger}/${encodedName}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: '{}',
    }).then(() => fetchMembers(ledger).then(setMembers));
  }

  function onDelete({name}) {
    const encodedName = encodeURIComponent(name);
    const encodedLedger = encodeURIComponent(ledger);

    fetch(`http://localhost:3001/members/${encodedLedger}/${encodedName}`, {
      method: 'DELETE'
    }).then(() => fetchMembers(ledger).then(setMembers));
  }

  const MembersRows = () => members.map((member) => (
    <MembersRow key={member.name} member={member} onDelete={onDelete} />
  ));

  return (
    <div className="mt-[70px]">
      <MembersAdd placeholder="Who's the new guy?" onAdd={onAdd} existingMembers={members.map(m => m.name)}/>
      <MembersRows />
    </div>
  );
};
