// components/expenses.jsx
import AnimatedCard from '@/components/animated-card'
import Masonry from 'react-masonry-css'
import React, { useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'

export default function ExpensesTab({ expenses, openEditDrawer, onDeleteClick, onCopyClick }) {
  const onEditClick = (expense) => {
    openEditDrawer(expense)
  }

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [expenses])

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
          <AnimatePresence key={expense.id}>
            <AnimatedCard
              expense={expense}
              onEditClick={onEditClick}
              onCopyClick={onCopyClick}
              onDeleteClick={onDeleteClick}
            />
          </AnimatePresence>
        ))}
      </Masonry>
    </div>
  )
}
