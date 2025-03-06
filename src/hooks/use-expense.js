// hooks/useTransaction.js
import { useState, useCallback } from "react"
import { emptyExpense } from "@/api/client.js"
import { getDateString } from "@/api/utilities.js"

import { useXpnzApi } from "@/hooks/use-xpnz-api.js"

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
  const [savingExpenseId, setSavingExpenseId] = useState(null)

  const {
    balance,
    categories,
    expenses,
    ledgerInfo,
    members,
    settlement,
    pushMember,
    editMember,
    deleteMember,
    pushExpense: apiPushExpense,
    editExpense: apiEditExpense,
    deleteExpense,
    loaded
  } = useXpnzApi(ledgerName)
  const memberNames = members.map((member) => member.name)

  const setExpenses = () => {} // stub

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
  }, [expenseToDelete, setExpenses])

  const copyExpense = useCallback((expense) => {
    setIsDrawerOpen(true)
    setIsEditMode(false)
    setSelectedExpense({
      ...expense,
      id: "",
      date: getDateString()
    })
  }, [])

  return {
    loaded,
    balance,
    settlement,
    categories,
    ledgerInfo,
    members,
    memberNames,
    pushMember,
    editMember,
    deleteMember,
    expenses,
    selectedExpense,
    pushExpense,
    copyExpense,
    editExpense,
    deleteExpense,
    isDrawerOpen,
    isEditMode,
    openAddExpenseDrawer,
    openEditExpenseDrawer,
    closeExpenseDrawer,
    isDeleteDrawerOpen,
    closeDeleteDrawer,
    onDeleteClick,
    handleDelete,
    savingExpenseId
  }
}

export default useExpense
