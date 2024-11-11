import { AlertCircle, ChevronsUpDown } from "lucide-react"

import { useEffect, useState } from "react"
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

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FloatingLabelInput } from "@/components/ui/floating-label"

import { api } from "@/../xpnz.config.js"
import { TagInput } from "emblor"

const sampleLedgers = [
  { label: "Trap 2", value: "trap2", icon: "Plane" },
  { label: "Trap", value: "trap", icon: "Home" },
  { label: "Test", value: "test", icon: "Utensils" },
  { label: "Lions Head", value: "lionshead", icon: "Users" },
  { label: "Camping", value: "camping", icon: "Users" }
]

export function Combobox({ values }) {
  const [open, setOpen] = useState(false)
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
              {values.map(({ key, value, link }) => (
                <CommandItem
                  key={key}
                  value={value}
                  onSelect={() => {
                    navigate(`/${link}`)
                  }}
                >
                  {value}
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
  const [name, setName] = useState("")
  const [newLedgerMembers, setNewLedgerMembers] = useState([])
  const [step, setStep] = useState(1)
  const [error, setError] = useState("")
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null)

  const [ledgers, setLedgers] = useState([])

  useEffect(() => {
    const getLedgers = async () => {
      const response = await fetch(`${api.base}/ledgers`, { cache: "no-store" })
      const ledgers = await response.json()
      setLedgers(ledgers)
    }

    getLedgers()
  }, [])

  const handleSubmit = () => {
    if (!error && name) {
      // Here you would typically handle the ledger creation
      console.log("Creating ledger:", formatLedgerName(name))
      setIsCreateDrawerOpen(false)
      setName("")
    }
  }

  useEffect(() => {
    const normalizedName = formatLedgerName(name)
    if (ledgers.map((x) => x.name).includes(normalizedName)) {
      setError("This ledger name already exists.")
    } else {
      setError("")
    }
  }, [name])

  const formatLedgerName = (input: string) => {
    // Remove non-alphanumeric characters and replace spaces with dashes
    return input
      .trim()
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
  }
  const baseURl = "https://xpnz.ca/"
  const previewUrl = `${baseURl}${formatLedgerName(name)}`

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
            <Combobox
              values={ledgers.map((ledger) => ({
                key: ledger.name,
                value: ledger.name,
                link: ledger.name
              }))}
            />
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
              {step === 1 ? "Enter a name your new ledger." : "Don't worry, you can add more members later!"}
            </DrawerDescription>
          </DrawerHeader>
          {step === 1 ? (
            <>
              <div className="flex flex-col gap-4 py-4 mx-8">
                <div className="space-y-2">
                  <FloatingLabelInput
                    label="Enter Ledger Name"
                    id="name"
                    placeholder={"My Ledger"}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-grow"
                  />
                  {error && (
                    <div className="flex items-center text-red-500 text-sm mt-1">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {error}
                    </div>
                  )}
                </div>

                <FloatingLabelInput
                  label="URL Preview"
                  id="preview"
                  value={name ? previewUrl : ""}
                  disabled={true}
                  className="flex-grow text-black font-mono break-all"
                />
              </div>
              <DrawerFooter>
                <Button type="submit" onClick={() => setStep(2)} disabled={!!error || !name}>
                  Next
                </Button>
              </DrawerFooter>
            </>
          ) : (
            <>
              <div className="px-4">
                <TagInput
                  tags={newLedgerMembers}
                  setTags={(newMembers) => setNewLedgerMembers(newMembers)}
                  placeholder={"Add members..."}
                  activeTagIndex={activeTagIndex}
                  setActiveTagIndex={setActiveTagIndex}
                  inlineTags={false}
                  size="md"
                />
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
