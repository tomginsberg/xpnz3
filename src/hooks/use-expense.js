// hooks/useTransaction.js
import { useState, useCallback } from "react"
import { emptyExpense } from "@/api/client.js"

import { useExpenses } from "@/hooks/use-xpnz-api.js"

/**
 * Custom hook to manage transaction drawer state.
 *
 * @returns {Object} - Contains drawer states and handler functions.
 * @param ledgerName
 */
const useExpense = (ledgerName) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(emptyExpense)
  const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState(null)

  const { expenses, members, deleteExpense, loading } = useExpenses(ledgerName)
  const memberNames = members.map((member) => member.name)

  const setExpenses = () => {} // stub

  const openAddExpenseDrawer = useCallback(() => {
    setIsDrawerOpen(true)
    setIsEditMode(false)
    setSelectedExpense(emptyExpense)
  }, [])

  const openEditExpenseDrawer = useCallback((expense) => {
    setSelectedExpense(expense)
    setIsEditMode(true)
    setIsDrawerOpen(true)
  }, [])

  const closeExpenseDrawer = useCallback(() => {
    setIsDrawerOpen(false)
  }, [])

  const closeDeleteDrawer = useCallback(() => {
    setIsDeleteDrawerOpen(false)
  }, [])

  const onDeleteClick = useCallback((expense) => {
    setExpenseToDelete(expense)
    setIsDeleteDrawerOpen(true)
  }, [])

  const handleDelete = useCallback(async () => {
    if (expenseToDelete) {
      await deleteExpense(expenseToDelete.id)
    }
    setIsDeleteDrawerOpen(false)
    setExpenseToDelete(null)
  }, [expenseToDelete, setExpenses])

  const copyExpense = useCallback((expense) => {
    setIsDrawerOpen(true)
    setIsEditMode(false)
    setSelectedExpense({
      ...expense,
      id: "",
      date: new Date().toISOString()
    })
  }, [])

  return {
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
    members,
    memberNames,
    expenses,
    loading
  }
}

export default useExpense
