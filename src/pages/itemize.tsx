import { useState, useEffect } from "react"
import { Plus, Minus, ChevronDown } from "lucide-react"
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

const INITIAL_ITEM: Item = { id: crypto.randomUUID(), name: "", amount: "", taxed: false, members: [], split: {} }

export default function Itemizer() {
  const [total, setTotal] = useState<string>("")
  const [taxPercentage, setTaxPercentage] = useState<string>("")
  const [items, setItems] = useState<Item[]>([INITIAL_ITEM])
  const [remaining, setRemaining] = useState<number>(0)
  const [splitBetween, setSplitBetween] = useState<string[]>([])
  const { members: membersData } = useOutletContext<{ members: Member[] }>()
  const [members] = useState(membersData.map((member: { name: string }) => member.name))
  const [memberTotals, setMemberTotals] = useState<Split>({})
  const [itemsTotal, setItemsTotal] = useState<number>(0)

  useEffect(() => {
    const sumItemsTotal = items.reduce((sum, item) => {
      const itemAmount = parseFloat(item.amount) || 0
      const taxRate = (parseFloat(taxPercentage) || 0) / 100
      return sum + (item.taxed ? itemAmount * (1 + taxRate) : itemAmount)
    }, 0)
    setItemsTotal(sumItemsTotal)
    setRemaining(Math.max((parseFloat(total) || 0) - sumItemsTotal, 0))

    const newMemberTotals: Split = {}
    items.forEach((item) => {
      const itemAmount = calculateTaxedAmount(item.amount, item.taxed)
      const splitCount = Object.values(item.split).reduce((a, b) => a + b, 0) || item.members.length
      item.members.forEach((member) => {
        const memberShare = ((item.split[member] || 1) / splitCount) * itemAmount
        newMemberTotals[member] = (newMemberTotals[member] || 0) + memberShare
      })
    })
    setMemberTotals(newMemberTotals)
  }, [total, taxPercentage, items])

  const handleItemChange = (id: string, field: keyof Item, value: string | boolean) => {
    const newItems = items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    setItems(newItems)

    if (id === items[items.length - 1].id && value !== "") {
      setItems([...newItems, { ...INITIAL_ITEM, id: crypto.randomUUID() }])
    }
  }

  const handleMemberToggle = (id: string, member: string) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const newMembers = item.members.includes(member)
            ? item.members.filter((m) => m !== member)
            : [...item.members, member]
          return { ...item, members: newMembers }
        }
        return item
      })
    )
  }

  const handleSplitBetweenToggle = (member: string) => {
    setSplitBetween((prev) => (prev.includes(member) ? prev.filter((m) => m !== member) : [...prev, member]))
  }

  const calculateTaxedAmount = (amount: string, taxed: boolean) => {
    const itemAmount = parseFloat(amount) || 0
    const taxRate = (parseFloat(taxPercentage) || 0) / 100
    return taxed ? itemAmount * (1 + taxRate) : itemAmount
  }

  const handleSplitChange = (id: string, member: string, value: string) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, split: { ...item.split, [member]: parseInt(value) || 0 } }
        }
        return item
      })
    )
  }

  const resetSplit = (id: string) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, split: {} }
        }
        return item
      })
    )
  }
  useEffect(() => {
    console.log("members", memberTotals, memberTotals.length)
  }, [memberTotals])

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

      {Object.keys(memberTotals).length > 0 && (
        <div className="p-4 bg-background border-b sticky top-[75px]">
          <div className="flex-row flex justify-between">
            <h2 className="text-lg font-semibold mb-2">Member Totals</h2>
            <button className="hover:text-gray-600">
              <ChevronDown />
            </button>
          </div>
          <div className="border-b pb-1">
            {Object.entries(memberTotals).map(([member, total]) => (
              <div key={member} className="flex justify-between items-center">
                <span>{member}:</span>
                <span className="font-semibold">${total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-2">
            <span>Item Total:</span>
            <span className="font-semibold">${itemsTotal}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Bill Total:</span>
            <span className="font-semibold">${total}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Remaining Total:</span>
            <span className="font-semibold">${remaining}</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Items</h2>
        {items.map((item) => (
          <div key={item.id} className="p-4 bg-card rounded-lg space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`item-name-${item.id}`}>Item Name</Label>
                <Input
                  id={`item-name-${item.id}`}
                  value={item.name}
                  onChange={(e) => handleItemChange(item.id, "name", e.target.value)}
                  placeholder="Enter item name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`item-amount-${item.id}`}>Amount</Label>
                <Input
                  id={`item-amount-${item.id}`}
                  type="number"
                  value={item.amount}
                  onChange={(e) => handleItemChange(item.id, "amount", e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`item-taxed-${item.id}`}
                  checked={item.taxed}
                  onCheckedChange={(checked) => handleItemChange(item.id, "taxed", checked)}
                />
                <Label htmlFor={`item-taxed-${item.id}`}>Taxed</Label>
              </div>
              {item.taxed && item.amount && (
                <div className="text-sm text-muted-foreground">
                  Amount with tax: ${calculateTaxedAmount(item.amount, item.taxed).toFixed(2)}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Split Between</Label>
              <div className="flex flex-wrap gap-2">
                {members.map((roommate) => (
                  <Button
                    key={roommate}
                    variant={item.members.includes(roommate) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleMemberToggle(item.id, roommate)}
                  >
                    {roommate}
                    {item.members.includes(roommate) ? (
                      <Minus className="ml-1 h-4 w-4" />
                    ) : (
                      <Plus className="ml-1 h-4 w-4" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
            {item.members.length > 0 && (
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline">Unequal Split</Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Unequal Split for {item.name}</DrawerTitle>
                    <DrawerDescription>Set split weights for each member</DrawerDescription>
                  </DrawerHeader>
                  <div className="py-4 space-y-4">
                    {item.members.map((member) => (
                      <div key={member} className="flex items-center justify-between">
                        <Label htmlFor={`split-${item.id}-${member}`}>{member}</Label>
                        <Input
                          id={`split-${item.id}-${member}`}
                          type="number"
                          value={item.split[member] || ""}
                          onChange={(e) => handleSplitChange(item.id, member, e.target.value)}
                          className="w-20"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="font-semibold">Preview:</div>
                    {item.members.map((member) => {
                      const totalWeight = Object.values(item.split).reduce((a, b) => a + b, 0) || item.members.length
                      const memberShare =
                        ((item.split[member] || 1) / totalWeight) * calculateTaxedAmount(item.amount, item.taxed)
                      return (
                        <div key={member} className="flex justify-between">
                          <span>{member}:</span>
                          <span>${memberShare.toFixed(2)}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 space-x-2">
                    <Button onClick={() => resetSplit(item.id)}>Remove Split</Button>
                  </div>
                </DrawerContent>
              </Drawer>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
