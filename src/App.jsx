// App.jsx
import React, { Suspense } from "react"
import { BrowserRouter as Router, Outlet, Route, Routes, useParams } from "react-router-dom"
import Toolbar from "@/components/toolbar"
import Topbar from "@/components/topbar"
import { ThemeProvider } from "@/components/theme-provider"
import { emptyExpense } from "@/api/client.js"
import ExpenseDrawer from "@/components/expense-drawer"
import HoldToDelete from "@/components/delete"
import useExpense from "@/hooks/use-expense.js"
import { Toaster } from "@/components/ui/toaster"

import Home from "@/pages/home"
import Error from "@/pages/error"
import Loading from "@/components/loading"

const ExpensesTab = React.lazy(() => import("@/pages/expenses"))
const MembersTab = React.lazy(() => import("@/pages/members"))
const DebtsTab = React.lazy(() => import("@/pages/debts"))

function LedgerLayout() {
  const { ledgerName } = useParams()
  const [searchTerm, setSearchTerm] = React.useState("")

  // State for ExpenseDrawer
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)
  const [isEditMode, setIsEditMode] = React.useState(false)
  const [selectedExpense, setSelectedExpense] = React.useState(emptyExpense)

  // Expense data and functions
  const { expenses, members, isDeleteDrawerOpen, closeDeleteDrawer, onDeleteClick, handleDelete, copyExpense } =
    useExpense(ledgerName)
  const memberNames = members.map((member) => member.name)

  // Functions to control ExpenseDrawer
  const openAddExpenseDrawer = React.useCallback(() => {
    setIsDrawerOpen(true)
    setIsEditMode(false)
    setSelectedExpense(emptyExpense)
  }, [])

  const openEditExpenseDrawer = React.useCallback((expense) => {
    setIsDrawerOpen(true)
    setIsEditMode(true)
    setSelectedExpense(expense)
  }, [])

  const closeExpenseDrawer = React.useCallback(() => {
    setIsDrawerOpen(false)
  }, [])

  // Context value to pass to child components
  const outletContext = {
    searchTerm,
    expenses,
    members,
    openEditExpenseDrawer,
    onDeleteClick,
    copyExpense,
    ledgerName
  }

  return (
    <>
      <Topbar onSearch={setSearchTerm} />
      <Suspense fallback={<Loading />}>
        <Outlet context={outletContext} />
      </Suspense>
      <Toolbar ledger={ledgerName} onClickPlus={openAddExpenseDrawer} />
      <ExpenseDrawer
        selectedExpense={selectedExpense}
        isDrawerOpen={isDrawerOpen}
        isEditMode={isEditMode}
        handleCloseDrawer={closeExpenseDrawer}
        members={memberNames}
        onDeleteClick={onDeleteClick}
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
          <Route path="/:ledgerName" element={<LedgerLayout />}>
            <Route index element={<ExpensesTab />} />
            <Route path="members" element={<MembersTab />} />
            <Route path="debts" element={<DebtsTab />} />
          </Route>
          <Route path="*" element={<Error />} />
        </Routes>
      </Router>
      <Toaster />
    </ThemeProvider>
  )
}
