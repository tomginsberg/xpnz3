import { useOutletContext } from "react-router-dom"
import React, { useEffect, useMemo, useState } from "react"
import Fuse from "fuse.js"
import AnimatedCard from "@/components/animated-card.jsx"
import { Masonry } from "masonic"

export default function ExpenseMasonry() {
  const { searchTerm, expenses, openEditExpenseDrawer, onDeleteClick, copyExpense } = useOutletContext()

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
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date))
    if (searchTerm) {
      const results = fuse.search(searchTerm)
      setFilteredExpenses(results.map((result) => result.item).sort((a, b) => new Date(b.date) - new Date(a.date)))
    } else {
      setFilteredExpenses(sortedExpenses)
    }
  }, [searchTerm, expenses, fuse])

  const renderCard = ({ data }) => (
    <AnimatedCard
      key={data.id}
      expense={data}
      onEditClick={openEditExpenseDrawer}
      onCopyClick={copyExpense}
      onDeleteClick={onDeleteClick}
    />
  )

  return (
    <div className="mt-[150px] mx-4">
      <Masonry
        key={filteredExpenses.length}
        items={filteredExpenses}
        columnGutter={14}
        rowGutter={14}
        columnWidth={180}
        maxColumnCount={6}
        render={renderCard}
      />
    </div>
  )
}
