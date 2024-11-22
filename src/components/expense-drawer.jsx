// React hooks
import { useEffect, useState } from "react"

// External utilities and libraries
import confetti from "canvas-confetti"
import { Save, SquareArrowUpLeft, Trash2 } from "lucide-react"

// Internal utilities
import { categories, currencies } from "@/api/client.js"
import { useToast } from "@/hooks/use-toast"

// UI components
import { Button } from "@/components/ui/button"
import { DateTimePicker } from "@/components/ui/datetime-picker"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

// Internal components
import { SplitBetweenForm } from "@/components/expense-split-between"
import { PaidByForm } from "@/components/expense-paid-by"
import CalculatorInput from "./calculator-input"
import { CategoryPicker } from "./category-picker"

export default function ExpenseDrawer({
  /* props */ selectedExpense,
  isDrawerOpen,
  isEditMode,
  handleCloseDrawer,
  members,
  pushExpense,
  editExpense,
  defaultCurrency
}) {
  const [income, setIncome] = useState(selectedExpense.income)
  const [name, setName] = useState(selectedExpense.name)
  const [amount, setAmount] = useState(selectedExpense.amount)
  const [date, setDate] = useState(new Date(selectedExpense.date))
  const [category, setCategory] = useState(selectedExpense.category)
  const [paidBy, setPaidBy] = useState(selectedExpense.paidBy)
  const [splitBetween, setSplitBetween] = useState(selectedExpense.splitBetween)
  const [currency, setCurrency] = useState(selectedExpense.currency || defaultCurrency)

  const id = selectedExpense.id
  const memberNames = members.map((member) => member.name)

  useEffect(() => {
    if (isDrawerOpen) {
      setIncome(selectedExpense.income)
      setName(selectedExpense.name)
      setAmount(selectedExpense.amount)
      setDate(new Date(selectedExpense.date))
      setCategory(selectedExpense.category)
      setPaidBy(selectedExpense.paidBy)
      setSplitBetween(selectedExpense.splitBetween)
      setCurrency(selectedExpense.currency || defaultCurrency)
    }
  }, [isDrawerOpen])

  const confettiExplosion = () => {
    const shoot = () => {
      confetti({
        particleCount: 20,
        angle: 60,
        ticks: 100,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 1 }
      })
      confetti({
        particleCount: 20,
        ticks: 100,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 1 }
      })
    }

    setTimeout(shoot, 0)
    setTimeout(shoot, 100)
    setTimeout(shoot, 200)
  }

  function getDrawerTitle(edit) {
    let type = income ? "Income" : "Expense"
    return edit ? "Edit " + type : "Add New " + type
  }

  const { toast } = useToast()

  async function handleSubmit(e) {
    e.preventDefault()

    let contributions = []
    const paidByMembers = new Set(paidBy.map((p) => p.member))
    const splitBetweenMembers = new Set(splitBetween.map((s) => s.member))
    // Some error checking
    if (paidByMembers.size === 0) {
      toast({
        title: "Uh oh!",
        description: "Please select at least one person to pay for this expense."
      })
      return
    }
    if (splitBetweenMembers.size === 0) {
      toast({ title: "Uh oh!", description: "Please select at least one person to split this expense between." })
      return
    }

    members.map((m) => {
      const member = m.name
      const id = m.id
      const mergedVal = { id: id, paid: 0, weight: 0 }
      const paidByMember = paidBy.find((p) => p.member === member)
      const splitBetweenMember = splitBetween.find((s) => s.member === member)

      if (paidByMember) {
        mergedVal.paid = paidByMember.amount
      }
      if (splitBetweenMember) {
        mergedVal.weight = splitBetweenMember.weight
      }
      if (paidByMember || splitBetweenMember) {
        contributions.push(mergedVal)
      }
    })

    const dateString = date.toISOString().split("T")[0]
    if (isEditMode) {
      await editExpense(id, name, currency, category, dateString, income ? "income" : "expense", contributions)
    } else {
      await pushExpense(name, currency, category, dateString, income ? "income" : "expense", contributions)
    }
    handleCloseDrawer()
    confettiExplosion()
  }

  return (
    <Drawer open={isDrawerOpen} onClose={handleCloseDrawer}>
      <DrawerContent
        className="bg-background text-black dark:text-white max-h-[90%] flex flex-col"
        aria-describedby="Main content area for adding or editing an expense."
      >
        <DrawerHeader className="text-black dark:text-white">
          <DrawerTitle>{getDrawerTitle(isEditMode)}</DrawerTitle>
          <DrawerDescription className="sr-only">Enter Expense Details</DrawerDescription>
          <DrawerClose />
        </DrawerHeader>
        <ScrollArea className="flex-grow overflow-y-auto">
          <form onSubmit={handleSubmit} className="px-4 space-y-4">
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="name">Name</Label>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="unequal-split">Income</Label>
                    <Switch id="income" checked={income} onCheckedChange={setIncome} />
                  </div>
                </div>
                <Input
                  required={true}
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={"Expense"}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      setTimeout(() => e.target.blur(), 0)
                    }
                  }}
                />
              </div>

              <div className="flex flex-row justify-between gap-2">
                <div className="flex-grow space-y-2">
                  <div className="flex-1 space-y-2">
                    <CalculatorInput
                      required={true}
                      value={amount}
                      onChange={setAmount}
                      disabled={paidBy.length > 1}
                      useLabel={true}
                      isIncome={income}
                    />
                  </div>
                </div>

                <div className="flex-1 space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select onValueChange={setCurrency} defaultValue={currency} value={currency}>
                    <SelectTrigger id="currency" className="min-w-[95px]">
                      <SelectValue placeholder={currencies[currency]} />
                    </SelectTrigger>
                    <SelectContent aria-describedby="currency select">
                      {Object.entries(currencies).map(([code, flag]) => (
                        <SelectItem key={code} value={code}>
                          {flag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <Label htmlFor="calButton">Date</Label>

                <DateTimePicker
                  granularity="day"
                  value={date}
                  onChange={setDate}
                  displayFormat={{ hour24: "PPP", hour12: "PP" }}
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <CategoryPicker
                  categories={categories}
                  selectedCategory={category}
                  onAddCategory={setCategory}
                  onSelectedCategoryChange={setCategory}
                />
              </div>

              <div>
                <PaidByForm
                  memberNames={memberNames}
                  selectedExpense={selectedExpense}
                  paidBy={paidBy}
                  setPaidBy={setPaidBy}
                  amount={amount}
                  setAmount={setAmount}
                  isIncome={income}
                />
              </div>
              <div>
                <SplitBetweenForm
                  memberNames={memberNames}
                  selectedExpense={selectedExpense}
                  splitBetween={splitBetween}
                  setSplitBetween={setSplitBetween}
                  isIncome={income}
                />
              </div>
            </div>

            <DrawerFooter>
              <div className="flex justify-between w-full">
                <Button type="button" variant="outline" onClick={handleCloseDrawer}>
                  <span className="mr-2">
                    <SquareArrowUpLeft className="size-4" />
                  </span>
                  Cancel
                </Button>
                <Button type="submit" variant="outline">
                  <span className="mr-2">
                    <Save className="size-4" />
                  </span>
                  Save
                </Button>
              </div>
            </DrawerFooter>
          </form>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  )
}
