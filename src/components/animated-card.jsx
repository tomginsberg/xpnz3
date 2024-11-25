// components/animated-card.jsx
import { memo, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Copy, Pencil, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { useOutletContext } from "react-router-dom"
import { currencySymbols, formatDigit } from "@/api/utilities.js"

const AnimatedCard = memo(
  ({ expense, showDetails, onCardClick, onEditClick, onDeleteClick, onCopyClick, className }) => {
    // Define animation variants for the card
    const cardVariants = {
      initial: { scale: 1 },
      expanded: { scale: 1.02 }
    }

    const { currency: defaultCurrency, currencySymbol: defaultSymbolCurrency } = useOutletContext()
    const expenseCurrency = expense.currency
    let expenseCurrencySymbol = currencySymbols[expenseCurrency]
    if (defaultCurrency !== expenseCurrency && expenseCurrencySymbol === defaultSymbolCurrency) {
      expenseCurrencySymbol = `(${expenseCurrency}) ${expenseCurrencySymbol}`
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

    const handleEditClick = useCallback(() => {
      onEditClick(expense)
    }, [expense, onEditClick])

    const handleDeleteClick = useCallback(() => {
      onDeleteClick(expense)
    }, [expense, onDeleteClick])

    const handleCopyClick = useCallback(() => {
      onCopyClick(expense)
    }, [expense, onCopyClick])

    const getMemberInvolvement = (paidBy, splitBetween) => {
      const involvementMap = {}

      // Process members who paid
      paidBy.forEach(({ member }) => {
        involvementMap[member] = involvementMap[member] === "split" ? "both" : "by"
      })

      // Process members who split
      splitBetween.forEach(({ member }) => {
        involvementMap[member] = involvementMap[member] === "by" ? "both" : "split"
      })

      return Object.entries(involvementMap)
    }

    const involvementList = getMemberInvolvement(expense.paidBy, expense.splitBetween)

    const involvementClass = {
      by: "bg-green-200 dark:bg-green-900",
      both: "bg-background",
      split: "bg-red-200 dark:bg-red-900"
    }

    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.75 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
            onClick={() => onCardClick(expense.id)}
            className={cn("break-inside-avoid select-none z-0", className)}
            viewport={{ once: false, amount: 0 }}
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
                        {expense.amount >= 0
                          ? defaultSymbolCurrency + formatDigit(expense.amount * expense.exchange_rate)
                          : `+{$defaultSymbolCurrency}` + -1 * formatDigit(expense.amount * expense.exchange_rate)}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Date */}
                <div className="px-4 pb-4 pt-0 text-gray-700 dark:text-gray-300">
                  <p className="text-md">
                    {new Date(expense.date)
                      .toLocaleDateString("default", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        timeZone: "UTC"
                      })
                      .replace(",", "")}
                  </p>
                </div>
              </div>

              {/* Category at the Bottom */}

              <div className="flex flex-wrap justify-between items-end px-4 pb-4 mt-auto gap-y-2">
                {/* Category */}
                {expense.category && expense.name ? (
                  <div className="text-gray-700 dark:text-gray-300 flex-grow">
                    <p className="text-lg">{expense.category}</p>
                  </div>
                ) : (
                  <div className="flex-grow" />
                )}

                {/* Member Avatars */}
                <div className="flex -space-x-2 overflow-hidden py-[2px]">
                  {involvementList.map(([memberName, involvementType], index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center justify-center w-6 h-6 text-primary text-xs font-bold border border-card rounded-full",
                        involvementClass[involvementType]
                      )}
                    >
                      {memberName[0].toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>

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
                              (data.amount > 0
                                ? ` ${expenseCurrencySymbol}` + data.amount.toString()
                                : ` ${expenseCurrencySymbol}` + (-data.amount).toString())
                          )
                          .join(", ")}
                      </p>
                      <p className="text-md">
                        Split:{" "}
                        {expense.splitBetween
                          .map(
                            (data) =>
                              data.member +
                              (data.amount > 0
                                ? ` ${expenseCurrencySymbol}` + data.amount.toString()
                                : ` ${expenseCurrencySymbol}` + (-data.amount).toString())
                          )
                          .join(", ")}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
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
  }
)

export default AnimatedCard
