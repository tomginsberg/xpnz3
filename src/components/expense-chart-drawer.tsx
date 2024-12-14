"use client"

import { useEffect, useState } from "react"
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer"
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface Transaction {
  id: string
  name: string
  currency: string
  category: string
  date: string
  exchange_rate: number
  expense_type: string
  ledger: string
  amount: number
  contributions: Array<{
    member: string
    id: string
    weight: number
    paid: number
    owes: number
  }>
}

interface TransactionMonth {
  monthYear: string
  expenses: Transaction[]
}

const chartConfig = {
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-1))"
  }
} satisfies ChartConfig

const formatYAxisTick = (value: number) => {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
  }
  return `$${value}`
}

function formatMonthTick(value: string) {
  // Parse the month string (e.g. "December 2024") into short form (e.g. "Dec '24")
  const [month, year] = value.split(" ")
  return `${month.slice(0, 3)} ${year.slice(2)}`
}

const N_MONTHS = 6

export function ExpenseChartDrawer({
  data,
  isOpen,
  onClose,
  setEnable
}: {
  data: TransactionMonth[]
  isOpen: boolean
  onClose: (() => void) | undefined
  setEnable: (enable: boolean) => void
}) {
  const [allChartData, setAllChartData] = useState<Array<{ month: string; expenses: number }>>([])
  const [visibleChartData, setVisibleChartData] = useState<Array<{ month: string; expenses: number }>>([])
  const [trend, setTrend] = useState<{ percentage: number; isUp: boolean }>({ percentage: 0, isUp: true })
  const [endIndex, setEndIndex] = useState(0)

  useEffect(() => {
    // For each month, filter and sum expenses
    const monthlyData = data
      .map(({ monthYear, expenses }) => {
        const filteredExpenses = expenses.filter(
          (expense) =>
            expense.expense_type === "expense" && !(expense.category || "").toLowerCase().includes("transfer")
        )

        const totalExpenses = filteredExpenses.reduce((acc, transaction) => acc + transaction.amount, 0)

        return { month: monthYear, expenses: totalExpenses }
      })
      .filter(
        // Filter out months with no expenses
        ({ expenses }) => expenses > 0
      )

    if (monthlyData.length < 2) {
      setEnable(false)
      return
    } else {
      setEnable(true)
    }

    // Set the processed chart data
    setAllChartData(monthlyData)

    // Update visible data, assuming you show up to the last 5 months or so
    updateVisibleData(monthlyData, Math.min(monthlyData.length - 1, N_MONTHS - 1))

    // Calculate the trend if at least two data points are available
    if (monthlyData.length >= 2) {
      const lastMonth = monthlyData[0].expenses
      const previousMonth = monthlyData[1].expenses
      const percentageChange = ((lastMonth - previousMonth) / previousMonth) * 100

      setTrend({
        percentage: Math.abs(percentageChange),
        isUp: percentageChange > 0
      })
    }
  }, [data])

  const updateVisibleData = (data: Array<{ month: string; expenses: number }>, end: number) => {
    setVisibleChartData(data.slice(Math.max(0, end - 5), end + 1).reverse())
    setEndIndex(end)
  }

  const handleSinglePrevious = () => {
    if (endIndex < allChartData.length - 1) {
      updateVisibleData(allChartData, endIndex + 1)
    }
  }

  const handleSingleNext = () => {
    if (endIndex >= N_MONTHS) {
      updateVisibleData(allChartData, endIndex - 1)
    }
  }

  const handleDoublePrevious = () => {
    const newEnd = Math.min(allChartData.length - 1, endIndex + N_MONTHS)
    updateVisibleData(allChartData, newEnd)
  }

  const handleDoubleNext = () => {
    const newEnd = Math.max(N_MONTHS - 1, endIndex - N_MONTHS)
    updateVisibleData(allChartData, newEnd)
  }

  useEffect(() => {
    console.log("end index", endIndex, allChartData.length)
  }, [endIndex])

  return (
    <Drawer open={isOpen} onClose={onClose}>
      <DrawerContent>
        <DrawerTitle className="sr-only">Expense Summary</DrawerTitle>
        <DrawerDescription className="sr-only">Expense summary plot</DrawerDescription>
        <div className="px-2 py-6">
          <Card className="border-none shadow-none bg-background">
            <CardTitle className="text-center">Monthly Summary</CardTitle>
            <CardContent className="ps-0 pe-4 pt-6 pb-2">
              <ChartContainer config={chartConfig}>
                <BarChart data={visibleChartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={formatMonthTick}
                  />
                  <YAxis tickLine={false} tickMargin={5} axisLine={false} tickFormatter={formatYAxisTick} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" radius={8} />
                </BarChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-center gap-4 text-sm">
              <div className="flex gap-2 font-medium leading-none">
                {trend.isUp ? "Trending up" : "Trending down"} by {trend.percentage.toFixed(1)}% last month
                {trend.isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </div>
              <div className="flex justify-between w-full mt-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDoublePrevious}
                    disabled={endIndex === allChartData.length - 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleSinglePrevious}
                    disabled={endIndex === allChartData.length - 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={handleSingleNext} disabled={endIndex < N_MONTHS}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleDoubleNext} disabled={endIndex < N_MONTHS}>
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
