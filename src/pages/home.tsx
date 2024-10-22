import { ArrowUpRightSquareIcon, Check, ChevronsUpDown, Moon, Search, Sun } from "lucide-react"

import React, { useEffect, useState } from "react"
import RetroGrid from "../components/ui/retro-grid"
import { Input } from "../components/ui/input"

import AnimatedExpenseCard from "../components/landing-card"

import Masonry from "react-masonry-css"
import { useTheme } from "@/components/theme-provider"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from "@/components/ui/drawer"
import { Label } from "../components/ui/label"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const sampleLedgers = [
  { label: "Trap 2", value: "trap2", icon: "Plane" },
  { label: "Trap", value: "trap", icon: "Home" },
  { label: "Test", value: "test", icon: "Utensils" },
  { label: "Lions Head", value: "lionshead", icon: "Users" },
  { label: "Camping", value: "camping", icon: "Users" }
]

export function Combobox({ value, setValue }: { value: string; setValue: (value: string) => void }) {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" role="combobox" aria-expanded={open} className="w-full justify-between">
          {value ? value : "Find a ledger..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Find a ledger..." className="text-primary" />
          <CommandList>
            <CommandEmpty>No ledger found.</CommandEmpty>
            <CommandGroup>
              {sampleLedgers.map((ledger) => (
                <CommandItem
                  key={ledger.value}
                  value={ledger.label}
                  onSelect={(x) => {
                    navigate(`/${ledger.value}`)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === ledger.value ? "opacity-100" : "opacity-0")} />
                  {ledger.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default function Home() {
  const { setTheme } = useTheme()
  setTheme("light")
  const [selectedLedger, setSelectedLedger] = useState("")
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [newLedgerName, setNewLedgerName] = useState("")
  const [newLedgerIcon, setNewLedgerIcon] = useState("")
  const [newLedgerMembers, setNewLedgerMembers] = useState("")
  const [step, setStep] = useState(1)

  return (
    <>
      <div className="min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-transparent border border-white text-white rounded-lg shadow-xl p-8 w-full max-w-md"
        >
          <motion.div
            initial={{ opacity: 0, y: -200, scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 2, bounce: 0.5, type: "spring" }}
            className="mb-4"
          >
            <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f4b8/512.gif" alt="Group Expense" />
          </motion.div>
          <h1 className="text-4xl font-bold text-center mb-6">xpnz</h1>
          <p className="text-center mb-6">Track group expenses with ease</p>

          <div className="mb-6">
            <Combobox value={selectedLedger} setValue={setSelectedLedger} />
          </div>

          <Button
            onClick={() => setIsCreateDrawerOpen(true)}
            className="w-full border border-gray-400 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded-lg"
          >
            Create New Ledger
          </Button>
        </motion.div>
      </div>
      <Drawer open={isCreateDrawerOpen} onOpenChange={setIsCreateDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{step === 1 ? "Create New Ledger" : "Add Members"}</DrawerTitle>
            <DrawerDescription>
              {step === 1
                ? "Enter a name and choose an icon for your new ledger."
                : "Don't worry, you can add more members later!"}
            </DrawerDescription>
          </DrawerHeader>
          {step === 1 ? (
            <>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newLedgerName}
                    onChange={(e) => setNewLedgerName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="icon" className="text-right">
                    Icon
                  </Label>
                  <select
                    id="icon"
                    value={newLedgerIcon}
                    onChange={(e) => setNewLedgerIcon(e.target.value)}
                    className="col-span-3"
                  >
                    <option value="">Select an icon</option>
                    <option value="Plane">✈️ Plane</option>
                    <option value="Home">🏠 Home</option>
                    <option value="Utensils">🍴 Utensils</option>
                  </select>
                </div>
              </div>
              <DrawerFooter>
                <Button type="submit" onClick={() => setStep(2)}>
                  Next
                </Button>
              </DrawerFooter>
            </>
          ) : (
            <>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="members" className="text-right">
                    Members
                  </Label>
                  <Input
                    id="members"
                    value={newLedgerMembers}
                    onChange={(e) => setNewLedgerMembers(e.target.value)}
                    className="col-span-3"
                    placeholder="Enter member names, separated by commas"
                  />
                </div>
              </div>
              <DrawerFooter>
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit">Create Ledger</Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

export function Home2() {
  const [ledgerName, setLedgerName] = useState("")
  const [showMemberInput, setShowMemberInput] = useState(false)
  const [memberName, setMemberName] = useState("")
  const [members, setMembers] = useState<string[]>([])
  const [cardCount, setCardCount] = useState(1)

  const [themeName, setThemeName] = useState(localStorage.getItem("vite-ui-theme") || "dark")

  const { setTheme } = useTheme()
  const navigate = useNavigate()

  function toggleTheme() {
    const newTheme = themeName === "dark" ? "light" : "dark"
    setTheme(newTheme)
    setThemeName(newTheme)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (cardCount > 10) {
        setCardCount(1)
      } else {
        setCardCount(cardCount + 1)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [cardCount])

  const handleCreateLedger = (e: React.FormEvent) => {
    e.preventDefault()
    if (ledgerName) {
      setShowMemberInput(true)
    }
  }

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (memberName && !members.includes(memberName)) {
      setMembers([...members, memberName])
      setMemberName("")
    }
  }

  const handleRemoveMember = (member: string) => {
    setMembers(members.filter((m) => m !== member))
  }

  // make the button route to the ledger page at /ledgerName
  // im using next file based router
  const handleSubmit = () => {
    // if the ledger name is empty, do nothing
    if (!ledgerName) return
    navigate(`/${ledgerName}`)
  }
  return (
    <div className="h-full  min-h-screen bg-gradient-to-b from-[#ffd319] via-[#ff2975] to-[#8c1eff]">
      <div className="z-0">
        <RetroGrid />
      </div>

      <div className="flex flex-col">
        <div className="flex items-start">
          <div className="w-full max-w-4xl mx-auto px-4 pt-8 pb-4">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold leading-none tracking-tight mb-4 md:mb-8 text-center text-black">
              xpnz
            </h1>
            <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl border border-black p-6 md:p-8">
              <form className="w-full max-w-md mx-auto" onSubmit={handleSubmit}>
                <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 block text-center">
                  Find or Create your Ledger!
                </label>
                <div className="relative w-full max-w-md mt-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" size={20} />
                  <Input
                    value={ledgerName}
                    onChange={(e) => setLedgerName(e.target.value)}
                    // type="search"
                    className="text-black w-full pl-12 pr-12 py-2 bg-transparent backdrop-blur-2xl border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
                  />

                  <ArrowUpRightSquareIcon
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black hover:text-blue-400 rounded-full"
                    onClick={handleSubmit}
                    size={20}
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
        {/*<div className="columns-2 gap-x-4 space-y-4 px-4 pb-4">*/}
        {/*create `cardCount` AnimatedExpenseCards*/}
        <Masonry
          className="flex w-auto gap-x-4 gap-y-4 px-4"
          breakpointCols={{
            default: 4,
            1100: 4,
            700: 3,
            500: 2
          }}
        >
          {Array.from({ length: cardCount }).map((_, i) => (
            <div className="py-2" key={i}>
              <AnimatedExpenseCard />
            </div>
          ))}
        </Masonry>
        {/*</div>*/}
      </div>

      <div className="absolute right-2 top-1 z-10">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          <Sun className="absolute h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-black" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
        </Button>
      </div>
    </div>
  )
}
