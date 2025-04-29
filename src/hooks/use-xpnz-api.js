import { useState, useEffect, useCallback, useMemo } from "react"

import { api } from "@/../xpnz.config.js"
import * as firebaseServices from "../api/firebase/services.js"

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
    try {
      const categoriesData = await firebaseServices.getCategories(ledger)
      setCategories(categoriesData)
    } catch (error) {
      console.error("Failed to fetch categories:", error)
      setCategories([]) // Set empty array on error
    }
  }, [ledger])

  const apiGetBalance = useCallback(async () => {
    // Balance calculation is complex, still using API for now
    // TODO: This will be migrated to Firebase client in future
    try {
      const response = await fetch(`${api.base}/ledgers/${ledger}/balance`, { cache: "no-store" })
      setBalance(await response.json())
    } catch (error) {
      console.error("Failed to fetch balance:", error)
      setBalance([])
    }
  }, [ledger])

  const apiGetExpenses = useCallback(async () => {
    try {
      const transactions = await firebaseServices.getTransactions(ledger)
      const expensesPlus = transactions.map((expense) => {
        return {
          ...expense,
          income: expense.expense_type === "income",
          // For chart display, convert if exchange rate is available
          displayAmount: expense.exchange_rate ? expense.amount * expense.exchange_rate : expense.amount,
          paidBy: expense.contributions
            .map((c) => ({
              member: c.name,
              amount: c.paid
            }))
            .filter((c) => c.amount > 0),
          splitBetween: expense.contributions
            .map((c) => ({ 
              member: c.name, 
              weight: c.weight, 
              amount: c.owes 
            }))
            .filter((c) => c.weight > 0)
        }
      })
      setExpenses(expensesPlus)
    } catch (error) {
      console.error("Failed to fetch expenses:", error)
      setExpenses([])
    }
  }, [ledger])

  const apiGetSettlement = useCallback(async () => {
    // Settlement calculation is complex, still using API for now
    // TODO: This will be migrated to Firebase client in future
    try {
      const response = await fetch(`${api.base}/ledgers/${ledger}/settlement`, { cache: "no-store" })
      const settlement = await response.json()
      setSettlement(settlement)
    } catch (error) {
      console.error("Failed to fetch settlement:", error)
      setSettlement([])
    }
  }, [ledger])

  const apiGetMembers = useCallback(async () => {
    try {
      const membersData = await firebaseServices.getMembers(ledger)
      setMembers(membersData)
    } catch (error) {
      console.error("Failed to fetch members:", error)
      setMembers([])
    }
  }, [ledger])

  const apiGetLedgerInfo = useCallback(async () => {
    try {
      const ledgerDoc = await firebaseServices.findLedgerByName(ledger)
      if (ledgerDoc) {
        setLedgerInfo({ 
          id: ledgerDoc.id, 
          ...ledgerDoc.data
        })
      }
    } catch (error) {
      console.error("Failed to fetch ledger info:", error)
      setLedgerInfo({})
    }
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

  // All write operations continue to use the API
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
