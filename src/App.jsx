// App.jsx
import React, { Suspense, useEffect, useMemo, useState } from "react"
import { BrowserRouter as Router, Route, Routes, useParams } from "react-router-dom"
import Toolbar from "@/components/toolbar"
import Topbar from "@/components/topbar"
import { ThemeProvider } from "@/components/theme-provider"
import { generateRandomLedgerData } from "@/api/client.js"
import ExpenseDrawer from "@/components/expense-drawer"
import HoldToDelete from "@/components/delete"
import Fuse from "fuse.js"
import useExpense from "@/hooks/use-expense.js"
import { Toaster } from "@/components/ui/toaster"

import Home from "@/pages/home"
import Error from "@/pages/error"
import Loading from "@/components/loading"

const ExpensesTab = React.lazy(() => import("@/pages/expenses"))
const MembersTab = React.lazy(() => import("@/pages/members"))
const DebtsTab = React.lazy(() => import("@/pages/debts"))

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:ledgerName">
            <Route
              index
              element={
                <Suspense fallback={<Loading />}>
                  <LedgerApp target="expenses" />
                </Suspense>
              }
            />
            <Route
              path="members"
              element={
                <Suspense fallback={<Loading />}>
                  <LedgerApp target="members" />
                </Suspense>
              }
            />
            <Route
              path="debts"
              element={
                <Suspense fallback={<Loading />}>
                  <LedgerApp target="debts" />
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

function LedgerApp({ target }) {
  const { ledgerName } = useParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredExpenses, setFilteredExpenses] = useState([])

  const {
    isDrawerOpen,
    isEditMode,
    selectedExpense,
    openAddExpenseDrawer,
    openEditExpenseDrawer,
    closeExpenseDrawer,
    isDeleteDrawerOpen,
    closeDeleteDrawer,
    onDeleteClick,
    handleDelete,
    copyExpense,
    expenses,
    members
  } = useExpense(ledgerName)

  const fuse = useMemo(
    () =>
      new Fuse(expenses, {
        keys: ["name", "category"],
        threshold: 0.1
      }),
    [expenses]
  )

  useEffect(() => {
    if (searchTerm) {
      const results = fuse.search(searchTerm)
      setFilteredExpenses(results.map((result) => result.item))
    } else {
      setFilteredExpenses(expenses)
    }
  }, [searchTerm, fuse, expenses])

  const CurrentTab = () => {
    switch (target) {
      case "expenses":
        return (
          <ExpensesTab
            expenses={filteredExpenses}
            openEditDrawer={openEditExpenseDrawer}
            onDeleteClick={onDeleteClick}
            onCopyClick={copyExpense}
          />
        )
      case "members":
        return <MembersTab ledgerName={ledgerName} />
      case "debts":
        return <DebtsTab ledgerName={ledgerName} />
      default:
        return <Error />
    }
  }

  return (
    <>
      <Topbar onSearch={setSearchTerm} pageType={target} />
      <CurrentTab />
      <Toolbar ledger={ledgerName} onClickPlus={openAddExpenseDrawer} />
      <ExpenseDrawer
        selectedExpense={selectedExpense}
        isDrawerOpen={isDrawerOpen}
        isEditMode={isEditMode}
        handleCloseDrawer={closeExpenseDrawer}
        members={members.map((member) => member.name)}
        onDeleteClick={onDeleteClick}
      />
      <HoldToDelete onConfirm={handleDelete} isDrawerOpen={isDeleteDrawerOpen} handleCloseDrawer={closeDeleteDrawer} />
    </>
  )
}
