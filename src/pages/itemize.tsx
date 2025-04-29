import { useEffect, useState } from "react"
import { ChevronUp, Minus, Plus, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from "@/components/ui/drawer"
import { useOutletContext } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select.tsx"

type Split = {
  [key: string]: number
}

type Item = {
  id: string
  name: string
  amount: string
  taxed: boolean
  members: string[]
  split: Split
}

type Member = {
  name: string
  id: string
}

type Contribution = {
  id: string
  paid: number
  weight: number
}

/**
 * Returns an object with each member's split replaced by at least 1
 * if it was invalid or <= 0.
 */
function normalizeSplit(item: Item): Split {
  return item.members.reduce((acc: Split, member) => {
    const val = item.split[member]
    const weight = !isNaN(val) && val > 0 ? val : 1
    return { ...acc, [member]: weight }
  }, {})
}

/** Returns the sum of the split weights or item.members.length if they’re all invalid. */
function getTotalWeight(normalizedSplits: Split, item: Item) {
  const sum = Object.values(normalizedSplits).reduce((a, b) => a + b, 0)
  return sum || item.members.length
}

/** Parses a string into float, optionally applies tax. */
function calculateTaxedAmount(amount: string, taxed: boolean, taxPercentage: string) {
  const itemAmount = parseFloat(amount) || 0
  const taxRate = (parseFloat(taxPercentage) || 0) / 100
  return taxed ? itemAmount * (1 + taxRate) : itemAmount
}

const INITIAL_ITEM: Item = {
  id: crypto.randomUUID(),
  name: "",
  amount: "",
  taxed: false,
  members: [],
  split: {}
}

function UnequalSplitDrawer({
  item,
  onSplitChange,
  onSplitBlur,
  onResetSplit,
  taxPercentage
}: {
  item: Item
  onSplitChange: (member: string, rawValue: string) => void
  onSplitBlur: (member: string, rawValue: string) => void
  onResetSplit: () => void
  taxPercentage: string
}) {
  const normalizedSplits = normalizeSplit(item)
  const totalWeight = getTotalWeight(normalizedSplits, item)
  const taxedItemAmount = calculateTaxedAmount(item.amount, item.taxed, taxPercentage)

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Unequal Split</Button>
      </DrawerTrigger>

      <DrawerContent className="container pb-6 text-primary">
        <DrawerHeader>
          <DrawerTitle className="text-center">Unequal Split for {item.name || "this item"}</DrawerTitle>
          <DrawerDescription className="text-center">Set split weights for each member</DrawerDescription>
        </DrawerHeader>

        <div className="grid grid-cols-3 items-center gap-4">
          <span className="text-left font-semibold">Member</span>
          <span className="text-center font-semibold">Split Weight</span>
          <span className="text-right font-semibold">Amount</span>

          {item.members.map((member) => {
            const currentValue = item.split[member]
            const displayValue = currentValue > 0 ? String(currentValue) : "" // if 0 or invalid => show blank
            return (
              <div key={member} className="contents">
                <Label htmlFor={`split-${item.id}-${member}`} className="text-left">
                  {member}
                </Label>
                <Input
                  id={`split-${item.id}-${member}`}
                  type="number"
                  min="0"
                  step="any"
                  placeholder="1"
                  value={displayValue}
                  onChange={(e) => onSplitChange(member, e.target.value)}
                  onBlur={(e) => onSplitBlur(member, e.target.value)}
                  className="w-full"
                />
                <span className="flex flex-row justify-end gap-2 text-right">
                  ${((normalizedSplits[member] / totalWeight) * taxedItemAmount).toFixed(2)}
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-8 space-x-2">
          <Button onClick={onResetSplit}>Remove Split</Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function ItemComponent({
  initialItem,
  members,
  taxPercentage,
  onItemUpdate
}: {
  initialItem: Item
  members: string[]
  taxPercentage: string
  onItemUpdate: (updatedItem: Item) => void
}) {
  const [item, setItem] = useState<Item>(initialItem)

  /** Common helper to set state & propagate changes up. */
  const updateItem = (updated: Item) => {
    setItem(updated)
    onItemUpdate(updated)
  }

  /** Called when user changes item name or taxed checkbox or item amount. */
  const handleFieldChange = (field: keyof Item, rawValue: string | boolean) => {
    if (typeof rawValue === "string") {
      // Prevent negative
      if (parseFloat(rawValue) < 0) {
        rawValue = "0"
      }
    }
    updateItem({ ...item, [field]: rawValue })
  }

  /** Add/remove a member from this item’s assigned members. */
  const handleMemberToggle = (member: string) => {
    const newMembers = item.members.includes(member)
      ? item.members.filter((m) => m !== member)
      : [...item.members, member]

    updateItem({ ...item, members: newMembers })
  }

  /**
   * For the "unequal split" input:
   * We allow user to temporarily type "" or partial input in the box.
   * If user typed negative, we clamp to 0 (which will show blank with placeholder=1).
   */
  const handleSplitChange = (member: string, rawValue: string) => {
    if (rawValue === "") {
      // User cleared the field entirely => store 0 for now
      updateItem({
        ...item,
        split: { ...item.split, [member]: 0 }
      })
      return
    }
    // Prevent negative
    const numeric = parseFloat(rawValue)
    if (isNaN(numeric) || numeric < 0) {
      // clamp to 0 so it displays as blank
      updateItem({
        ...item,
        split: { ...item.split, [member]: 0 }
      })
      return
    }
    // store user’s typed number
    updateItem({
      ...item,
      split: { ...item.split, [member]: numeric }
    })
  }

  /**
   * On blur: if the user leaves the field blank, <=0, or invalid => set to 1
   */
  const handleSplitBlur = (member: string, rawValue: string) => {
    const numeric = parseFloat(rawValue)
    if (!rawValue || isNaN(numeric) || numeric <= 0) {
      // revert to 1
      updateItem({
        ...item,
        split: { ...item.split, [member]: 1 }
      })
    }
  }

  const resetSplit = () => {
    const updatedSplit: Split = {}
    item.members.forEach((m) => {
      updatedSplit[m] = 1
    })
    updateItem({ ...item, split: updatedSplit })
  }

  /** For quick display in item (same logic as in the drawer). */
  const normalizedSplits = normalizeSplit(item)
  const totalWeight = getTotalWeight(normalizedSplits, item)
  const taxedItemAmount = calculateTaxedAmount(item.amount, item.taxed, taxPercentage)

  return (
    <div className="p-4 bg-card rounded-lg space-y-4">
      {/* Item Name */}
      <div className="space-y-2">
        <Label htmlFor={`item-name-${item.id}`}>Item Name</Label>
        <Input
          id={`item-name-${item.id}`}
          value={item.name}
          onChange={(e) => handleFieldChange("name", e.target.value)}
          placeholder="Enter item name"
        />
      </div>

      {/* Item Amount (prevent negative) */}
      <div className="space-y-2">
        <Label htmlFor={`item-amount-${item.id}`}>Amount</Label>
        <Input
          id={`item-amount-${item.id}`}
          type="number"
          min="0"
          step="any"
          value={item.amount}
          onChange={(e) => {
            // clamp negative to 0
            if (parseFloat(e.target.value) < 0) {
              return handleFieldChange("amount", "0")
            }
            handleFieldChange("amount", e.target.value)
          }}
          placeholder="Enter amount"
        />
      </div>

      {/* Taxed Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`item-taxed-${item.id}`}
          checked={item.taxed}
          onCheckedChange={(checked) => handleFieldChange("taxed", Boolean(checked))}
        />
        <Label htmlFor={`item-taxed-${item.id}`}>Taxed</Label>
      </div>
      {item.taxed && item.amount && (
        <div className="text-sm text-muted-foreground">Amount with tax: ${taxedItemAmount.toFixed(2)}</div>
      )}

      {/* Split Between Members */}
      <div className="space-y-2">
        <Label>Split Between</Label>
        <div className="flex flex-wrap gap-2">
          {members.map((roommate) => {
            const isSelected = item.members.includes(roommate)
            return (
              <Button
                key={roommate}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => handleMemberToggle(roommate)}
              >
                {roommate}
                {isSelected ? <Minus className="ml-1 h-4 w-4" /> : <Plus className="ml-1 h-4 w-4" />}
              </Button>
            )
          })}
        </div>

        {/* Show each member’s share */}
        {item.members.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {item.members.map((member) => {
              const share = (normalizedSplits[member] / totalWeight) * taxedItemAmount
              return <span key={member}>{`${member}: $${share.toFixed(2)}`}</span>
            })}
          </div>
        )}
      </div>

      {/* Unequal Split Drawer */}
      {item.members.length > 0 && (
        <UnequalSplitDrawer
          item={item}
          onSplitChange={handleSplitChange}
          onSplitBlur={handleSplitBlur}
          onResetSplit={resetSplit}
          taxPercentage={taxPercentage}
        />
      )}
    </div>
  )
}

/** Main Itemizer Component */
export default function Itemizer() {
  const [total, setTotal] = useState<string>("")
  const [taxPercentage, setTaxPercentage] = useState<string>("")
  const [items, setItems] = useState<Item[]>([INITIAL_ITEM])

  // For toggling the "Member Totals" UI
  const [totalsVisible, setTotalsVisible] = useState<boolean>(true)
  const [disableSubmit, setDisableSubmit] = useState(false)

  // Get members from context
  const { members: membersData, pushExpense, currency } = useOutletContext<any>()
  const [members] = useState<string[]>(membersData.map((m: Member) => m.name))
  const [paidByMember, setPaidByMember] = useState<string>("")
  const [name, setName] = useState<string>("")

  // Summaries
  const [memberTotals, setMemberTotals] = useState<Split>({})
  const [itemsTotal, setItemsTotal] = useState<number>(0)
  const [remaining, setRemaining] = useState<number>(0)
  const [splitBetween, setSplitBetween] = useState<string[]>(() => members) // default all
  const [errorMsg, setErrorMsg] = useState<string>("") // for error banner
  const { toast } = useToast()
  const navigate = useNavigate()

  async function handleSubmit() {
    setDisableSubmit(true) // Disable button to prevent double submission
    // Basic error checks
    if (paidByMember == "") {
      toast({
        title: "Uh oh!",
        description: "Please select the person who paid for this expense."
      })
      setDisableSubmit(false)
      return
    }
    if (splitBetween.length === 0) {
      toast({
        title: "Uh oh!",
        description: "Please select at least one person to split this expense between."
      })
      setDisableSubmit(false)
      return
    }

    // Find the Member object for the payer
    const payingMemberObj = membersData.find((m: Member) => m.name === paidByMember)
    if (!payingMemberObj) {
      toast({
        title: "Error",
        description: "Could not find the member who paid. Please try again.",
        variant: "destructive"
      })
      setDisableSubmit(false)
      return
    }

    /**
     * contributions = an array of { id, paid, weight }
     * - For the single payer: paid = total expense amount, weight = 0.
     * - For each person splitting: paid=0, weight = s.weight (or however your split data is stored).
     */
    const contributions: Contribution[] = []

    // Contributions should be a list of objects with id, paid, and weight
    // id is the member's ID
    // paid is the amount they paid (0 for people who only split, here only one member pays)
    // weight is the amount they partook in the expense (in general doesn't need to be normalized to sum to the total value)
    splitBetween.map((member) => {
      const memberObj = membersData.find((m: Member) => m.name === member)
      if (!memberObj) return // skip if not found
      const paid = member === payingMemberObj.name ? parseFloat(total) : 0
      contributions.push({
        id: memberObj.id,
        paid,
        weight: memberTotals[member]
      })
    })

    // Format your date as needed
    const dateString = new Date().toISOString().split("T")[0]

    // Prepare to call your pushExpense function:
    try {
      // Replace these arguments with your actual ones as needed
      await pushExpense(name || "Group Bill", currency, "🧾 Bill", dateString, "expense", contributions)
      toast({
        title: "Added!",
        description: "Your expense has been added successfully."
      })

      // Use React Router to navigate "up" one path segment
      navigate("..") // from e.g. /epc/itemize -> /epc
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save expense. Please try again.",
        variant: "destructive"
      })
      setDisableSubmit(false)
    }
  }

  // Re-sync splitBetween if the members array changes.
  useEffect(() => {
    if (members.length > 0) {
      setSplitBetween(members)
    }
  }, [members])

  useEffect(() => {
    // Sum of items that actually have members
    const sumOfItems = items.reduce((sum, item) => {
      if (item.members.length === 0) return sum
      return sum + calculateTaxedAmount(item.amount, item.taxed, taxPercentage)
    }, 0)
    setItemsTotal(sumOfItems)

    // Check total from user
    const numericTotal = parseFloat(total) || 0
    if (sumOfItems > numericTotal) {
      setErrorMsg("Warning: The sum of item amounts exceeds the total receipt amount.")
    } else {
      setErrorMsg("")
    }

    const rawRemaining = numericTotal - sumOfItems
    const newRemaining = rawRemaining > 0 ? rawRemaining : 0
    setRemaining(newRemaining)

    // Build each member’s total
    const newMemberTotals: Split = {}
    items.forEach((item) => {
      if (item.members.length === 0) return // skip unassigned items
      const normalized = normalizeSplit(item)
      const totalWeight = getTotalWeight(normalized, item)
      const taxedValue = calculateTaxedAmount(item.amount, item.taxed, taxPercentage)

      item.members.forEach((member) => {
        newMemberTotals[member] = (newMemberTotals[member] || 0) + (normalized[member] / totalWeight) * taxedValue
      })
    })

    // Add leftover among splitBetween
    if (splitBetween.length > 0 && newRemaining > 0) {
      const sharePerMember = newRemaining / splitBetween.length
      splitBetween.forEach((member) => {
        newMemberTotals[member] = (newMemberTotals[member] || 0) + sharePerMember
      })
    }

    setMemberTotals(newMemberTotals)
  }, [total, taxPercentage, items, splitBetween])

  /** Update an item in the array. */
  const handleItemUpdate = (updatedItem: Item) => {
    setItems((prev) => prev.map((it) => (it.id === updatedItem.id ? updatedItem : it)))
  }

  /**
   * Toggle a member's participation in paying leftover.
   * Must ensure at least one member remains selected.
   */
  const handleSplitBetweenToggle = (member: string) => {
    if (splitBetween.length === 1 && splitBetween.includes(member)) {
      return // don't allow removing the last one
    }
    setSplitBetween((prev) => (prev.includes(member) ? prev.filter((m) => m !== member) : [...prev, member]))
  }

  // For preventing negative totals
  const handleTotalChange = (raw: string) => {
    if (parseFloat(raw) < 0) {
      setTotal("0")
    } else {
      setTotal(raw)
    }
  }

  // For preventing negative tax
  const handleTaxChange = (raw: string) => {
    if (parseFloat(raw) < 0) {
      setTaxPercentage("0")
    } else {
      setTaxPercentage(raw)
    }
  }

  return (
    <div className="mx-auto mt-16 mb-32 max-w-4xl p-6 space-y-6 text-primary">
      {/* Error Banner if needed */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-4 mb-4 border border-red-300 bg-red-50 text-red-700 rounded">
          <AlertTriangle className="h-5 w-5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Top area: total + tax */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="total">Bill Name</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group Bill"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="total">Bill Total</Label>
          <Input
            id="total"
            type="number"
            min="0"
            step="any"
            value={total}
            onChange={(e) => handleTotalChange(e.target.value)}
            placeholder="Enter total amount"
          />
        </div>
        {/*paid by select box*/}

        <div className="space-y-2">
          <Label htmlFor="paidBy">Who Paid</Label>
          <Select onValueChange={(value) => setPaidByMember(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Who Paid" />
            </SelectTrigger>
            <SelectContent>
              {members.map((member) => (
                <SelectItem key={member} value={member} onSelect={() => setPaidByMember(member)}>
                  {member}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tax">Tax Percentage</Label>
          <Input
            id="tax"
            type="number"
            min="0"
            step="any"
            value={taxPercentage}
            onChange={(e) => handleTaxChange(e.target.value)}
            placeholder="Enter tax percentage"
          />
        </div>
      </div>

      {/* Member Totals */}
      {Object.keys(memberTotals).length > 0 && (
        <div className="sticky top-[75px] border-b bg-background p-4">
          <div className="flex justify-between">
            <h2 className="mb-2 text-lg font-semibold">Member Totals</h2>
            <button
              className={cn(
                "transition-all duration-200 ease-in-out hover:text-gray-600",
                totalsVisible && "rotate-180"
              )}
              onClick={() => setTotalsVisible((prev) => !prev)}
            >
              <ChevronUp />
            </button>
          </div>
          {totalsVisible && (
            <>
              <div className="border-b pb-1">
                {members.map((member) => {
                  const totalVal = memberTotals[member] || 0
                  return (
                    <div key={member} className="flex items-center justify-between">
                      <span>{member}:</span>
                      <span className="font-semibold">${totalVal.toFixed(2)}</span>
                    </div>
                  )
                })}
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span>Item Total:</span>
                <span className="font-semibold">${itemsTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Bill Total:</span>
                <span className="font-semibold">${parseFloat(total || "0").toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Remaining Total:</span>
                <span className="font-semibold">${remaining.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Items */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Items</h2>
        {items.map((item) => (
          <ItemComponent
            key={item.id}
            initialItem={item}
            members={members}
            taxPercentage={taxPercentage}
            onItemUpdate={handleItemUpdate}
          />
        ))}
        <Button
          className="w-full"
          variant="outline"
          onClick={() => {
            const newId = crypto.randomUUID()
            setItems((prev) => [...prev, { ...INITIAL_ITEM, id: newId }])
          }}
        >
          <Plus />
        </Button>
      </div>

      {/* Remaining Splitting */}
      {Math.round(remaining * 100) / 100 > 0 && (
        <div className="bg-background border p-4 rounded-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold">Remaining Amount:</span>
            <span className="text-xl font-bold">${remaining.toFixed(2)}</span>
          </div>
          <div className="space-y-2">
            <Label>Split Remaining Between</Label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => {
                const isSelected = splitBetween.includes(member)
                return (
                  <Button
                    key={member}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSplitBetweenToggle(member)}
                  >
                    {member}
                    {isSelected ? <Minus className="ml-1 h-4 w-4" /> : <Plus className="ml-1 h-4 w-4" />}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-center">
        <Button onClick={handleSubmit} disabled={disableSubmit}>
          Save Expense 🎉
        </Button>
      </div>
    </div>
  )
}
