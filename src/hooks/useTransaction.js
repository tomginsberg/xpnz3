// hooks/useTransaction.js
import {useState, useCallback} from 'react';
import {emptyExpense} from "@/api/get";

/**
 * Custom hook to manage transaction drawer state.
 *
 * @returns {Object} - Contains drawer states and handler functions.
 */
const useTransaction = () => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(emptyExpense);

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

    return {
        isDrawerOpen,
        isEditMode,
        selectedExpense,
        openAddExpenseDrawer,
        openEditExpenseDrawer,
        closeExpenseDrawer,
    };
};

export default useTransaction;
