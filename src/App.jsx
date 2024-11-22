// App.jsx
import React, { Suspense, useCallback, useEffect, useState } from "react"
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

const MembersTab = React.lazy(() => import("@/pages/members"))
const DebtsTab = React.lazy(() => import("@/pages/debts"))
const ExpensesTab = React.lazy(() => import("@/pages/expenses"))

function LedgerLayout() {
  const { ledgerName } = useParams()
  const [searchTerm, setSearchTerm] = React.useState("")

  const [ledgerExists, setLedgerExists] = useState(null) // To track ledger existence
  const [isLoading, setIsLoading] = useState(true)

  // Check if the ledger exists
  useEffect(() => {
    async function checkLedger() {
      try {
        // delay for testing
        const response = await fetch(`${api.base}/ledger-exists/${ledgerName}`)
        const exists = await response.json()
        setLedgerExists(exists)
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
  const {
    expenses,
    members,
    isDeleteDrawerOpen,
    closeDeleteDrawer,
    onDeleteClick,
    handleDelete,
    copyExpense,
    openAddExpenseDrawer,
    openEditExpenseDrawer,
    closeExpenseDrawer,
    isDrawerOpen,
    isEditMode,
    selectedExpense,
    pushExpense,
    editExpense
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
    expandAll
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
