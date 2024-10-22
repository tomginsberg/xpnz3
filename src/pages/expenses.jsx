// components/expenses.jsx
import React, { Suspense } from "react"
import { MasonaryLoading } from "@/components/loading"

export default function ExpensesTab() {
  const ExpenseMasonary = React.lazy(() => import("@/components/expense-masonary"))
  return (
    <Suspense fallback={<MasonaryLoading />}>
      <ExpenseMasonary />
    </Suspense>
  )
}
