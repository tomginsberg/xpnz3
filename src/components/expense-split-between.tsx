import React, { useEffect, useState } from "react"
import { MultiSelect } from "@/components/ui/multi-select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import CalculatorInput from "@/components/calculator-input"

interface Split {
  member: string
  weight: number
  amount?: number
}

interface SplitBetweenFormProps {
  memberNames: string[]
  splitBetween: Split[]
  setSplitBetween: React.Dispatch<React.SetStateAction<Split[]>>
  isIncome: boolean
}

function areWeightsDifferent(arr: Split[]) {
  const weights = arr.map((item) => item.weight)
  return new Set(weights).size !== 1
}

function areMultipleSplitters(arr: Split[]) {
  return arr.length > 1
}

const SplitBetweenForm: React.FC<SplitBetweenFormProps> = ({
  memberNames,
  splitBetween,
  setSplitBetween,
  isIncome
}) => {
  // Initialize isUnequalSplit from current splitBetween
  const [isUnequalSplit, setIsUnequalSplit] = useState(areWeightsDifferent(splitBetween))

  // Re-derive isUnequalSplit if splitBetween changes (e.g., editing a different expense)
  useEffect(() => {
    setIsUnequalSplit(areWeightsDifferent(splitBetween))
    console.log("splitBetween changed", splitBetween)
  }, [splitBetween])

  const isSplitByMultiple = areMultipleSplitters(splitBetween)

  function onSplitBetweenMembersChange(values: string[]) {
    setSplitBetween(
      values.map((member) => {
        const existing = splitBetween.find((s) => s.member === member)
        return existing || { member, weight: 1 }
      })
    )
  }

  function onUnequalSplitWeightChange(value: number, index: number) {
    setSplitBetween((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], weight: value }
      return updated
    })
  }

  // Handle toggling of unequal split directly here.
  // If toggled off, reset all weights to 1 immediately.
  const handleToggleUnequalSplit = (checked: boolean) => {
    setIsUnequalSplit(checked)
    if (!checked) {
      setSplitBetween((prev) => prev.map((s) => ({ ...s, weight: 1 })))
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Split Between</Label>
        <div className="flex items-center space-x-2">
          <Label htmlFor="unequal-split" className={!isSplitByMultiple ? "text-muted" : ""}>
            Unequal Split
          </Label>
          <Switch
            disabled={!isSplitByMultiple}
            id="unequal-split"
            checked={isUnequalSplit}
            onCheckedChange={handleToggleUnequalSplit}
          />
        </div>
      </div>

      <MultiSelect
        // defaultValue={splitBetween.map((s) => s.member)}
        options={memberNames.map((member) => ({ label: member, value: member }))}
        value={splitBetween.map((s) => s.member)}
        onValueChange={onSplitBetweenMembersChange}
      />

      {isUnequalSplit && (
        <div className="grid grid-cols-2 gap-2">
          {splitBetween.map((splitter, index) => (
            <div key={splitter.member} className="flex items-center space-x-2">
              <div className="flex-grow">
                <CalculatorInput
                  value={splitter.weight}
                  onChange={(value) => onUnequalSplitWeightChange(value, index)}
                  disabled={!isUnequalSplit}
                  useLabel={true}
                  label={splitter.member}
                  isIncome={isIncome}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export { SplitBetweenForm }
