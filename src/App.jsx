// App.jsx
import React, { Suspense } from "react"
import { BrowserRouter as Router, Outlet, Route, Routes, useParams } from "react-router-dom"
import Toolbar from "@/components/toolbar"
import Topbar from "@/components/topbar"
import { ThemeProvider } from "@/components/theme-provider"
import ExpenseDrawer from "@/components/expense-drawer"
import HoldToDelete from "@/components/delete"
import useExpense from "@/hooks/use-expense.js"
import { Toaster } from "@/components/ui/toaster"
import Home from "@/pages/home"
import Error from "@/pages/error"
import { FlatLoading } from "@/components/loading"
import ExpensesTab from "@/pages/expenses"

const MembersTab = React.lazy(() => import("@/pages/members"))
const DebtsTab = React.lazy(() => import("@/pages/debts"))

function LedgerLayout() {
  const { ledgerName } = useParams()
  const { tab } = useParams()
  console.log(tab)
  const [searchTerm, setSearchTerm] = React.useState("")

  // Expense data and functions
  const {
    expenses,
    memberNames,
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
    selectedExpense
  } = useExpense(ledgerName)

  // Context value to pass to child components
  const outletContext = {
    searchTerm,
    expenses,
    openEditExpenseDrawer,
    onDeleteClick,
    copyExpense
  }

  return (
    <>
      <Topbar onSearch={setSearchTerm} />
      <Outlet context={outletContext} />
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

          <Route path="/:ledgerName/:tab?" element={<LedgerLayout />}>
            <Route index element={<ExpensesTab />} />
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
