import React, { useState, useEffect } from "react"
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"

import { Check, Edit3, Trash, ClipboardCheck, Share, CircleCheckBig } from "lucide-react"
// import { useXpnzApi } from "@/hooks/useXpnzApi"
import { useParams } from "react-router-dom"

function useXpnzApi(ledgerId) {
  return {
    debts: [
      ["Alice", "Bob", 20],
      ["Bob", "Charlie", 30],
      ["Charlie", "Alice", 40]
    ],
    settleDebt: () => {
      console.log("Settling debt")
    }
  }
}

const DebtsTab = () => {
  const [debts, setDebts] = useState([])
  const [loaded, setLoaded] = useState(false)
  const { ledgerId } = useParams()
  const [settleVisible, setSettleVisible] = useState(false)
  const [settleMemberFrom, setSettleMemberFrom] = useState("")
  const [settleMemberTo, setSettleMemberTo] = useState("")
  const [settleAmount, setSettleAmount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)
  const [buttonClass, setButtonClass] = useState(
    "bg-gray-200 hover:bg-blue-500 dark:bg-gray-700 dark:hover:bg-blue-600"
  )

  const xpnzApi = useXpnzApi(ledgerId)

  useEffect(() => {
    const fetchDebts = () => {
      const debtsData = xpnzApi.debts
      setDebts(debtsData)
      setLoaded(true)
    }
    fetchDebts()
  }, [ledgerId, xpnzApi])

  const openSettleDialog = (memberFrom, memberTo, amount) => {
    setSettleMemberFrom(memberFrom)
    setSettleMemberTo(memberTo)
    setSettleAmount(amount)
    setSettleVisible(true)
  }

  const settleDebt = (memberFrom, memberTo, amount) => {
    setSettleVisible(false)
    console.log(`Settling $${amount} from ${memberFrom} to ${memberTo}`)
    setDebts(debts.filter((debt) => debt[0] !== memberFrom || debt[1] !== memberTo || debt[2] !== amount))
    xpnzApi.settleDebt({
      from: memberFrom,
      to: memberTo,
      amount: amount
    })
  }

  const copyDebts = async () => {
    let text = debts.map((debt) => `${debt[0]} → ${debt[1]}: $${debt[2]}`).join("\n")
    console.log(text)

    text = `📈 Debts\n\n${text}\n\nsee expenses @ https://www.xpnz.ca/${ledgerId}`

    if (navigator.share) {
      await navigator.share({ text })
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
    } else {
      alert(text)
    }

    // Trigger the animation and checkmark
    setCopied(true)
    setButtonClass("animate-button-transition bg-green-500")
    setTimeout(() => {
      setAnimationComplete(true)
    }, 500)
    setTimeout(() => {
      setCopied(false)
      setAnimationComplete(false)
      setButtonClass("bg-gray-200 hover:bg-blue-500 dark:bg-gray-700 dark:hover:bg-blue-600")
    }, 1500)
  }

  return (
    <div className="mt-[85px] px-2">
      {debts.map((member, index) => (
        <div key={index} className="flex items-center rounded-lg bg-card p-4 my-3">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {member[0]} → {member[1]}
            </h2>
            <p className="mt-1 font-normal tracking-tight text-gray-700 dark:text-gray-400">${member[2]}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="mx-1 transition-none"
            onClick={() => openSettleDialog(member[0], member[1], member[2])}
          >
            <CircleCheckBig className="text-gray-700 dark:text-gray-200" />
          </Button>
        </div>
      ))}

      {debts.length !== 0 && loaded && (
        <div className="flex w-8">
          <Button onClick={copyDebts} className={`rounded-lg p-3 shadow-lg dark:text-white ${buttonClass}`}>
            {!animationComplete ? <ClipboardCheck className="w-5 h-6" /> : <Check className="w-5 h-6" />}
          </Button>
        </div>
      )}

      {debts.length === 0 && loaded && (
        <div className="flex flex-col items-center justify-center">
          <h2 className="px-8 pt-16 text-center font-mono text-2xl font-bold text-gray-900 dark:text-white">
            Looking good! <br />
            No debts to settle.
          </h2>
          <img
            className="my-8 max-w-xs object-contain px-8"
            src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f9a7/512.gif"
            alt="🦧"
          />
        </div>
      )}

      <Drawer open={settleVisible} onOpenChange={setSettleVisible}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-lg text-primary">
            <DrawerHeader>
              <DrawerTitle>Settle Debt</DrawerTitle>
              <DrawerDescription>Confirm settling the debt amount.</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 text-center">
              {/*<h2 className="pb-3 text-2xl font-bold text-gray-900 dark:text-white">💸 💸 💸</h2>*/}
              <h3 className="mb-5 hyphens-auto text-wrap text-lg font-normal text-gray-500 dark:text-gray-400">
                Settle ${settleAmount} from <span className="font-bold">{settleMemberFrom}</span> →{" "}
                <span className="font-bold">{settleMemberTo}</span>
              </h3>
            </div>
            <DrawerFooter>
              <Button onClick={() => settleDebt(settleMemberFrom, settleMemberTo, settleAmount)}>Submit</Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

export default DebtsTab
