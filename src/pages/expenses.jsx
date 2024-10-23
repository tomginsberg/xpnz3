// components/expenses.jsx
import AnimatedCard from "@/components/animated-card"
import Masonry from "react-masonry-css"
import React, { useEffect, useMemo, useState } from "react"
import { useOutletContext } from "react-router-dom"
import Fuse from "fuse.js"
import { useInView } from "react-intersection-observer"

export default function ExpensesTab() {
  const { searchTerm, expenses, openEditExpenseDrawer, onDeleteClick, copyExpense } = useOutletContext()

  const [filteredExpenses, setFilteredExpenses] = useState([])
  const [renderedExpenses, setRenderedExpenses] = useState([])

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
      setFilteredExpenses(results.map((result) => result.item).sort((a, b) => new Date(b.date) - new Date(a.date)))
    } else {
      setFilteredExpenses(expenses.sort((a, b) => new Date(b.date) - new Date(a.date)))
    }
  }, [searchTerm, expenses])

  useEffect(() => {
    setRenderedExpenses(filteredExpenses.slice(0, 150).map((expense, index) => ({...expense, amount: index})))
  }, [filteredExpenses])

  function onInViewChange(inView) {
    if (inView) {
      setRenderedExpenses(filteredExpenses.slice(0, renderedExpenses.length + 150).map((expense, index) => ({...expense, amount: index})))
    }
  }

  const [ref, inView] = useInView({
    onChange: onInViewChange
  })

  const breakpointColumnsObj = {
    default: 6,
    1100: 4,
    700: 3,
    500: 2
  }

  return (
    <div>
      <div className="mt-[150px] mx-4">
        <Masonry breakpointCols={breakpointColumnsObj} className="flex w-auto gap-4" columnClassName="masonry-column">
          {renderedExpenses.map((expense) => (
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
      <div ref={ref} className="h-[106px]"/>
    </div>
  )
}
