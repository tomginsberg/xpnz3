import AnimatedCard from "@/components/animated-card"
import { Masonry } from "masonic"
import React, { useEffect, useMemo, useState } from "react"
import { useOutletContext } from "react-router-dom"
import Fuse from "fuse.js"
import { ChevronDown, ChevronUp, Edit, UserRoundCheck } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function ExpenseMasonry() {
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

  const renderCard = ({ index, data }) => (
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

export default function ExpenseMasonryGrouped() {
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

  // Group expenses by month and year
  const groupedExpenses = useMemo(() => {
    const groups = {}
    filteredExpenses.forEach((expense) => {
      const date = new Date(expense.date)
      const monthYear = date.toLocaleString("default", {
        month: "long",
        year: "numeric"
      })
      if (!groups[monthYear]) {
        groups[monthYear] = []
      }
      groups[monthYear].push(expense)
    })
    // Convert to array and sort by date descending
    return Object.entries(groups)
      .map(([monthYear, expenses]) => ({ monthYear, expenses }))
      .sort((a, b) => new Date(b.expenses[0].date).getTime() - new Date(a.expenses[0].date).getTime())
  }, [filteredExpenses])

  const renderCard = ({ index, data }) => (
    <AnimatedCard
      key={data.id}
      expense={data}
      onEditClick={openEditExpenseDrawer}
      onCopyClick={copyExpense}
      onDeleteClick={onDeleteClick}
    />
  )

  return (
    <div className="mt-[133px]">
      {groupedExpenses.map(({ monthYear, expenses }, index) => (
        <MasonryMonth expenses={expenses} monthYear={monthYear} renderCard={renderCard} />
      ))}
    </div>
  )
}

const detailsVariants = {
  open: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.3, ease: "easeInOut" }
  },
  closed: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.3, ease: "easeInOut" }
  }
}

function MasonryMonth({ monthYear, expenses, renderCard }) {
  const [visible, setVisible] = useState(true)

  return (
    <div key={monthYear}>
      <div
        className={cn(
          "sticky top-[130px] bg-linear ps-6 pe-4 text-primary z-10 border-b pb-2 pt-3 flex flex-row justify-between",
          visible && "bg-background"
        )}
        onClick={() => setVisible(!visible)}
      >
        <h2 className="text-xl font-bold">{monthYear}</h2>
        <div className="flex flex-row">
          <span className="text-black dark:text-zinc-400">
            ${expenses.reduce((acc, curr) => acc + Number(curr.amount), 0).toFixed(2)}
          </span>
          <div className="ms-2 text-black dark:text-zinc-400">
            <ChevronDown className={cn("transition-all", !visible && "-rotate-180 text-primary")} />
          </div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {visible && (
          <motion.div initial="closed" animate="open" exit="closed" className="mx-4 mt-4" variants={detailsVariants}>
            <Masonry
              items={expenses}
              columnGutter={14}
              rowGutter={14}
              columnWidth={180}
              maxColumnCount={6}
              render={renderCard}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
