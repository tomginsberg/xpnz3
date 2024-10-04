// hooks/useTransaction.js
import { useState, useCallback } from 'react';
import { emptyExpense } from '@/api/get';

/**
 * Custom hook to manage transaction drawer state.
 *
 * @param {Function} setExpenses - Function to update the expenses list.
 * @returns {Object} - Contains drawer states and handler functions.
 */
const useExpense = (setExpenses) => {
    // TODO: add api logic here
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(emptyExpense);
    const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState(null);

    const openAddExpenseDrawer = useCallback(() => {
        setIsDrawerOpen(true);
        setIsEditMode(false);
        setSelectedExpense(emptyExpense);
    }, []);

    const openEditExpenseDrawer = useCallback((expense) => {
        setSelectedExpense(expense);
        setIsEditMode(true);
        setIsDrawerOpen(true);
    }, []);

    const closeExpenseDrawer = useCallback(() => {
        setIsDrawerOpen(false);
    }, []);

    const closeDeleteDrawer = useCallback(() => {
        setIsDeleteDrawerOpen(false);
    }, []);

    const onDeleteClick = useCallback((expense) => {
        setExpenseToDelete(expense);
        setIsDeleteDrawerOpen(true);
    }, []);


    const handleDelete = useCallback(() => {
        if (expenseToDelete) {
            setExpenses((prevExpenses) => prevExpenses.filter(expense => expense.id !== expenseToDelete.id));
        }
        setIsDeleteDrawerOpen(false);
        setExpenseToDelete(null);
    }, [expenseToDelete, setExpenses]);

    const copyExpense = useCallback((expense) => {
        setExpenses((prevExpenses) => {
            return [...prevExpenses, { ...expense, id: Date.now().toString() }];
        });
    }, [setExpenses]);

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
    };
};

export default useExpense;
