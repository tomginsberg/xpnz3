import { AlertCircle, ArrowUpRightFromCircle, Check, ChevronsUpDown, Save, Lock, Unlock } from "lucide-react"

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
import { formatLedgerName, currencies } from "@/api/utilities.js"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { FloatingLabelInput } from "@/components/ui/floating-label"

import { api } from "@/../xpnz.config.js"
import { TagInput } from "@/components/ui/tag-input"
import { cn } from "@/lib/utils"
import { ConfettiButton } from "@/components/ui/confetti"
import TypingAnimation from "@/components/ui/typing-animation"
import ShinyButton from "@/components/ui/shiny-button"

export function Combobox({ values }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  // add a keyboard shortcut for command k to open the Drawer
  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          role="combobox"
          aria-expanded={open}
          className="hover:from-purple-600 hover:to-pink-600 dark:hover:from-purple-600 dark:hover:to-pink-600 text-white drop-shadow-md border-none w-full justify-between rounded-lg bg-gradient-to-r from-purple-400 via-pink-500 to-red-500  dark:from-pink-800 dark:to-red-700 transition-colors ease-in-out duration-200 "
        >
          Find a ledger...
          <kbd className="hidden pointer-events-none sm:inline-flex sm:block h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 block sm:hidden" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="p-1">
        <DrawerTitle className="text-primary text-center pt-3">Find Your Ledger</DrawerTitle>
        <DrawerDescription className="sr-only">Search for a ledger by name.</DrawerDescription>
        <Command className="bg-background h-fit">
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
                  className="px-4 text-pretty text-primary rounded-lg my-2 text-lg font-semibold justify-between transition-all ease-in-out duration-200"
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
  const [isPrivate, setIsPrivate] = useState(false)
  const [step, setStep] = useState(1)
  const [error, setError] = useState("")
  const defaultCurrency = "CAD"
  const navigate = useNavigate()

  const [ledgers, setLedgers] = useState([])

  const currencyList = Object.keys(currencies).map((currency) => ({
    value: currency,
    label: currencies[currency]
  }))

  useEffect(() => {
    const getLedgers = async () => {
      const response = await fetch(`${api.base}/ledgers`, { cache: "no-store" })
      const ledgers = await response.json()
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
        body: JSON.stringify({ name, currency, members, is_private: isPrivate })
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

  return (
    <>
      <div className="h-screen w-screen overflow-hidden bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 dark:from-black dark:via-pink-900 dark:to-red-900 flex flex-col items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <ShinyButton className="text-white relative bg-gradient-to-r from-purple-500 via-pink-500 to-red-600  dark:from-pink-900 dark:to-red-800 text-white rounded-lg shadow-lg  p-8 w-full max-w-md">
            {/*<BorderBeam borderWidth={5} />*/}
            <motion.div
              initial={{ opacity: 0, y: -200, scale: 1 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 2, bounce: 0.5, type: "spring" }}
              className="mb-4"
            >
              <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f4b8/512.gif" alt="Group Expense" />
            </motion.div>
            <h1 className="text-4xl font-bold text-center mb-6">xpnz</h1>
            <TypingAnimation
              className="text-center mb-6 text-md font-normal"
              duration={30}
              text="track group expenses with ease"
            />

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
              onClick={() => {
                setIsCreateDrawerOpen(true)
              }}
              className="z-20 drop-shadow-md justify-between w-full border-none bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Create New Ledger
              <ArrowUpRightFromCircle />
            </Button>
          </ShinyButton>
        </motion.div>
      </div>
      <Drawer open={isCreateDrawerOpen} onOpenChange={setIsCreateDrawerOpen} onClose={handleClose}>
        <DrawerContent className="h-[80%] flex flex-col justify-start">
          <DrawerHeader>
            <DrawerTitle className="text-primary">
              {step === 1 ? (
                <div>Create New Ledger</div>
              ) : step === 2 ? (
                <div>
                  Select a Currency for <span className="text-green-500">{name}</span>
                </div>
              ) : (
                <div>
                  Add Members for <span className="text-blue-500">{name}</span>{" "}
                  {currencies[selectedCurrency].split(" ")[0]}
                </div>
              )}
            </DrawerTitle>
            <DrawerDescription>
              {step === 1 && "Enter a name for your new ledger."}
              {step === 2 && "This is default currency for your expenses and debts."}
              {step === 3 && "Don't worry, you can add more members later!"}
            </DrawerDescription>
          </DrawerHeader>
          {step === 1 && (
            <form onSubmit={() => setStep(2)} className="flex flex-col justify-start">
              <div className="flex flex-col gap-4 py-4 mx-4">
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

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPrivate(!isPrivate)}
                  className="flex items-center justify-between text-primary"
                >
                  <span className="flex items-center">
                    {isPrivate ? <Lock className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
                    {isPrivate ? "Private Ledger" : "Public Ledger"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {isPrivate ? "Hidden from search" : "Visible in search"}
                  </span>
                </Button>

                <FloatingLabelInput
                  label="URL Preview"
                  id="preview"
                  value={name ? previewUrl : ""}
                  disabled={true}
                  className="text-primary font-mono"
                />
              </div>
              <DrawerFooter className="flex flex-row w-full p-4 text-primary gap-4">
                <Button className="flex-grow" type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button className="flex-grow" type="submit" disabled={error}>
                  Next
                </Button>
              </DrawerFooter>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={() => setStep(3)} className="flex flex-col justify-start">
              <Command className="p-4 bg-background">
                <div className="border rounded-lg">
                  <div className="relative">
                    <CommandInput placeholder="Search currency..." autoFocus />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 font-large px-4 py-2">
                      {currencies[selectedCurrency]}
                    </div>
                  </div>

                  <CommandList>
                    <CommandEmpty>No currency found.</CommandEmpty>
                    <CommandGroup>
                      {currencyList.map((currency) => (
                        <CommandItem
                          key={currency.value}
                          value={currency.value}
                          onSelect={(selected) => {
                            if (selected === selectedCurrency) {
                              setStep(step + 1)
                            } else {
                              setSelectedCurrency(selected)
                            }
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

              <DrawerFooter className="flex flex-row w-full p-4 text-primary gap-4">
                <Button className="flex-grow" type="button" variant="outline" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
                <Button className="flex-grow" type="submit" disabled={selectedCurrency === ""}>
                  Next
                </Button>
              </DrawerFooter>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="flex flex-col justify-start">
              <div className="px-4 mt-2">
                <TagInput tags={newLedgerMembers} setTags={setNewLedgerMembers} placeholder={"Add members..."} />
              </div>
              <DrawerFooter className="flex flex-row w-full text-primary gap-4 px-4">
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
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}
