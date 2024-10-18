// components/animated-card.jsx
import { useRef, useState, memo } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Pencil, Trash2, Copy } from "lucide-react"

const AnimatedCard = memo(({ expense, onEditClick, onDeleteClick, onCopyClick }) => {
  // const ref = useRef(null)
  // const isInView = useInView(ref, { once: false, amount: 0.0 })

  const [showDetails, setShowDetails] = useState(false)

  const toggleDetails = () => {
    setShowDetails((prev) => !prev)
  }

  // Define animation variants for the card
  const cardVariants = {
    initial: { scale: 1 },
    expanded: { scale: 1.02 }
  }

  // Define animation variants for the details section
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

  const handleEditClick = () => {
    onEditClick(expense)
  }

  const handleDeleteClick = () => {
    onDeleteClick(expense)
  }

  const handleCopyClick = () => {
    onCopyClick(expense)
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          // layout
          // ref={ref}
          // initial={{ opacity: 0, y: 30, scale: 0.8 }}
          // animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 1, y: 30, scale: 0.8 }}
          // transition={{ duration: 0.3 }}
          onClick={toggleDetails}
          // exit={{ opacity: 0, scale: 0.8 }}
          className="break-inside-avoid select-none mb-4"
        >
          <motion.div
            className={
              "flex flex-col overflow-hidden rounded-lg text-card-foreground h-full" +
              (showDetails ? " bg-linear-foreground" : " bg-card")
            }
            layout
            variants={cardVariants}
            animate={showDetails ? "expanded" : "initial"}
            transition={{ duration: 0.3 }}
          >
            {/* Main Content */}
            <div className="flex-1">
              {/* Name and Amount */}
              <div className="px-4 pt-4">
                <div className="flex-auto">
                  <div className="flex flex-wrap justify-between max-w-auto">
                    <div className="break-normal pr-3 text-ellipsis overflow-hidden text-balance text-lg font-extrabold tracking-tight">
                      {expense.name ? expense.name : expense.category}
                    </div>
                    <div className="mt-[0.1rem] truncate font-normal tracking-tight text-gray-700 dark:text-gray-400">
                      {expense.amount >= 0 ? "$" + expense.amount : "+$" + -1 * expense.amount}
                    </div>
                  </div>
                </div>
              </div>
              {/* Date */}
              <div className="px-4 pb-4 pt-0 text-gray-700 dark:text-gray-300">
                <p className="text-md">{expense.date}</p>
              </div>
            </div>

            {/* Category at the Bottom */}
            {expense.category && expense.name && (
              <div className="px-4 pb-4 text-gray-700 dark:text-gray-300 mt-auto">
                <p className="text-lg">{expense.category}</p>
              </div>
            )}

            {/* Toggled Visibility Section */}
            <AnimatePresence initial={false}>
              {showDetails && (
                <motion.div
                  key="details"
                  variants={detailsVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  style={{ overflow: "hidden" }}
                >
                  <hr className="mx-3 mb-1 border-gray-300 dark:border-gray-600" />
                  <div className="p-4 pt-0 text-gray-700 dark:text-gray-400">
                    <p className="text-md">
                      Paid:{" "}
                      {expense.paidBy
                        .map(
                          (data) =>
                            data.member +
                            (data.amount > 0 ? " $" + data.amount.toString() : " +$" + (-data.amount).toString())
                        )
                        .join(", ")}
                    </p>
                    <p className="text-md">
                      Split:{" "}
                      {expense.splitBetween
                        .map(
                          (data) =>
                            data.member +
                            (data.normalizedWeight > 0
                              ? " $" + data.normalizedWeight.toString()
                              : " +$" + (-data.normalizedWeight).toString())
                        )
                        .join(", ")}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleEditClick}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopyClick}>
          <Copy className="mr-2 h-4 w-4" />
          Copy
        </ContextMenuItem>
        <ContextMenuItem onClick={handleDeleteClick}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
})

export default AnimatedCard
