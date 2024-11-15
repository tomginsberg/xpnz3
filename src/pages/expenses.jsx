// components/expenses.jsx

import React from "react"
import { useOutletContext } from "react-router-dom"
import AnimatedTextImageBlock from "@/components/animated-text-image-block"
import ExpenseMasonry from "@/components/expense-masonry"

export default function ExpensesTab() {
  const { expenses } = useOutletContext()
  const isEmpty = expenses.length === 0
  return isEmpty ? (
    <AnimatedTextImageBlock
      image="https://fonts.gstatic.com/s/e/notoemoji/latest/1f308/512.gif"
      imageAlt="🌈"
      title="No expenses found"
      subtitle="Add your first expense to get started"
    />
  ) : (
    <ExpenseMasonry />
  )
}
