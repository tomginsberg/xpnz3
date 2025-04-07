import { useState, useEffect, useCallback, useMemo } from "react"

import { uniq } from "lodash-es"

import { api } from "@/../xpnz.config.js"

export function useXpnzApi(ledger) {
  const [loaded, setLoaded] = useState(false)
  const [balance, setBalance] = useState([])
  const [categories, setCategories] = useState([])
  const [expenses, setExpenses] = useState([])
  const [ledgerInfo, setLedgerInfo] = useState({})
  const [members, setMembers] = useState([])
  const [settlement, setSettlement] = useState([])
  // const categories = useMemo(() => uniq(expenses.map((e) => e.category)), [expenses])

  const apiGetCategories = async () => {
    const response = await fetch(`${api.base}/ledgers/${ledger}/categories`, { cache: "no-store" })
    setCategories(await response.json())
  }

  const apiGetBalance = async () => {
    const response = await fetch(`${api.base}/ledgers/${ledger}/balance`, { cache: "no-store" })
    setBalance(await response.json())
  }

  const apiGetExpenses = async () => {
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
      await apiGetExpenses()
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
      await apiGetCategories()
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
      await apiGetCategories()
    },
    [ledger, apiGetExpenses, apiGetBalance, apiGetSettlement, apiGetCategories]
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
    deleteExpense,
    loaded
  }
}
