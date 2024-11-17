
import { useEffect } from "react" // shadcn components
import { MultiSelect } from "@/components/ui/multi-select"
import { Label } from "@/components/ui/label"
import CalculatorInput from "./../calculator-input"

interface PaidBy {
  member: string;
  amount: number;
}

interface PaidByFormProps {
  memberNames: string[];
  selectedExpense: {
    paidBy: PaidBy[];  // Define the type of `paidBy` in selectedExpense
  };
  paidBy: PaidBy[];
  setPaidBy: React.Dispatch<React.SetStateAction<PaidBy[]>>;
  amount: number;
  setAmount: React.Dispatch<React.SetStateAction<number>>;
}

const sumContributions = (contributions: PaidBy[]) => {
  return contributions.reduce((acc, curr) => acc + Number(curr.amount), 0);
};

const PaidByForm: React.FC<PaidByFormProps> = ({
  memberNames,
  selectedExpense,
  paidBy,
  setPaidBy,
  amount,
  setAmount
}) => {

  const onPaidByMembersChange = (values:string[]) => {
    if (values.length === 1) {
      setPaidBy([{ member: values[0], amount }])
      return
    }

    if (values.length !== 0 && paidBy.length === 0) {
      setPaidBy(
        values.map((member, index) => {
          if (index === 0) {
            return { member, amount: amount }
          } else {
            return { member, amount: 0 }
          }
        })
      )
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

  return (
    <div className="space-y-2">
      <Label>Paid By</Label>
      <MultiSelect
        options={memberNames.map((member) => ({
          label: member,
          value: member
        }))}
        defaultValue={selectedExpense.paidBy.map((p) => p.member)}
        onValueChange={onPaidByMembersChange}
      />

      {paidBy.length > 1 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {paidBy.map((payer, index) => (
            <div key={payer.member} className="flex items-center space-x-2 space-y-2">
              <div className="flex-grow">
                <CalculatorInput
                  value={payer.amount}
                  useLabel={true}
                  label={payer.member}
                  onChange={(value) => handlePaidByChange(value, index)}
                />
              </div>
            </div>
          ))}{" "}
        </div>
      )}
    </div>
  )
}

export {PaidByForm}