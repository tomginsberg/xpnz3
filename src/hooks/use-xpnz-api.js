import { useState, useEffect, useCallback, useMemo } from "react"

import { uniq } from "lodash-es"

import { api } from "@/../xpnz.config.js"

export function useExpenses(ledger) {
  const [members, setMembers] = useState([])
  const [expenses, setExpenses] = useState([])

  const apiGetExpenses = async () => {
    console.log("fetching expenses")
    const response = await fetch(`${api.base}/transactions?ledger=${ledger}`, { cache: "no-store" })
    const expenses = await response.json()
    const expensesPlus = expenses.map((expense) => {
      return {
        ...expense,
        income: expense.expense_type === "income",
        paidBy: expense.contributions.map((c) => ({ member: c.member, amount: c.paid })).filter((c) => c.amount > 0),
        splitBetween: expense.contributions
          .map((c) => ({ member: c.member, weight: c.weight, normalizedWeight: c.owes }))
          .filter((c) => c.weight > 0)
      }
    })
    setExpenses(expensesPlus)
  }

  const apiGetMembers = async () => {
    const response = await fetch(`${api.base}/members?ledger=${ledger}`, { cache: "no-store" })
    const members = await response.json()
    setMembers(members)
  }

  useEffect(() => {
    // get current time for logging
    const now = new Date().toISOString()
    const fetchData = async () => {
      try {
        await Promise.all([apiGetMembers(), apiGetExpenses()])
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        // print elapsed time since now in ms
        console.log("fetchData in", new Date().getTime() - new Date(now).getTime(), "ms")
      }
    }

    fetchData()
  }, [ledger])

  const pushMember = async (name) => {
    const member = { name, ledger, is_active: true }

    await fetch(`${api.base}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member)
    })

    await apiGetMembers()
  }

  const editMember = async (id, name) => {
    const member = { name, ledger, is_active: true }

    await fetch(`${api.base}/members/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member)
    })

    await apiGetMembers()
  }

  const deleteMember = async (id) => {
    await fetch(`${api.base}/members/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    })

    await apiGetMembers()
  }

  const pushExpense = async (name, currency, category, date, expense_type, contributions) => {
    // contributions = [{ id, paid, weight }]

    const expense = { name, ledger, currency, category, date, expense_type, contributions }

    await fetch(`${api.base}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expense)
    })

    await apiGetExpenses()
  }

  const editExpense = async (id, name, currency, category, date, expense_type, contributions) => {
    // contributions = [{ id, paid, weight }]

    const expense = { name, ledger, currency, category, date, expense_type, contributions }

    await fetch(`${api.base}/transactions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expense)
    })

    await apiGetExpenses()
  }

  const deleteExpense = async (id) => {
    await fetch(`${api.base}/transactions/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    })

    await apiGetExpenses()
  }

  return {
    expenses,
    members,
    pushMember,
    editMember,
    deleteMember,
    pushExpense,
    editExpense,
    deleteExpense
  }
}

export function useXpnzApi(ledger) {
  const [balance, setBalance] = useState([])
  // const [categories, setCategories] = useState([])
  const [expenses, setExpenses] = useState([])
  const [ledgerInfo, setLedgerInfo] = useState({})
  const [members, setMembers] = useState([])
  const [settlement, setSettlement] = useState([])
  const categories = useMemo(() => uniq(expenses.map((e) => e.category)), [expenses])

  const apiGetBalance = async () => {
    const response = await fetch(`${api.base}/ledgers/${ledger}/balance`, { cache: "no-store" })
    const balance = await response.json()
    setBalance(balance)
  }

  const apiGetExpenses = async () => {
    const response = await fetch(`${api.base}/transactions?ledger=${ledger}`, { cache: "no-store" })
    const expenses = await response.json()
    const expensesPlus = expenses.map((expense) => {
      return {
        ...expense,
        income: expense.expense_type === "income",
        paidBy: expense.contributions.map((c) => ({ member: c.member, amount: c.paid })).filter((c) => c.amount > 0),
        splitBetween: expense.contributions
          .map((c) => ({ member: c.member, weight: c.weight, normalizedWeight: c.owes }))
          .filter((c) => c.weight > 0)
      }
    })
    setExpenses(expensesPlus)
  }

  const apiGetSettlement = async () => {
    const response = await fetch(`${api.base}/ledgers/${ledger}/settlement`, { cache: "no-store" })
    const settlement = await response.json()
    setSettlement(settlement)
  }

  const apiGetMembers = async () => {
    const response = await fetch(`${api.base}/members?ledger=${ledger}`, { cache: "no-store" })
    const members = await response.json()
    setMembers(members)
  }

  const apiGetLedgerInfo = async () => {
    const response = await fetch(`${api.base}/ledgers/${ledger}`, { cache: "no-store" })
    const ledgerInfo = await response.json()
    setLedgerInfo(ledgerInfo)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data concurrently
        await Promise.all([apiGetMembers(), apiGetExpenses(), apiGetBalance(), apiGetSettlement(), apiGetLedgerInfo()])
      } catch (error) {
        console.error("Failed to fetch data:", error)
      }
    }

    fetchData() // Call the async function immediately
  }, [ledger])

  // useEffect(() => {
  //   const categories = uniq(expenses.map((e) => e.category))
  //   setCategories(categories)
  // }, [expenses])

  const pushMember = useCallback(
    async (name) => {
      const member = { name, ledger, is_active: true }

      await fetch(`${api.base}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member)
      })

      await apiGetMembers()
      await apiGetBalance()
    },
    [ledger, apiGetMembers, apiGetBalance]
  )

  const editMember = useCallback(
    async (id, name) => {
      const member = { name, ledger, is_active: true }

      await fetch(`${api.base}/members/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member)
      })

      await apiGetMembers()
      await apiGetBalance()
      await apiGetSettlement()
    },
    [ledger, apiGetMembers, apiGetBalance, apiGetSettlement]
  )

  const deleteMember = useCallback(
    async (id) => {
      await fetch(`${api.base}/members/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      })

      await apiGetMembers()
      await apiGetBalance()
    },
    [ledger, apiGetMembers, apiGetBalance]
  )

  const pushExpense = useCallback(
    async (name, currency, category, date, expense_type, contributions) => {
      // contributions = [{ id, paid, weight }]

      const expense = { name, ledger, currency, category, date, expense_type, contributions }

      await fetch(`${api.base}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense)
      })

      await apiGetExpenses()
      await apiGetBalance()
      await apiGetSettlement()
    },
    [ledger, apiGetExpenses, apiGetBalance, apiGetSettlement]
  )

  const editExpense = useCallback(
    async (id, name, currency, category, date, expense_type, contributions) => {
      // contributions = [{ id, paid, weight }]

      const expense = { name, ledger, currency, category, date, expense_type, contributions }

      await fetch(`${api.base}/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense)
      })

      await apiGetExpenses()
      await apiGetBalance()
      await apiGetSettlement()
    },
    [ledger, apiGetExpenses, apiGetBalance, apiGetSettlement]
  )

  const deleteExpense = useCallback(
    async (id) => {
      await fetch(`${api.base}/transactions/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      })

      await apiGetExpenses()
      await apiGetBalance()
      await apiGetSettlement()
    },
    [ledger, apiGetExpenses, apiGetBalance, apiGetSettlement]
  )

  return {
    balance,
    categories,
    expenses,
    ledgerInfo,
    members,
    settlement,
    pushMember,
    editMember,
    deleteMember,
    pushExpense,
    editExpense,
    deleteExpense
  }
}
