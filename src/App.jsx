// App.jsx
import React, { Suspense, useCallback, useEffect, useState } from "react"
import {
  BrowserRouter as Router,
  Navigate,
  Outlet,
  Route,
  Routes,
  useParams,
  useNavigate,
  useLocation
} from "react-router-dom"
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

const MembersTab = React.lazy(() => import("@/pages/members"))
const DebtsTab = React.lazy(() => import("@/pages/debts"))
const ExpensesTab = React.lazy(() => import("@/pages/expenses"))

function LedgerLayout() {
  const { ledgerName } = useParams()
  const location = useLocation()

  const navigate = useNavigate()

  useEffect(() => {
    // Redirect to lowercase ledgerName if it's not already lowercase
    if (ledgerName !== ledgerName?.toLowerCase()) {
      navigate(`${location.pathname.toLowerCase()}`, { replace: true })
    }
  }, [ledgerName, navigate])

  const [searchTerm, setSearchTerm] = React.useState("")
  const [ledgerExists, setLedgerExists] = useState(null)
  const [currency, setCurrency] = useState("")
  const [currencySymbol, setCurrencySymbol] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Check if the ledger exists
  useEffect(() => {
    async function checkLedger() {
      try {
        // delay for testing
        const response = await fetch(`${api.base}/ledgers/${ledgerName}`)
        const ledgerData = await response.json()
        if (ledgerData?.name === ledgerName) {
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

  // Expense data and functions
  // Load all of the expenseAPI functions and variables
  // But only push a few to the outletContext.
  // If needed, we can add the rest for future implementations.
  const {
    loaded,
    balance,
    settlement,
    categories,
    members,
    pushMember,
    editMember,
    deleteMember,
    expenses,
    selectedExpense,
    pushExpense,
    copyExpense,
    editExpense,
    isDrawerOpen,
    isEditMode,
    openAddExpenseDrawer,
    openEditExpenseDrawer,
    closeExpenseDrawer,
    isDeleteDrawerOpen,
    closeDeleteDrawer,
    onDeleteClick,
    handleDelete
  } = useExpense(ledgerName)

  const emptyMode = expenses.length === 0
  const [expandAll, setExpandAll] = useState(false)
  const toggleExpansion = useCallback(() => {
    setExpandAll(!expandAll)
  }, [expandAll])

  // Context value to pass to child components
  const outletContext = {
    searchTerm,
    expenses,
    openEditExpenseDrawer,
    onDeleteClick,
    copyExpense,
    expandAll,
    loaded,
    balance,
    settlement,
    members,
    pushMember,
    editMember,
    deleteMember,
    pushExpense,
    currency,
    currencySymbol
  }

  if (isLoading) return <div></div>
  if (!ledgerExists)
    return <Error message={`Ledger ${ledgerName} cannot be found! Please make sure it exists or contact support.`} />

  return (
    <>
      <Topbar onSearch={setSearchTerm} toggleExpansion={toggleExpansion} />
      <Outlet context={outletContext} />
      <Toolbar ledger={ledgerName} onClickPlus={openAddExpenseDrawer} emptyMode={emptyMode} />
      <ExpenseDrawer
        selectedExpense={selectedExpense}
        isDrawerOpen={isDrawerOpen}
        isEditMode={isEditMode}
        handleCloseDrawer={closeExpenseDrawer}
        members={members}
        pushExpense={pushExpense}
        editExpense={editExpense}
        defaultCurrency={currency}
        categories={categories}
      />
      <HoldToDelete onConfirm={handleDelete} isDrawerOpen={isDeleteDrawerOpen} handleCloseDrawer={closeDeleteDrawer} />
    </>
  )
}

export default function App() {
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
          </Route>

          <Route path="*" element={<Error />} />
        </Routes>
      </Router>
      <Toaster />
    </ThemeProvider>
  )
}
