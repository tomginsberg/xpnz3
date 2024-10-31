// components/expenses.jsx

import React, { Suspense } from "react"
import { MasonaryLoading } from "@/components/loading"

export default function ExpensesTab() {
  const ExpenseMasonry = React.lazy(() => import("@/components/expense-masonry.jsx"))

  return (
    <Suspense fallback={<MasonaryLoading />}>
      <ExpenseMasonry />
    </Suspense>
  )
}
