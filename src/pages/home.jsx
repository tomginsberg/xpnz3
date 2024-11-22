import { AlertCircle, ArrowUpRightFromCircle, Check, ChevronsUpDown, Save } from "lucide-react"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from "@/components/ui/drawer"
import { currencies } from "@/api/client.js"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { FloatingLabelInput } from "@/components/ui/floating-label"

import { api } from "@/../xpnz.config.js"
import { TagInput } from "@/components/ui/tag-input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ConfettiButton } from "@/components/ui/confetti"

export function Combobox({ values }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="secondary" role="combobox" aria-expanded={open} className="w-full justify-between">
          Find a ledger...
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="p-1">
        <DrawerTitle>
          <h2 className="text-primary text-center pt-3">Find Your Ledger</h2>
        </DrawerTitle>
        <DrawerDescription className="sr-only">Search for a ledger by name.</DrawerDescription>
        <Command className="bg-background">
          <CommandInput placeholder="Search" className="text-primary" autoFocus={true} />
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
                  className="bg-card text-pretty text-primary rounded-lg my-2 text-lg font-semibold justify-between transition-all ease-in-out duration-200"
                >
                  <span>{value}</span>
                  <span className="text-primary">
                    <ArrowUpRightFromCircle className="size-4" />
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DrawerContent>
    </Drawer>
  )
}

export default function Home() {
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [name, setName] = useState("")
  const [newLedgerMembers, setNewLedgerMembers] = useState([])
  const [step, setStep] = useState(1)
  const [error, setError] = useState("")
  const defaultCurrency = "CAD"
  const navigate = useNavigate()

  const [ledgers, setLedgers] = useState([])

  useEffect(() => {
    const getLedgers = async () => {
      const response = await fetch(`${api.base}/ledgers`, { cache: "no-store" })
      const ledgers = await response.json()
      // [{name: ..., currency: ...}, {...}]
      // sort ledgers by name
      ledgers.sort((a, b) => a.name.localeCompare(b.name))
      setLedgers(ledgers)
    }

    getLedgers()
  }, [])

  async function createLedger(name, currency, members) {
    try {
      const response = await fetch(`${api.base}/ledgers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, currency, members })
      })

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (jsonError) {
          throw new Error("Failed to parse error response from server")
        }
        throw new Error(errorData.error || "Failed to create ledger")
      }

      let responseData
      try {
        responseData = await response.json()
      } catch (jsonError) {
        throw new Error("Failed to parse response from server")
      }
      return responseData
    } catch (error) {
      console.error("Error creating ledger:", error)
      throw error
    }
  }

  // Usage in handleSubmit function
  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!error && name) {
      const formattedName = formatLedgerName(name)
      console.log("Creating ledger:", formattedName, selectedCurrency, newLedgerMembers)
      try {
        // Create the new ledger
        await createLedger(
          formattedName,
          selectedCurrency,
          newLedgerMembers.map((member) => ({ name: member, is_active: true }))
        )

        // Change location to the new ledger
        navigate(`/${formattedName}`)
      } catch (error) {
        // Handle error (e.g., display error message to the user)
        console.error("Failed to create ledger:", error)
      }
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

  const formatLedgerName = (input) => {
    // Remove non-alphanumeric characters and replace spaces with dashes
    return input
      .trim()
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
  }
  const baseURl = "xpnz.ca/"
  const previewUrl = `${baseURl}${formatLedgerName(name)}`

  function handleClose() {
    setIsCreateDrawerOpen(false)
    setName("")
    setNewLedgerMembers([])
    setStep(1)
    setSelectedCurrency(defaultCurrency)
  }

  const [selectedCurrency, setSelectedCurrency] = useState(defaultCurrency)
  const currencyList = Object.keys(currencies).map((currency) => ({
    value: currency,
    label: currencies[currency]
  }))

  return (
    <>
      <div className="min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 dark:from-black dark:via-pink-900 dark:to-red-900 flex flex-col items-center justify-center p-4">
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
      <Drawer open={isCreateDrawerOpen} onOpenChange={setIsCreateDrawerOpen} onClose={handleClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-primary">
              {step === 1 ? "Create New Ledger" : step === 2 ? "Select a Currency" : "Add Members"}
            </DrawerTitle>
            <DrawerDescription>
              {step === 1 && "Enter a name for your new ledger."}
              {step === 2 && "This is default currency for your expenses."}
              {step === 3 && "Don't worry, you can add more members later!"}
            </DrawerDescription>
          </DrawerHeader>

          {step === 1 && (
            <form onSubmit={() => setStep(2)}>
              <div className="flex flex-col gap-4 py-4 mx-8">
                <div className="space-y-2">
                  <FloatingLabelInput
                    label="Enter Ledger Name"
                    id="name"
                    required={true}
                    placeholder={"My Ledger"}
                    autoFocus={true}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-grow text-primary"
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
                  className="text-primary font-mono"
                />
              </div>
              <DrawerFooter>
                <Button type="submit" disabled={!!error || !name}>
                  Next
                </Button>
              </DrawerFooter>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={() => setStep(3)} className="overflow-y-auto">
              <Command className="px-4 bg-background">
                <div className="border rounded-lg">
                  <div className="relative">
                    <CommandInput placeholder="Search currency..." />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 font-large px-4 py-2">
                      {currencies[selectedCurrency]}
                    </div>
                  </div>

                  <CommandList>
                    <CommandEmpty>No currency found.</CommandEmpty>
                    <CommandEmpty>No currency found.</CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                      {currencyList.map((currency) => (
                        <CommandItem
                          key={currency.value}
                          value={currency.value}
                          onSelect={(currentValue) => {
                            setSelectedCurrency(currentValue === selectedCurrency ? "" : currentValue)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCurrency === currency.value ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {currency.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </div>
              </Command>

              <DrawerFooter className="flex flex-row w-full p-4 text-primary">
                <Button className="flex-grow" type="button" variant="outline" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
                <Button className="flex-grow" type="submit">
                  Next
                </Button>
              </DrawerFooter>
            </form>
          )}

          {step === 3 && (
            <ScrollArea>
              <form onSubmit={handleSubmit}>
                <div className="px-4 mt-2">
                  <TagInput tags={newLedgerMembers} setTags={setNewLedgerMembers} placeholder={"Add members..."} />
                </div>
                <DrawerFooter className="flex flex-row w-full text-primary">
                  <Button className="flex-grow" type="button" variant="outline" onClick={() => setStep(step - 1)}>
                    Back
                  </Button>
                  <ConfettiButton
                    className="flex-grow"
                    type="submit"
                    disabled={!name || !selectedCurrency || newLedgerMembers.length === 0}
                  >
                    Create!
                  </ConfettiButton>
                </DrawerFooter>
              </form>
            </ScrollArea>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}
