import { useMemo, useState } from "react"
import { Masonry } from "@mui/lab"
import { useOutletContext } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import AnimatedCard from "@/components/animated-card"

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

  return (
    <div className="min-h-screen bg-background">
      <main className="mt-[132px] mb-96">
        {filteredGroups.map((group) => (
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
    </div>
  )
}

function MonthGroup({ monthYear, expenses, openEditExpenseDrawer, copyExpense, onDeleteClick }) {
  const [isOpen, setIsOpen] = useState(true)
  console.log("isOpen", isOpen)

  const items = useMemo(
    () =>
      expenses.map((expense, index) => ({
        id: expense.id,
        expense,
        index
      })),
    [expenses]
  )

  const totalAmount = useMemo(() => expenses.reduce((acc, curr) => acc + Number(curr.amount), 0).toFixed(2), [expenses])

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
                <span className="text-black dark:text-zinc-400">${totalAmount}</span>
                <ChevronDown
                  className={cn("text-primary h-5 w-5 transition-transform duration-200", isOpen && "rotate-180")}
                />
              </div>
            </button>
          </CollapsibleTrigger>
        </div>

        <AnimatePresence>
          {isOpen && (
            <CollapsibleContent forceMount className="">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <Masonry columns={{ xs: 2, sm: 3, md: 4, lg: 5 }} spacing={0} sequential className="px-1">
                  {items.map((item) => (
                    <div className="p-2" key={item.id}>
                      <AnimatedCard
                        expense={item.expense}
                        onEditClick={openEditExpenseDrawer}
                        onCopyClick={copyExpense}
                        onDeleteClick={onDeleteClick}
                      />
                    </div>
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
