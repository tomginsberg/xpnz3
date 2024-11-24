import React, { useEffect, useState } from "react" // shadcn components
import { MultiSelect } from "@/components/ui/multi-select.tsx"
import { Switch } from "@/components/ui/switch.tsx" // icons
import { Label } from "@/components/ui/label.tsx"
import CalculatorInput from "./calculator-input.tsx"

interface Split {
  member: string
  weight: number
}

interface SplitBetweenFormProps {
  isSplitByMultiple: boolean
  isUnequalSplit: boolean
  setIsUnequalSplit: React.Dispatch<React.SetStateAction<boolean>>
  setIsSplitByMultiple: React.Dispatch<React.SetStateAction<boolean>> // Add setter for isSplitByMultiple
  memberNames: string[]
  selectedExpense: { splitBetween: Split[] }
  onSplitBetweenMembersChange: (newMembers: string[]) => void
  splitBetween: Split[]
  setSplitBetween: React.Dispatch<React.SetStateAction<{ member: string; weight: number }[]>>
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
  selectedExpense,
  splitBetween,
  setSplitBetween,
  isIncome
}) => {
  const [isUnequalSplit, setIsUnequalSplit] = useState(areWeightsDifferent(selectedExpense.splitBetween))
  const [isSplitByMultiple, setIsSplitByMultiple] = useState(areMultipleSplitters(selectedExpense.splitBetween))

  function onSplitBetweenMembersChange(
    values: string[], // Array of selected member names
    setSplitBetween: React.Dispatch<React.SetStateAction<Split[]>>, // Setter for splitBetween state
    splitBetween: Split[] // Current splitBetween state
  ) {
    setSplitBetween(
      values.map((member) => {
        const existing = splitBetween.find((s) => s.member === member)
        return existing || { member, weight: 1 }
      })
    )
  }

  function onUnequalSplitWeightChange(value: number, index: number) {
    setSplitBetween((prev) => {
      const newSplitBetween = [...prev]
      newSplitBetween[index] = {
        ...newSplitBetween[index],
        weight: value
      }
      return newSplitBetween
    })
  }

  useEffect(() => {
    if (splitBetween.length <= 1) {
      setIsSplitByMultiple(false)
      setIsUnequalSplit(false)
    } else {
      setIsSplitByMultiple(true)
    }
  }, [splitBetween])

  useEffect(() => {
    if (!isUnequalSplit) {
      setSplitBetween((prev) => prev.map((s) => ({ member: s.member, weight: 1 })))
    }
  }, [isUnequalSplit])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Split Between</Label>
        <div className="flex items-center space-x-2">
          <Label htmlFor="unequal-split" className={String(!isSplitByMultiple && "text-muted")}>
            Unequal Split
          </Label>
          <Switch
            disabled={!isSplitByMultiple}
            id="unequal-split"
            checked={isUnequalSplit}
            onCheckedChange={setIsUnequalSplit}
          />
        </div>
      </div>

      <MultiSelect
        options={memberNames.map((member) => ({
          label: member,
          value: member
        }))}
        defaultValue={selectedExpense.splitBetween.map((s) => s.member)}
        onValueChange={(values) => onSplitBetweenMembersChange(values, setSplitBetween, splitBetween)}
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
