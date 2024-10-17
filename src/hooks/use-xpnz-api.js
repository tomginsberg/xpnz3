import { useState, useEffect } from 'react';

import { uniq } from 'lodash-es';

import { api } from '@/../xpnz.config.js';

export function useXpnzApi(ledger) {
  const [balance, setBalance] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [ledgerInfo, setLedgerInfo] = useState({});
  const [members, setMembers]  = useState([]);
  const [settlement, setSettlement] = useState([]);

  const apiGetBalance = async () => {
    const response = await fetch(`${api.base}/ledgers/${ledger}/balance`, { cache: 'no-store' });
    const balance = await response.json();
    setBalance(balance);
  }

  const apiGetExpenses = async () => {
    const response = await fetch(`${api.base}/transactions?ledger=${ledger}`, { cache: 'no-store' })
    const expenses = await response.json();
    const expensesPlus = expenses.map(expense => { 
      return { 
        ...expense,
        income: expense.expense_type === 'income',
        paidBy: expense.contributions.map((c) => ({ member: c.member, amount: c.paid })).filter((c) => c.amount > 0),
        splitBetween: expense.contributions.map((c) => ({ member: c.member, weight: c.weight, normalizedWeight: c.owes })).filter((c) => c.weight > 0)
      }
    });
    setExpenses(expensesPlus);
  }

  const apiGetSettlement = async () => {
    const response = await fetch(`${api.base}/ledgers/${ledger}/settlement`, { cache: 'no-store' });
    const settlement = await response.json();
    setSettlement(settlement);
  }

  const apiGetMembers = async () => {
    const response = await fetch(`${api.base}/members?ledger=${ledger}`, { cache: 'no-store' });
    const members = await response.json();
    setMembers(members);
  }

  const apiGetLedgerInfo = async () => {
    const response = await fetch(`${api.base}/ledgers/${ledger}`, { cache: 'no-store' });
    const ledgerInfo = await response.json();
    setLedgerInfo(ledgerInfo);
  }

  useEffect(() => {
    apiGetBalance();
  }, [ledger, members, expenses]);

  useEffect(() => {
    apiGetExpenses();
  }, [ledger, members]);

  useEffect(() => {
    apiGetSettlement();
  }, [ledger, members, expenses]);

  useEffect(() => {
    apiGetMembers();
  }, [ledger]);

  useEffect(() => {
    apiGetLedgerInfo();
  }, [ledger]);

  useEffect(() => {
    const categories = uniq (expenses.map((e) => e.category));
    setCategories(categories);
  }, [expenses]);

  
  const pushMember = async (name) => {
    const member = { name, ledger, is_active: true };
    
    await fetch(`${api.base}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member)
    });

    apiGetMembers();
  }

  const editMember = async (id, name) => {
    const member = { name, ledger, is_active: true };
   
    await fetch(`${api.base}/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member)
    });

    apiGetMembers();
  }

  const deleteMember = async (id) => {
    await fetch(`${api.base}/members/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
  }


  return {
    balance,
    categories,
    expenses,
    ledgerInfo,
    members,
    settlement,
    pushMember,
    editMember,
    deleteMember
  };
}
