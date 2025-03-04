import { useCallback, useEffect, useState } from "react"
import { ArrowRight, ChevronUp, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
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

type Split = {
  [key: string]: number
}

type Item = {
  id: string
  name: string
  amount: number | string
  taxed: boolean
  members: string[]
  split: Split
}

type Member = {
  name: string
  id: string
}

const INITIAL_ITEM: Item = {
  id: crypto.randomUUID(),
  name: "",
  amount: "",
  taxed: false,
  members: [],
  split: {}
}

function calculateAmounts(item: Item, taxPercentage: string) {
  const itemAmount = item.amount || 0
  const taxRate = (parseFloat(taxPercentage) || 0) / 100
  const taxedAmount = item.taxed ? itemAmount * (1 + taxRate) : itemAmount
  const totalWeight = Object.values(item.split).reduce((a, b) => a + b, 0) || item.members.length
  return item.members.reduce(
    (acc: Split, member) => ({
      ...acc,
      [member]: ((item.split[member] || 1) / totalWeight) * taxedAmount
    }),
    {}
  )
}

function normalizeSplit(item: Item) {
  return item.members.reduce((acc: Split, member) => {
    const val = item.split[member]
    const weight = !isNaN(val) && val > 0 ? val : 1
    return { ...acc, [member]: weight }
  }, {})
}

function getTotalWeight(normalizedSplits: Split, item: Item) {
  return Object.values(normalizedSplits).reduce((a, b) => a + b, 0) || item.members.length
}

function UnequalSplitDrawer({
  item,
  onSplitChange,
  onResetSplit,
  taxPercentage
}: {
  item: Item
  onSplitChange: (member: string, value: string) => void
  onResetSplit: () => void
  taxPercentage: string
}) {
  const calculateTaxedAmount = useCallback(
    (amount: string, taxed: boolean) => {
      const itemAmount = parseFloat(amount) || 0
      const taxRate = (parseFloat(taxPercentage) || 0) / 100
      return taxed ? itemAmount * (1 + taxRate) : itemAmount
    },
    [taxPercentage]
  )

  // Normalize splits: if split[member] is not a valid positive number, treat it as 1
  const normalizedSplits = normalizeSplit(item)

  const totalWeight = getTotalWeight(normalizedSplits, item)

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Unequal Split</Button>
      </DrawerTrigger>
      <DrawerContent className="text-primary container pb-6">
        <DrawerHeader>
          <DrawerTitle className="text-center">Unequal Split for {item.name || "this item"}</DrawerTitle>
          <DrawerDescription className="text-center">Set split weights for each member</DrawerDescription>
        </DrawerHeader>
        <div className="grid grid-cols-3 items-center gap-4">
          <span className="text-left">Member</span>
          <span className="text-center">Split Weight</span>
          <span className="text-right">Amount</span>
          {item.members.map((member) => (
            <>
              <Label htmlFor={`split-${item.id}-${member}`} className="text-left">
                {member}
              </Label>
              <Input
                id={`split-${item.id}-${member}`}
                type="number"
                value={item.split[member] || ""}
                onChange={(e) => onSplitChange(member, e.target.value)}
                className="w-full"
              />

              <span className=" justify-end text-right flex flex-row gap-2">
                ${((normalizedSplits[member] / totalWeight) * calculateTaxedAmount(item.amount, item.taxed)).toFixed(2)}
              </span>
            </>
          ))}
        </div>

        <div className="mt-8 space-x-2">
          <Button onClick={onResetSplit}>Remove Split</Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function itemString(item: Item) {
  return `${item.name} - $${item.amount} - ${item.members.join(", ")} - ${JSON.stringify(item.split)}`
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

  const calculateTaxedAmount = useCallback(
    (amount: string, taxed: boolean) => {
      const itemAmount = parseFloat(amount) || 0
      const taxRate = (parseFloat(taxPercentage) || 0) / 100
      return taxed ? itemAmount * (1 + taxRate) : itemAmount
    },
    [taxPercentage]
  )

  const handleFieldChange = (field: keyof Item, value: string | boolean) => {
    const updatedItem = { ...item, [field]: value }
    setItem(updatedItem)
    onItemUpdate(updatedItem)
  }

  const handleMemberToggle = (member: string) => {
    const newMembers = item.members.includes(member)
      ? item.members.filter((m) => m !== member)
      : [...item.members, member]
    const updatedItem = { ...item, members: newMembers }
    setItem(updatedItem)
    onItemUpdate(updatedItem)
  }

  const handleSplitChange = (member: string, value: string) => {
    const numVal = parseFloat(value)
    const updatedItem = {
      ...item,
      split: {
        ...item.split,
        [member]: isNaN(numVal) || numVal <= 0 ? 1 : numVal
      }
    }
    setItem(updatedItem)
    onItemUpdate(updatedItem)
  }

  const resetSplit = () => {
    const updatedItem = {
      ...item,
      split: item.members.reduce((acc: Split, member) => {
        acc[member] = 1
        return acc
      }, {})
    }
    setItem(updatedItem)
    onItemUpdate(updatedItem)
  }

  return (
    <div className="p-4 bg-card rounded-lg space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`item-name-${item.id}`}>Item Name</Label>
        <Input
          id={`item-name-${item.id}`}
          value={item.name}
          onChange={(e) => handleFieldChange("name", e.target.value)}
          placeholder="Enter item name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`item-amount-${item.id}`}>Amount</Label>
        <Input
          id={`item-amount-${item.id}`}
          type="number"
          value={item.amount}
          onChange={(e) => handleFieldChange("amount", e.target.value)}
          placeholder="Enter amount"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`item-taxed-${item.id}`}
          checked={item.taxed}
          onCheckedChange={(checked) => handleFieldChange("taxed", Boolean(checked))}
        />
        <Label htmlFor={`item-taxed-${item.id}`}>Taxed</Label>
      </div>
      {item.taxed && item.amount && (
        <div className="text-sm text-muted-foreground">
          Amount with tax: ${calculateTaxedAmount(item.amount, item.taxed).toFixed(2)}
        </div>
      )}

      <div className="space-y-2">
        <Label>Split Between</Label>
        <div className="flex flex-wrap gap-2">
          {members.map((roommate) => (
            <Button
              key={roommate}
              variant={item.members.includes(roommate) ? "default" : "outline"}
              size="sm"
              onClick={() => handleMemberToggle(roommate)}
            >
              {roommate}
              {item.members.includes(roommate) ? <Minus className="ml-1 h-4 w-4" /> : <Plus className="ml-1 h-4 w-4" />}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <div>{itemString(item)}</div>
          {item.members.map((member) => (
            <span>
              {`${member}: $${(
                ((item.split[member] || 1) / item.members.length) *
                calculateTaxedAmount(item.amount, item.taxed)
              ).toFixed(2)}`}
            </span>
          ))}
        </div>
      </div>
      {item.members.length > 0 && (
        <UnequalSplitDrawer
          item={item}
          onSplitChange={handleSplitChange}
          onResetSplit={resetSplit}
          taxPercentage={taxPercentage}
        />
      )}
    </div>
  )
}

export default function Itemizer() {
  const [total, setTotal] = useState<string>("")
  const [taxPercentage, setTaxPercentage] = useState<string>("")
  const [items, setItems] = useState<Item[]>([INITIAL_ITEM])
  const [totalsVisible, setTotalsVisible] = useState<boolean>(true)
  const { members: membersData } = useOutletContext<{ members: Member[] }>()
  const [members] = useState(membersData.map((member) => member.name))
  const [memberTotals, setMemberTotals] = useState<Split>({})
  const [itemsTotal, setItemsTotal] = useState<number>(0)
  const [remaining, setRemaining] = useState<number>(0)
  const [splitBetween, setSplitBetween] = useState<string[]>([])

  const calculateTaxedAmount = useCallback(
    (amount: string, taxed: boolean) => {
      const itemAmount = parseFloat(amount) || 0
      const taxRate = (parseFloat(taxPercentage) || 0) / 100
      return taxed ? itemAmount * (1 + taxRate) : itemAmount
    },
    [taxPercentage]
  )

  useEffect(() => {
    const sumItemsTotal = items.reduce((sum, item) => {
      return sum + calculateTaxedAmount(item.amount, item.taxed)
    }, 0)
    setItemsTotal(sumItemsTotal)
    setRemaining(Math.max((parseFloat(total) || 0) - sumItemsTotal, 0))

    const newMemberTotals: Split = {}
    items.forEach((item) => {
      // Normalize splits
      const normalizedSplits = normalizeSplit(item)

      const totalWeight = getTotalWeight(normalizedSplits, item)
      const itemAmount = calculateTaxedAmount(item.amount, item.taxed)

      item.members.forEach((member) => {
        const memberShare = (normalizedSplits[member] / totalWeight) * itemAmount
        newMemberTotals[member] = (newMemberTotals[member] || 0) + memberShare
      })
    })
    setMemberTotals(newMemberTotals)
  }, [total, taxPercentage, items, calculateTaxedAmount])

  const handleItemUpdate = (updatedItem: Item) => {
    setItems((prevItems) => prevItems.map((it) => (it.id === updatedItem.id ? updatedItem : it)))
  }

  const handleSplitBetweenToggle = (member: string) => {
    setSplitBetween((prev) => (prev.includes(member) ? prev.filter((m) => m !== member) : [...prev, member]))
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 mt-16 mb-32 text-primary">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="total">Total Receipt Amount</Label>
          <Input
            id="total"
            type="number"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            placeholder="Enter total amount"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tax">Tax Percentage</Label>
          <Input
            id="tax"
            type="number"
            value={taxPercentage}
            onChange={(e) => setTaxPercentage(e.target.value)}
            placeholder="Enter tax percentage"
          />
        </div>
      </div>

      {Object.keys(memberTotals).length > 0 && (
        <div className="p-4 bg-background border-b sticky top-[75px]">
          <div className="flex-row flex justify-between">
            <h2 className="text-lg font-semibold mb-2">Member Totals</h2>
            <button
              className={cn(
                "hover:text-gray-600 transition-all duration-200 ease-in-out",
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
                {Object.entries(memberTotals).map(([member, totalVal]) => (
                  <div key={member} className="flex justify-between items-center">
                    <span>{member}:</span>
                    <span className="font-semibold">${totalVal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-2">
                <span>Item Total:</span>
                <span className="font-semibold">${itemsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Bill Total:</span>
                <span className="font-semibold">${parseFloat(total || "0").toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Remaining Total:</span>
                <span className="font-semibold">${remaining.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      )}

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
            const id = crypto.randomUUID()
            setItems((prev) => [...prev, { ...INITIAL_ITEM, id }])
          }}
        >
          <Plus />
        </Button>
      </div>

      {Math.round(remaining * 100) / 100 > 0 && (
        <div className="p-4 border rounded-md bg-background">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">Remaining Amount:</span>
            <span className="text-xl font-bold">${remaining.toFixed(2)}</span>
          </div>
          <div className="space-y-2">
            <Label>Split Remaining Between</Label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <Button
                  key={member}
                  variant={splitBetween.includes(member) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSplitBetweenToggle(member)}
                >
                  {member}
                  {splitBetween.includes(member) ? (
                    <Minus className="ml-1 h-4 w-4" />
                  ) : (
                    <Plus className="ml-1 h-4 w-4" />
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
