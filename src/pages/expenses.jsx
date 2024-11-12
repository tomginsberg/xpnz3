// components/expenses.jsx

import React, { Suspense } from "react"
import { MasonaryLoading } from "@/components/loading"
import { useOutletContext } from "react-router-dom"
import { motion } from "framer-motion"

export default function ExpensesTab() {
  const { expenses } = useOutletContext()
  const isEmpty = expenses.length === 0
  const ExpenseMasonry = React.lazy(() => import("@/components/expense-masonry.jsx"))
  return isEmpty ? (
    <motion.div
      initial={{ opacity: 0, y: -200, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1 }}
      className="absolute top-48 items-center justify-center w-full"
    >
      <img
        src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f308/512.gif"
        alt="🌈"
        width="32"
        height="32"
        className="justify-center w-full px-[40%]"
      />
      <p className="text-2xl text-muted-foreground text-center">No expenses found</p>
      <p className="text text-foreground/30 text-center">Add your first expense to get started</p>
    </motion.div>
  ) : (
    <Suspense fallback={<MasonaryLoading />}>
      <ExpenseMasonry />
    </Suspense>
  )
}
