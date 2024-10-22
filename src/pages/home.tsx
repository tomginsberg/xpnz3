import { ChevronsUpDown } from "lucide-react"

import React, { useState } from "react"
import { Input } from "../components/ui/input"
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

export function Combobox() {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" role="combobox" aria-expanded={open} className="w-full justify-between">
          Find a ledger...
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
                  onSelect={() => {
                    navigate(`/${ledger.value}`)
                  }}
                >
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
            <Combobox />
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
