// React and libraries
import React, { useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"

// External icons
import { Check, CircleCheckBig, Share2, SquareArrowUpLeft } from "lucide-react"

// Internal hooks

// Internal utilities
import { getDateString } from "@/api/utilities.js"

// Internal components
import { Button } from "@/components/ui/button"
import { ConfettiButton } from "@/components/ui/confetti"
import AnimatedTextImageBlock from "@/components/animated-text-image-block.jsx"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from "@/components/ui/drawer"

import { useParams, useOutletContext } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"

const mapMemberToMemberId = (memberName, members) => {
  const m = members.find((member) => member.name == memberName)
  return m.id
}

const DebtsTab = () => {
  const { ledgerName } = useParams()
  const { toast } = useToast()
  const { loaded, settlement: trueSettlement, members: members, pushExpense: pushExpense } = useOutletContext()
  const { currency } = useOutletContext()

  const xpnzApi = {
    // Order should be [Payer, Payee, Amount]
    debts: trueSettlement.map(({ payer, payee, amount }) => [payer, payee, amount]),
    settleDebt: ({ from: memberFrom, to: memberTo, amount: amount }) => {
      const expenseName = `${memberFrom} → ${memberTo}`
      const category = "💸 Transfer"
      const dateString = getDateString()
      const expense_type = "transfer"
      const contributions = [
        { id: mapMemberToMemberId(memberFrom, members), paid: amount, weight: 0 },
        { id: mapMemberToMemberId(memberTo, members), paid: 0, weight: 1 }
      ]

      pushExpense(expenseName, currency, category, dateString, expense_type, contributions)
    }
  }
  const [debts, setDebts] = useState(xpnzApi.debts)

  useEffect(() => {
    setDebts(xpnzApi.debts)
  }, [trueSettlement])

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

  const settleDebt = useCallback(
    (memberFrom, memberTo, amount) => {
      setSettleVisible(false)
      console.log(`Settling $${amount} from ${memberFrom} to ${memberTo}`)
      setDebts(debts.filter((debt) => debt[0] !== memberFrom || debt[1] !== memberTo || debt[2] !== amount))
      xpnzApi.settleDebt({
        from: memberFrom,
        to: memberTo,
        amount: amount
      })
    },
    [debts, xpnzApi]
  )

  function handleSubmit(e) {
    e.preventDefault()
    settleDebt(settleMemberFrom, settleMemberTo, settleAmount)
    toast({
      title: "Debt settled",
      description: `Settled $${settleAmount} from ${settleMemberFrom} to ${settleMemberTo}`,
      variant: "default"
    })
  }

  const copyDebts = async () => {
    let text = debts.map((debt) => `${debt[0]} → ${debt[1]}: $${debt[2]}`).join("\n")
    console.log(text)

    text = `📈 Debts\n\n${text}\n\nsee expenses @ https://xpnz.ca/${ledgerName}`

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
    <div className="mt-[85px] px-2 pb-64">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pb-3">
        {debts.map((member, index) => (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            key={index}
            className="flex items-center rounded-lg bg-card p-4"
          >
            <div className="flex-1">
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
                {member[0]} → {member[1]}
              </h2>
              <p className="mt-1 font-normal tracking-tight text-gray-700 dark:text-gray-400">${member[2]}</p>
            </div>
            <Button
              variant="ghost"
              className="transition-none h-10 w-10 scale-125"
              onClick={() => openSettleDialog(member[0], member[1], member[2])}
            >
              <CircleCheckBig className="text-gray-700 dark:text-gray-200" />
            </Button>
          </motion.div>
        ))}
      </div>

      {debts.length !== 0 && loaded && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.5 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex justify-start"
        >
          <Button
            onClick={copyDebts}
            variant={"outline"}
            className={`transition-none rounded-lg p-3 text-primary ${buttonClass} w-full sm:w-auto`}
          >
            {" "}
            Send Debts
            {!animationComplete ? <Share2 className="w-5 h-6" /> : <Check className="w-5 h-6" />}
          </Button>
        </motion.div>
      )}

      {debts.length === 0 && loaded && (
        <AnimatedTextImageBlock
          image="https://fonts.gstatic.com/s/e/notoemoji/latest/1f942/512.gif"
          imageAlt="🥂"
          title="Everyone is settled up"
          subtitle="Add more expensed to see debts"
        />
      )}

      <Drawer open={settleVisible} onOpenChange={setSettleVisible}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-lg text-primary">
            <DrawerHeader>
              <DrawerTitle className="text-5xl text-center">💸 💸 💸</DrawerTitle>
              <DrawerDescription className="sr-only">Settle up drawer</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 text-center text-xl mb-5 hyphens-auto text-wrap font-normal text-primary flex flex-col gap-1 justify-center">
              <div>Settle ${settleAmount} from</div>
              <div className="font-bold">
                {settleMemberFrom} → {settleMemberTo}
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <DrawerFooter className="flex flex-row w-full justify-center">
                <DrawerClose asChild>
                  <Button variant="outline">
                    <span className="mr-2">
                      <SquareArrowUpLeft className="size-4" />
                    </span>{" "}
                    Cancel
                  </Button>
                </DrawerClose>
                <ConfettiButton className="flex-grow" type="submit">
                  Settle Up!
                </ConfettiButton>
              </DrawerFooter>
            </form>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

export default DebtsTab
