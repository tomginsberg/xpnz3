// React hooks
import { useEffect, useState } from "react"

// External utilities and libraries
import confetti from "canvas-confetti"
import { Check, ChevronsUpDown, Save, SquareArrowUpLeft } from "lucide-react"

// Internal utilities
import { currencies } from "@/api/utilities.js"
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
  DrawerTitle,
  DrawerTrigger
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Command, CommandEmpty, CommandGroup, CommandList, CommandItem, CommandInput } from "@/components/ui/command"
// Internal components
import { SplitBetweenForm } from "@/components/expense-split-between"
import { PaidByForm } from "@/components/expense-paid-by"
import CalculatorInput from "./calculator-input"
import { CategoryPicker } from "./category-picker"
import { union } from "lodash-es"
import { getRandomExpenseName } from "@/api/client.js"
import { cn } from "@/lib/utils"

export default function ExpenseDrawer({
  selectedExpense,
  isDrawerOpen,
  isEditMode,
  handleCloseDrawer,
  members,
  pushExpense,
  editExpense,
  defaultCurrency,
  categories
}) {
  const [income, setIncome] = useState(false)
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date(`${selectedExpense.date}T00:00:00`))
  const [category, setCategory] = useState("")
  const [paidBy, setPaidBy] = useState([])
  const [splitBetween, setSplitBetween] = useState([])
  const [currency, setCurrency] = useState("")
  const [currencyDrawerOpen, setCurrencyDrawerOpen] = useState(false)
  const [randomExpenseName, setRandomExpenseName] = useState("")

  const id = selectedExpense.id
  const memberNames = union(
    paidBy.map((x) => x.member),
    splitBetween.map((x) => x.member),
    members.filter((member) => member.is_active).map((member) => member.name)
  )

  useEffect(() => {
    setIncome(selectedExpense.income)
    setName(selectedExpense.name)
    setAmount(selectedExpense.amount)
    setDate(new Date(`${selectedExpense.date}T00:00:00`))
    setCategory(selectedExpense.category)
    setPaidBy(selectedExpense.paidBy)
    setSplitBetween(selectedExpense.splitBetween)
    setCurrency(selectedExpense.currency || defaultCurrency)
  }, [selectedExpense, defaultCurrency])

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
    
    // Close drawer
    handleCloseDrawer()

    try {
      // Let the API call happen in the background
      if (isEditMode) {
        await editExpense(id, name, currency, category, dateString, income ? "income" : "expense", contributions)
        confettiExplosion()
        toast({
          title: "Updated!",
          description: "Your expense has been updated successfully.",
        })
      } else {
        await pushExpense(name, currency, category, dateString, income ? "income" : "expense", contributions)
        confettiExplosion()
        toast({
          title: "Added!",
          description: "Your expense has been added successfully.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save expense. Please try again.",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault()
        if (isDrawerOpen) {
          handleCloseDrawer()
        }
      } else if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (isDrawerOpen) {
          document.getElementById("save").click()
        } else {
          document.getElementById("searchbar").focus()
        }
      } else if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        confettiExplosion()
      }
    }

    document.addEventListener("keydown", handleKeydown)
    return () => document.removeEventListener("keydown", handleKeydown)
  }, [isDrawerOpen, handleCloseDrawer])

  useEffect(() => {
    if (isDrawerOpen) {
      setRandomExpenseName(getRandomExpenseName())
    }
  }, [isDrawerOpen])

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
                  required={!category}
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={randomExpenseName}
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
                  <Drawer open={currencyDrawerOpen} onOpenChange={setCurrencyDrawerOpen}>
                    <DrawerTrigger id="currency" className="min-w-[95px]" asChild>
                      <Button variant="outline">
                        {currencies[currency]} <ChevronsUpDown />
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                      <DrawerTitle className="text-primary py-3 text-center">Select Currency</DrawerTitle>
                      <DrawerDescription className="sr-only">Currency select element</DrawerDescription>
                      <Command className="p-4 bg-background">
                        <div className="border rounded-lg">
                          <div className="relative">
                            <CommandInput placeholder="Search currency..." />
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 font-large px-4 py-2">
                              {currencies[currency]}
                            </div>
                          </div>

                          <CommandList>
                            <CommandEmpty>No currency found.</CommandEmpty>
                            <CommandGroup>
                              {Object.entries(currencies).map(([code, flag]) => (
                                <CommandItem
                                  key={code}
                                  value={code}
                                  onSelect={(x) => {
                                    setCurrency(x)
                                    setCurrencyDrawerOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn("mr-2 h-4 w-4", code === currency ? "opacity-100" : "opacity-0")}
                                  />
                                  {flag}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </div>
                      </Command>
                    </DrawerContent>
                  </Drawer>
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
                <Button type="submit" variant="outline" id="save">
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
