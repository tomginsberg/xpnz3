// components/expenses.jsx
import AnimatedCard from "../components/animated-card.jsx";
import Masonry from "react-masonry-css";
import ExpenseDrawer from "@/components/expense-drawer.jsx";
import React, {useEffect, useState} from "react";
import {emptyExpense} from "@/api/get.js";


export default function ExpensesTab({expenses, setExpenses, members, addExpense, setAddTransaction}) {

    const [selectedExpense, setSelectedExpense] = useState(emptyExpense)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)

    function onEditClick(expense) {
        console.log(expense, members)
        setSelectedExpense(expense)
        setIsDrawerOpen(true)
    }

    function handleAddExpense() {
        setIsDrawerOpen(true)
        setIsEditMode(false)
        setSelectedExpense(emptyExpense)
    }

    // watch addTransaction when it changes to true, open the drawer and set isEditMode to false
    useEffect(() => {
        if (addExpense) {
            handleAddExpense()
        }
    }, [addExpense]);

    function onCopyClick(expense) {
        setExpenses([...expenses, {...expense, id: Math.random().toString(36).substr(2, 9)}])
    }

    function onDeleteClick(expense) {
        setExpenses(expenses.filter(e => e.id !== expense.id))
    }

    function handleCloseDrawer(updatedExpense) {
        setAddTransaction(false)
        // replace the expense with matching ID in the expenses array
        if (updatedExpense && updatedExpense.id) {
            const updatedExpenses = expenses.map(expense =>
                expense.id === updatedExpense.id ? updatedExpense : expense
            );
            setExpenses(updatedExpenses);
        }
        setIsDrawerOpen(false)
    }


    // sort expenses by date
    expenses.sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        }
    );

    const breakpointColumnsObj = {
        default: 6,
        1100: 4,
        700: 3,
        500: 2,
    };

    const MemoizedCard = React.memo(AnimatedCard);


    return (
        <>
            <div className="mt-[150px] mx-4 mb-[100%]">
                <Masonry
                    breakpointCols={breakpointColumnsObj}
                    className="flex w-auto gap-4"
                    columnClassName="masonry-column"
                >
                    {expenses.map((expense) => (
                        <MemoizedCard
                            key={expense.id}
                            expense={expense}
                            onEditClick={() => onEditClick(expense)}
                            onCopyClick={() => onCopyClick(expense)}
                            onDeleteClick={() => onDeleteClick(expense)}
                        />
                    ))}
                </Masonry>
            </div>
            {isDrawerOpen && <ExpenseDrawer selectedExpense={selectedExpense}
                                            isDrawerOpen={isDrawerOpen}
                                            isEditMode={isEditMode}
                                            handleCloseDrawer={handleCloseDrawer}
                                            members={members}/>}
        </>
    );
}
