import React, { useState } from "react"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"

import { Check, CircleCheckBig, ClipboardCheck, Share2 } from "lucide-react"
import { useParams } from "react-router-dom"
import { motion } from "framer-motion"

const DebtsTab = () => {
  const xpnzApi = {
    debts: [
      ["Alice", "Bob", 20],
      ["Bob", "Charlie", 30],
      ["Charlie", "Alice", 40]
    ],
    settleDebt: () => {
      console.log("Settling debt")
    }
  }

  const [debts, setDebts] = useState(xpnzApi.debts)
  const [loaded, setLoaded] = useState(true)
  const { ledgerName } = useParams()
  const [settleVisible, setSettleVisible] = useState(false)
  const [settleMemberFrom, setSettleMemberFrom] = useState("")
  const [settleMemberTo, setSettleMemberTo] = useState("")
  const [settleAmount, setSettleAmount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)
  const [buttonClass, setButtonClass] = useState("")

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

    text = `📈 Debts\n\n${text}\n\nsee expenses @ https://www.xpnz.ca/${ledgerName}`

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
      setButtonClass("")
    }, 1500)
  }

  return (
    <div className="mt-[85px] px-2">
      {debts.map((member, index) => (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
          key={index}
          className="flex items-center rounded-lg bg-card p-4 my-3"
        >
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
        </motion.div>
      ))}

      {debts.length !== 0 && loaded && (
        <motion.div
          initial={{ opacity: 0, x: -200, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
          className=""
        >
          <Button onClick={copyDebts} variant={"outline"} className={`rounded-lg p-3 text-primary ${buttonClass}`}>
            {!animationComplete ? <Share2 className="w-5 h-6" /> : <Check className="w-5 h-6" />}
          </Button>
        </motion.div>
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
