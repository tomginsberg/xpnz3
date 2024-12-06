import React, { useEffect } from "react" // shadcn components
import { MultiSelect } from "@/components/ui/multi-select.tsx"
import { Label } from "@/components/ui/label.tsx"
import CalculatorInput from "./calculator-input.tsx"

interface PaidBy {
  member: string
  amount: number
}

interface PaidByFormProps {
  memberNames: string[]
  selectedExpense: {
    paidBy: PaidBy[] // Define the type of `paidBy` in selectedExpense
    amount: number
  }
  paidBy: PaidBy[]
  setPaidBy: React.Dispatch<React.SetStateAction<PaidBy[]>>
  amount: number
  setAmount: React.Dispatch<React.SetStateAction<number>>
  isIncome: boolean
}

const sumContributions = (contributions: PaidBy[]) => {
  return contributions.reduce((acc, curr) => acc + Number(curr.amount), 0)
}

const PaidByForm: React.FC<PaidByFormProps> = ({
  memberNames,
  selectedExpense,
  paidBy,
  setPaidBy,
  amount,
  setAmount,
  isIncome
}) => {
  const onPaidByMembersChange = (values: string[]) => {
    const oldMembers = paidBy
    if (oldMembers.length === 0 && values.length >= 1) {
      setPaidBy(() => {
        const newMembers: PaidBy[] = []
        values.forEach((item, index) => {
          if (index === 0) {
            newMembers[index] = { member: item, amount: amount }
          } else {
            newMembers[index] = { member: item, amount: 0 }
          }
        })
        return newMembers
      })
    } else {
      setPaidBy(
        values.map((member) => {
          const existing = paidBy.find((p) => p.member === member)
          return existing || { member, amount: 0 }
        })
      )
    }
  }

  function handlePaidByChange(value: number, index: number) {
    setPaidBy((prev) => {
      const paidBy = [...prev]
      paidBy[index] = { ...paidBy[index], amount: value }
      return paidBy
    })
  }

  useEffect(() => {
    if (paidBy.length === 1) {
      setAmount(amount)
    } else if (paidBy.length > 1) {
      setAmount(sumContributions(paidBy))
    }
  }, [paidBy])

  useEffect(() => {
    if (amount) {
      setAmount(Math.round(amount * 100) / 100)
    }
    if (paidBy.length == 1) {
      setPaidBy([{ member: paidBy[0].member, amount: amount }])
    }
    return
  }, [amount])

  // This function has to come after the above useEffects
  // On a change in selectedExpense, the amount should be set to the selectedExpense
  // Some weird state issue is occurring and this seems to fix it
  useEffect(() => {
    setAmount(selectedExpense.amount)
  }, [selectedExpense])

  return (
    <div className="space-y-2">
      <Label>{isIncome ? "Paid To" : "Paid By"}</Label>
      <MultiSelect
        options={memberNames.sort().map((member) => ({
          label: member,
          value: member
        }))}
        value={paidBy.map((p) => p.member)}
        onValueChange={onPaidByMembersChange}
      />

      {paidBy.length > 1 && (
        <div className="grid grid-cols-2 gap-2">
          {paidBy.map((payer, index) => (
            <div key={payer.member} className="flex items-center space-x-2 space-y-2">
              <div className="flex-grow">
                <CalculatorInput
                  value={payer.amount}
                  useLabel={true}
                  label={payer.member}
                  onChange={(value) => handlePaidByChange(value, index)}
                  isIncome={isIncome}
                />
              </div>
            </div>
          ))}{" "}
        </div>
      )}
    </div>
  )
}

export { PaidByForm }
