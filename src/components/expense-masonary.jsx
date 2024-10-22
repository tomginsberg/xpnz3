import AnimatedCard from "@/components/animated-card.jsx"
import Masonry from "react-masonry-css"
import React, { useEffect, useMemo, useState } from "react"
import { useOutletContext } from "react-router-dom"
import Fuse from "fuse.js"

export default function ExpenseMasonary() {
  const { searchTerm, expenses, openEditExpenseDrawer, onDeleteClick, copyExpense, loading } = useOutletContext()
  const [filteredExpenses, setFilteredExpenses] = useState([])

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
  }, [searchTerm, expenses])

  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [filteredExpenses])

  const breakpointColumnsObj = {
    default: 6,
    1100: 4,
    700: 3,
    500: 2
  }

  return (
    <div className="mt-[150px] mx-4 mb-[100%]">
      <Masonry breakpointCols={breakpointColumnsObj} className="flex w-auto gap-4" columnClassName="masonry-column">
        {sortedExpenses.map((expense) => (
          <AnimatedCard
            key={expense.id}
            expense={expense}
            onEditClick={openEditExpenseDrawer}
            onCopyClick={copyExpense}
            onDeleteClick={onDeleteClick}
          />
        ))}
      </Masonry>
    </div>
  )
}
