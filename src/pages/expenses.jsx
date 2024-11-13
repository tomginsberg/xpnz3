// components/expenses.jsx

import React, { Suspense } from "react"
import { MasonaryLoading } from "@/components/loading"
import { useOutletContext } from "react-router-dom"
import AnimatedTextImageBlock from "@/components/animated-text-image-block.jsx"

export default function ExpensesTab() {
  const { expenses } = useOutletContext()
  const isEmpty = expenses.length === 0
  const ExpenseMasonry = React.lazy(() => import("@/components/expense-masonry.jsx"))
  return isEmpty ? (
    <AnimatedTextImageBlock
      image="https://fonts.gstatic.com/s/e/notoemoji/latest/1f308/512.gif"
      imageAlt="🌈"
      title="No expenses found"
      subtitle="Add your first expense to get started"
    />
  ) : (
    <Suspense fallback={<MasonaryLoading />}>
      <ExpenseMasonry />
    </Suspense>
  )
}
