import { useMemo, useState, useEffect } from "react"
import Masonry from "react-masonry-css"
import { useOutletContext } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import AnimatedCard from "@/components/animated-card"
import { useInView } from "react-intersection-observer"
import { fromPairs } from "lodash-es"

export default function ExpenseMasonryGrouped() {
  const { searchTerm, expenses, openEditExpenseDrawer, onDeleteClick, copyExpense } = useOutletContext()

  const filteredGroups = useMemo(() => {
    const filtered = searchTerm
      ? expenses.filter(
          (expense) =>
            expense.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            expense.category.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : expenses

    const groups = filtered.reduce((acc, expense) => {
      const monthYear = new Date(expense.date).toLocaleString("default", { month: "long", year: "numeric" })
      acc[monthYear] = acc[monthYear] || []
      acc[monthYear].push(expense)
      return acc
    }, {})

    return Object.entries(groups).map(([monthYear, expenses]) => ({
      monthYear,
      expenses
    }))
  }, [searchTerm, expenses])

  const [monthCount, setMonthCount] = useState(2)

  const { ref, inView, entry } = useInView({
    onChange: (inView) => inView && setMonthCount((prev) => prev + 2)
  })

  return (
    <div className="min-h-screen bg-background">
      <main className="mt-[132px] mb-96">
        {filteredGroups.slice(0, monthCount).map((group) => (
          <MonthGroup
            key={group.monthYear}
            monthYear={group.monthYear}
            expenses={group.expenses}
            openEditExpenseDrawer={openEditExpenseDrawer}
            copyExpense={copyExpense}
            onDeleteClick={onDeleteClick}
          />
        ))}
      </main>
      <div ref={ref} className="flex justify-center items-center h-16" />
    </div>
  )
}

function MonthGroup({ monthYear, expenses, openEditExpenseDrawer, copyExpense, onDeleteClick }) {
  const { expandAll, currencySymbol } = useOutletContext()

  const [isOpen, setIsOpen] = useState(true)
  const [toggledCards, setToggledCards] = useState(new Set())

  // Reset toggledCards whenever expandAll changes
  useEffect(() => {
    setToggledCards(new Set())
  }, [expandAll])

  const toggleCardState = (id) => {
    setToggledCards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const isCardOpen = (id) => {
    // If the card ID is in toggledCards, it means its state is toggled relative to expandAll
    if (toggledCards.has(id)) {
      return !expandAll
    }
    // Otherwise, it follows the base state
    return expandAll
  }

  const totalAmount = useMemo(
    () =>
      expenses
        .filter(
          (expense) =>
            expense.expense_type !== "transfer" && !(expense.category || "").toLowerCase().includes("transfer")
        )
        .reduce((acc, curr) => acc + curr.amount * curr.exchange_rate, 0)
        .toFixed(2),
    [expenses]
  )

  return (
    <motion.div
      key={monthYear}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className={cn("sticky top-[125px] z-10 w-full py-2 px-2")}>
          <CollapsibleTrigger asChild>
            <button
              className={cn(
                "flex items-center justify-between w-full z-10 p-3",
                isOpen ? "bg-background" : "bg-card rounded-lg"
              )}
            >
              <h2 className="text-primary text-xl font-bold">{monthYear}</h2>
              <div className="flex items-center gap-3">
                <span className="text-black dark:text-zinc-400">
                  {currencySymbol}
                  {totalAmount}
                </span>
                <ChevronDown
                  className={cn("text-primary h-5 w-5 transition-transform duration-200", isOpen && "rotate-180")}
                />
              </div>
            </button>
          </CollapsibleTrigger>
        </div>

        <AnimatePresence>
          {isOpen && (
            <CollapsibleContent forceMount>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <Masonry
                  breakpointCols={{ default: 5, 1024: 4, 768: 3, 640: 2, 480: 2 }}
                  className="w-auto flex"
                  columnClassName="bg-clip-padding"
                >
                  {expenses.map((expense) => (
                    <AnimatedCard
                      key={expense.id}
                      className="p-2"
                      expense={expense}
                      onEditClick={openEditExpenseDrawer}
                      onCopyClick={copyExpense}
                      onDeleteClick={onDeleteClick}
                      showDetails={isCardOpen(expense.id)}
                      onCardClick={() => toggleCardState(expense.id)}
                    />
                  ))}
                </Masonry>
              </motion.div>
            </CollapsibleContent>
          )}
        </AnimatePresence>
      </Collapsible>
    </motion.div>
  )
}
