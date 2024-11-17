import { useEffect, useState } from "react" // shadcn components
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { DateTimePicker, TimePicker } from "@/components/ui/datetime-picker"
import { ConfettiButton } from "@/components/ui/confetti"
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { SplitBetweenForm } from "@/components/ui/expense-split-between"
import { PaidByForm } from "@/components/ui/expense-paid-by"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/ui/multi-select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch" // icons
import { Save, SquareArrowUpLeft, Trash2 } from "lucide-react"
import { CalendarIcon } from "@radix-ui/react-icons" // external utilities
import { format } from "date-fns" // internal components and utilities
import { cn } from "@/lib/utils"
import { categories, currencies } from "@/api/client.js"
import CalculatorInput from "./calculator-input"
import { CategoryPicker } from "./category-picker"
import { useToast } from "@/hooks/use-toast"

export default function ExpenseDrawer({
  /* props */ selectedExpense,
  isDrawerOpen,
  isEditMode,
  handleCloseDrawer,
  members,
  onDeleteClick,
  pushExpense,
  editExpense
}) {
  const [income, setIncome] = useState(selectedExpense.income)
  const [name, setName] = useState(selectedExpense.name)
  const [amount, setAmount] = useState(selectedExpense.amount)
  const [date, setDate] = useState(new Date(selectedExpense.date))
  const [category, setCategory] = useState(selectedExpense.category)
  const [paidBy, setPaidBy] = useState(selectedExpense.paidBy)
  const [splitBetween, setSplitBetween] = useState(selectedExpense.splitBetween)
  const [currency, setCurrency] = useState(selectedExpense.currency)

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
      setCurrency(selectedExpense.currency)
    }
  }, [selectedExpense, isDrawerOpen])

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
      toast({
        title: "Success!",
        description: "Expense edited.",
        variant: "default"
      })
    } else {
      await pushExpense(name, currency, category, dateString, income ? "income" : "expense", contributions)
      toast({
        title: "Success!",
        description: "Expense added.",
        variant: "default"
      })
    }
    handleCloseDrawer()
  }


  return (
    <Drawer open={isDrawerOpen} onClose={handleCloseDrawer}>
      <DrawerContent
        className="bg-background text-black dark:text-white max-h-[90%] flex flex-col"
        aria-describedby="Main content area for adding or editing an expense."
      >
        <DrawerHeader className="text-black dark:text-white">
          <DrawerTitle>{getDrawerTitle(isEditMode)}</DrawerTitle>
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

                <div className="flex-shrink space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder={currencies["CAD"]} />
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
                <DateTimePicker granularity="minute" value={date} onChange={setDate}/>
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
                />
              </div>
              <div>
                <SplitBetweenForm
                  memberNames={memberNames}
                  selectedExpense={selectedExpense}
                  splitBetween={splitBetween}
                  setSplitBetween={setSplitBetween}
                />
              </div>
            </div>

            <DrawerFooter>
              <div className="flex justify-between w-full">
                <Button type="button" variant="outline" onClick={handleCloseDrawer}>
                  <span className="mr-2">
                    <SquareArrowUpLeft className="size-4" />
                  </span>{" "}
                  Cancel
                </Button>
                <div className="space-x-2">
                  {isEditMode && (
                    <Button onClick={onDeleteClick} variant="outline">
                      <span className="mr-2">
                        <Trash2 className="size-4" />
                      </span>{" "}
                      Delete
                    </Button>
                  )}
                  <ConfettiButton type="submit" variant="outline">
                    <span className="mr-2">
                      <Save className="size-4" />
                    </span>{" "}
                    Save
                  </ConfettiButton>
                </div>
              </div>
            </DrawerFooter>
          </form>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  )
}
