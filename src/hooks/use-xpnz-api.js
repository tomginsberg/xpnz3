import { useState, useEffect, useCallback, useMemo } from "react"

import { api } from "@/../xpnz.config.js"

export function useXpnzApi(ledger) {
  const [loaded, setLoaded] = useState(false)
  const [balance, setBalance] = useState([])
  const [categories, setCategories] = useState([])
  const [expenses, setExpenses] = useState([])
  const [ledgerInfo, setLedgerInfo] = useState({})
  const [members, setMembers] = useState([])
  const [settlement, setSettlement] = useState([])
  
  // Memoize API fetching functions to prevent recreating them on each render
  const apiGetCategories = useCallback(async () => {
    const response = await fetch(`${api.base}/ledgers/${ledger}/categories`, { cache: "no-store" })
    setCategories(await response.json())
  }, [ledger])

  const apiGetBalance = useCallback(async () => {
    const response = await fetch(`${api.base}/ledgers/${ledger}/balance`, { cache: "no-store" })
    setBalance(await response.json())
  }, [ledger])

  const apiGetExpenses = useCallback(async () => {
    // Fetch without useExchangeRates to preserve original currency amounts
    const response = await fetch(`${api.base}/transactions?ledger=${ledger}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json"
      }
    })
    const expenses = await response.json()
    const expensesPlus = expenses.map((expense) => {
      return {
        ...expense,
        income: expense.expense_type === "income",
        // For chart display, convert if exchange rate is available
        displayAmount: expense.exchange_rate ? expense.amount * expense.exchange_rate : expense.amount,
        paidBy: expense.contributions
          .map((c) => ({
            member: c.name || c.member,
            amount: c.paid
          }))
          .filter((c) => c.amount > 0),
        splitBetween: expense.contributions
          .map((c) => ({ member: c.name || c.member, weight: c.weight, amount: c.owes }))
          .filter((c) => c.weight > 0)
      }
    })
    setExpenses(expensesPlus)
  }, [ledger])

  const apiGetSettlement = useCallback(async () => {
    const response = await fetch(`${api.base}/ledgers/${ledger}/settlement`, { cache: "no-store" })
    const settlement = await response.json()
    setSettlement(settlement)
  }, [ledger])

  const apiGetMembers = useCallback(async () => {
    const response = await fetch(`${api.base}/members?ledger=${ledger}`, { cache: "no-store" })
    const members = await response.json()
    setMembers(members)
  }, [ledger])

  const apiGetLedgerInfo = useCallback(async () => {
    const response = await fetch(`${api.base}/ledgers/${ledger}`, { cache: "no-store" })
    const ledgerInfo = await response.json()
    setLedgerInfo(ledgerInfo)
  }, [ledger])

  // Memoize the fetchData function to prevent recreation on renders
  const fetchData = useCallback(async () => {
    setLoaded(false)
    try {
      // Fetch all data concurrently
      await Promise.all([
        apiGetMembers(),
        apiGetExpenses(),
        apiGetBalance(),
        apiGetSettlement(),
        apiGetLedgerInfo(),
        apiGetCategories()
      ])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    }
    setLoaded(true)
  }, [apiGetMembers, apiGetExpenses, apiGetBalance, apiGetSettlement, apiGetLedgerInfo, apiGetCategories])

  useEffect(() => {
    fetchData() // Call the async function immediately
  }, [fetchData])

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
    [apiGetMembers, apiGetBalance, ledger]
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
      await apiGetExpenses()
    },
    [apiGetMembers, apiGetBalance, apiGetSettlement, apiGetExpenses, ledger]
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
    [apiGetMembers, apiGetBalance]
  )

  const pushExpense = useCallback(
    async (name, currency, category, date, expense_type, contributions) => {
      // contributions = [{ id, paid, weight }]

      const expense = {
        name,
        ledger,
        currency,
        category,
        date,
        expense_type,
        contributions
      }

      await fetch(`${api.base}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense)
      })

      await apiGetExpenses()
      await apiGetBalance()
      await apiGetSettlement()
      await apiGetCategories()
    },
    [apiGetExpenses, apiGetBalance, apiGetSettlement, apiGetCategories, ledger]
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
      await apiGetCategories()
    },
    [apiGetExpenses, apiGetBalance, apiGetSettlement, apiGetCategories, ledger]
  )

  const deleteExpense = useCallback(
    async (id) => {
      await fetch(`${api.base}/transactions/${id}?ledger=${ledger}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: "{}"
      })

      await apiGetExpenses()
      await apiGetBalance()
      await apiGetSettlement()
      await apiGetCategories()
    },
    [apiGetExpenses, apiGetBalance, apiGetSettlement, apiGetCategories, ledger]
  )

  // Memoize any derived data to prevent recalculation on each render
  const memberNames = useMemo(() => 
    members.map((member) => member.name),
  [members])

  return {
    balance,
    categories,
    expenses,
    ledgerInfo,
    members,
    memberNames, // Return the memoized member names
    settlement,
    pushMember,
    editMember,
    deleteMember,
    pushExpense,
    editExpense,
    deleteExpense,
    loaded,
    refreshData: fetchData // Export refresh function for manual refreshes
  }
}
