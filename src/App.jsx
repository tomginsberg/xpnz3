// App.jsx
import React, { Suspense, useCallback, useEffect, useState, useMemo } from "react"
import { BrowserRouter as Router, Navigate, Outlet, Route, Routes, useParams } from "react-router-dom"
import Toolbar from "@/components/toolbar"
import Topbar from "@/components/topbar"
import { ThemeProvider } from "@/components/theme-provider"
import ExpenseDrawer from "@/components/expense-drawer"
import HoldToDelete from "@/components/delete"
import useExpense from "@/hooks/use-expense.js"
import { Toaster } from "@/components/ui/toaster"
import Home from "@/pages/home"
import Error from "@/pages/error"
import { FlatLoading, MasonaryLoading } from "@/components/loading"
import { api } from "../xpnz.config.js"

import { currencySymbols } from "./api/utilities.js"

// Use React.lazy for code-splitting
const MembersTab = React.lazy(() => import("@/pages/members"))
const DebtsTab = React.lazy(() => import("@/pages/debts"))
const ExpensesTab = React.lazy(() => import("@/pages/expenses"))
const ItemizedTab = React.lazy(() => import("@/pages/itemize"))

function LedgerLayout() {
  const { ledgerName } = useParams()

  // UI state
  const [searchTerm, setSearchTerm] = useState("")
  const [ledgerExists, setLedgerExists] = useState(null)
  const [currency, setCurrency] = useState("")
  const [currencySymbol, setCurrencySymbol] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [expandAll, setExpandAll] = useState(false)
  const [showChart, setShowChart] = useState(false)
  const [enableChart, setEnableChart] = useState(false)

  // Check if the ledger exists
  useEffect(() => {
    async function checkLedger() {
      try {
        setIsLoading(true)
        const response = await fetch(`${api.base}/ledgers/${ledgerName}`)
        if (response.status === 200) {
          const ledgerData = await response.json()
          setLedgerExists(true)
          setCurrency(ledgerData?.currency)
          setCurrencySymbol(currencySymbols[ledgerData?.currency])
        } else {
          setLedgerExists(false)
        }
      } catch (error) {
        console.error("Error checking ledger existence:", error)
        setLedgerExists(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkLedger()
  }, [ledgerName])

  // Load all expense data and functions through the hook
  const expenseAPI = useExpense(ledgerName)
  const { 
    loaded,
    expenses,
    openAddExpenseDrawer,
    isDrawerOpen,
    isEditMode,
    selectedExpense,
    closeExpenseDrawer,
    isDeleteDrawerOpen,
    closeDeleteDrawer,
    handleDelete
  } = expenseAPI
  
  // Memoized callbacks for UI interactions
  const toggleExpansion = useCallback(() => {
    setExpandAll(prevState => !prevState)
  }, [])

  const toggleChart = useCallback(() => {
    setShowChart(prevState => !prevState)
  }, [])

  // Calculate if we're in empty mode once when expenses change
  const emptyMode = useMemo(() => expenses.length === 0, [expenses.length])

  // Memoize the context value to prevent unnecessary re-renders
  const outletContext = useMemo(() => ({
    searchTerm,
    expenses,
    openEditExpenseDrawer: expenseAPI.openEditExpenseDrawer,
    onDeleteClick: expenseAPI.onDeleteClick,
    copyExpense: expenseAPI.copyExpense,
    expandAll,
    loaded,
    balance: expenseAPI.balance,
    settlement: expenseAPI.settlement,
    members: expenseAPI.members,
    memberNames: expenseAPI.memberNames,
    pushMember: expenseAPI.pushMember,
    editMember: expenseAPI.editMember,
    deleteMember: expenseAPI.deleteMember,
    pushExpense: expenseAPI.pushExpense,
    currency,
    currencySymbol,
    showChart,
    toggleChart,
    enableChart,
    setEnableChart,
    savingExpenseId: expenseAPI.savingExpenseId
  }), [
    searchTerm, 
    expenses, 
    expenseAPI.openEditExpenseDrawer,
    expenseAPI.onDeleteClick, 
    expenseAPI.copyExpense,
    expandAll, 
    loaded, 
    expenseAPI.balance, 
    expenseAPI.settlement, 
    expenseAPI.members,
    expenseAPI.memberNames,
    expenseAPI.pushMember,
    expenseAPI.editMember,
    expenseAPI.deleteMember,
    expenseAPI.pushExpense,
    currency, 
    currencySymbol, 
    showChart, 
    toggleChart, 
    enableChart, 
    setEnableChart, 
    expenseAPI.savingExpenseId
  ])

  if (isLoading) return <div></div>
  if (!ledgerExists)
    return <Error message={`Ledger ${ledgerName} cannot be found! Please make sure it exists or contact support.`} />

  return (
    <>
      <Topbar
        onSearch={setSearchTerm}
        toggleExpansion={toggleExpansion}
        toggleChart={toggleChart}
        showChartToggle={enableChart}
      />
      <Outlet context={outletContext} />
      <Toolbar ledger={ledgerName} onClickPlus={openAddExpenseDrawer} emptyMode={emptyMode} />
      <ExpenseDrawer
        selectedExpense={selectedExpense}
        isDrawerOpen={isDrawerOpen}
        isEditMode={isEditMode}
        handleCloseDrawer={closeExpenseDrawer}
        members={expenseAPI.members}
        pushExpense={expenseAPI.pushExpense}
        editExpense={expenseAPI.editExpense}
        defaultCurrency={currency}
        categories={expenseAPI.categories}
      />
      <HoldToDelete onConfirm={handleDelete} isDrawerOpen={isDeleteDrawerOpen} handleCloseDrawer={closeDeleteDrawer} />
    </>
  )
}

// Root App component with all routes
const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/:ledgerName/:tab?" element={<LedgerLayout />}>
            <Route index element={<Navigate to="expenses" replace />} />
            <Route
              path="expenses"
              element={
                <Suspense fallback={<MasonaryLoading />}>
                  <ExpensesTab />
                </Suspense>
              }
            />
            <Route
              path="members"
              element={
                <Suspense fallback={<FlatLoading />}>
                  <MembersTab />
                </Suspense>
              }
            />
            <Route
              path="debts"
              element={
                <Suspense fallback={<FlatLoading />}>
                  <DebtsTab />
                </Suspense>
              }
            />

            <Route
              path="itemize"
              element={
                <Suspense fallback={<FlatLoading />}>
                  <ItemizedTab />
                </Suspense>
              }
            />
          </Route>

          <Route path="*" element={<Error />} />
        </Routes>
      </Router>
      <Toaster />
    </ThemeProvider>
  )
}

export default App
