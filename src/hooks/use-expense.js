// hooks/useExpense.js
import { useState, useCallback } from "react"
import { emptyExpense } from "@/api/client.js"
import { getDateString } from "@/api/utilities.js"

import { useXpnzApi } from "@/hooks/use-xpnz-api.js"

/**
 * Custom hook to manage transaction drawer state and expense operations.
 *
 * @param {string} ledgerName - The name of the current ledger
 * @returns {Object} - Contains drawer states, expense data, and handler functions
 */
const useExpense = (ledgerName) => {
  // UI state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(emptyExpense)
  const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState(null)
  const [savingExpenseId, setSavingExpenseId] = useState(null)

  // Fetch API data and functions
  const {
    loaded,
    balance,
    settlement,
    categories,
    expenses,
    ledgerInfo,
    members,
    memberNames,
    pushMember,
    editMember,
    deleteMember,
    pushExpense: apiPushExpense,
    editExpense: apiEditExpense,
    deleteExpense: apiDeleteExpense,
    refreshData
  } = useXpnzApi(ledgerName)

  // Enhanced API operations with loading states
  const pushExpense = useCallback(async (name, currency, category, date, expense_type, contributions) => {
    setSavingExpenseId("new")
    try {
      await apiPushExpense(name, currency, category, date, expense_type, contributions)
    } finally {
      setSavingExpenseId(null)
    }
  }, [apiPushExpense])

  const editExpense = useCallback(async (id, name, currency, category, date, expense_type, contributions) => {
    setSavingExpenseId(id)
    try {
      await apiEditExpense(id, name, currency, category, date, expense_type, contributions)
    } finally {
      setSavingExpenseId(null)
    }
  }, [apiEditExpense])

  const deleteExpense = useCallback(async (id) => {
    setSavingExpenseId(id)
    try {
      await apiDeleteExpense(id)
    } finally {
      setSavingExpenseId(null)
    }
  }, [apiDeleteExpense])

  // UI state handlers
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
    setSelectedExpense(emptyExpense)
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
  }, [expenseToDelete, deleteExpense])

  const copyExpense = useCallback((expense) => {
    setIsDrawerOpen(true)
    setIsEditMode(false)
    setSelectedExpense({
      ...expense,
      id: "",
      date: getDateString()
    })
  }, [])

  // Return all needed values and functions
  return {
    // Data
    loaded,
    balance,
    settlement,
    categories,
    ledgerInfo,
    members,
    memberNames,
    expenses,
    selectedExpense,
    
    // Member operations
    pushMember,
    editMember,
    deleteMember,
    
    // Expense operations
    pushExpense,
    editExpense,
    deleteExpense,
    copyExpense,
    
    // UI state
    isDrawerOpen,
    isEditMode,
    isDeleteDrawerOpen,
    savingExpenseId,
    
    // UI handlers
    openAddExpenseDrawer,
    openEditExpenseDrawer,
    closeExpenseDrawer,
    closeDeleteDrawer,
    onDeleteClick,
    handleDelete,
    
    // Refresh function
    refreshData
  }
}

export default useExpense
