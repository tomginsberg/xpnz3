// app/[ledger]/members/page.jsx

"use client";

import {useParams} from 'next/navigation';
import {useState, useEffect, useRef} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {UserRoundCheck, UserRoundPen, UserRoundX, UserRoundPlus} from 'lucide-react';

import {api} from '@/app/config';

function MembersRow(props) {
  const {member, onSubmit, onDelete} = props;
  const {name, balance, paid} = member;

  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(name);

  const inputRef = useRef(null);

  const balanceString = `$${Math.abs(balance).toLocaleString()}`;
  const paidString = `$${Math.abs(paid).toLocaleString()}`;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Optionally, move the cursor to the end
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, [isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isEditing) {
      onSubmit && await onSubmit(member, newName);
      setNewName(name);
    }

    setIsEditing(!isEditing);
  };

  return (
  <div className="flex items-center my-3 rounded-lg bg-card px-4 py-3">
    <form className="flex-1 flex items-center" onSubmit={handleSubmit}>
      <div className="flex-1">
        {isEditing ? (
        <Input
          className="bg-card tracking-tight shadow-none focus-visible:ring-0 text-gray-900 dark:text-white border-none p-0 ring-0 text-2xl font-bold w-full"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          ref={inputRef}
        />
        ) : (
        <h2 className="flex-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white py-[2px]">{name}</h2>)}
        <p className="mt-1 font-normal tracking-tight text-gray-700 dark:text-gray-400">
          {balance === 0 ? '✓ settled up' : balance > 0 ? `↑ ${balanceString}` : `↓ ${balanceString}`}
          {' • '}
          {`${paidString} all time`}
        </p>
      </div>
      <Button variant="outline" size="icon" className="mx-1">
        {isEditing ? (<UserRoundCheck className="text-gray-700 dark:text-gray-200" />) : (<UserRoundPen className="text-gray-700 dark:text-gray-200" />)}
      </Button>
    </form>
    <TooltipProvider><Tooltip>
      <TooltipTrigger asChild>
        <div className="inline-block mx-1">
          <Button variant="destructive" size="icon" disabled={member.balance !== 0} onClick={async () => onDelete && await onDelete(member)}>
            <UserRoundX />
          </Button>
        </div>
      </TooltipTrigger>
      {member.balance !== 0 && <TooltipContent>
        <p>Balance must be zero.</p>
      </TooltipContent>}
    </Tooltip></TooltipProvider>
  </div>
  );
}

// relies on animate-blink defined in tailwind.config.js
const FakeCursor = () => (<span className="absolute focus:hidden peer-focus:hidden flex top-[0.3rem] left-0 h-[1.6rem] w-px bg-white animate-blink"></span>);

function MembersAdd(props) {
  const {onAdd, placeholder, existingMembers} = props;
  const [name, setName] = useState('');

  const isDuplicate = existingMembers ? existingMembers.includes(name.trim()) : false;

  const handleAdd = async (e) => {
    e.preventDefault();
    onAdd && await onAdd(name);
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
  return await fetch(`${api.base}/ledgers/${encodeURIComponent(ledger)}/balance`, {cache: "no-store"}).then(r => r.json()).catch(console.error);
}

export default function MembersPage() {
  const {ledger} = useParams();
  const [members, setMembers] = useState([]);

  useEffect(() => {
    fetchMembers(ledger).then(setMembers);
  }, [ledger]);

  async function onAdd(name) {
    const newMember = { name, ledger, is_active: true };

    await fetch(`${api.base}/members`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(newMember)
    }).then(() => fetchMembers(ledger).then(setMembers));
  }

  async function onDelete({id}) {
    await fetch(`${api.base}/members/${id}`, {
      method: 'DELETE'
    }).then(() => fetchMembers(ledger).then(setMembers));
  }

  async function onSubmit(member, newName) {
    if (member.name === newName) return;

    const updatedMember = { name: newName, ledger, is_active: true };

    await fetch(`${api.base}/members/${member.id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(updatedMember)
    }).then(() => fetchMembers(ledger).then(setMembers));
  }

  const MembersRows = () => members ? members.map((member) => (
    <MembersRow key={member.id} member={member} onDelete={onDelete} onSubmit={onSubmit} />
  )) : null;

  return (
    <div className="mt-[70px]">
      <MembersAdd placeholder="Who's the new guy?" onAdd={onAdd} existingMembers={members ? members.map(m => m.name) : []}/>
      <MembersRows />
    </div>
  );
};
