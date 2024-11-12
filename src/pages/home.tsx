import { AlertCircle, Check, ChevronsUpDown } from "lucide-react"

import { useEffect, useState } from "react"
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
import { TagInput } from "@/components/ui/tag-input"
import { ScrollArea } from "../components/ui/scroll-area"
import { cn } from "@/lib/utils"

const currencyFlags = {
  AED: "🇦🇪",
  AFN: "🇦🇫",
  ALL: "🇦🇱",
  AMD: "🇦🇲",
  ANG: "🇳🇱",
  AOA: "🇦🇴",
  ARS: "🇦🇷",
  AUD: "🇦🇺",
  AWG: "🇦🇼",
  AZN: "🇦🇿",
  BAM: "🇧🇦",
  BBD: "🇧🇧",
  BDT: "🇧🇩",
  BGN: "🇧🇬",
  BHD: "🇧🇭",
  BIF: "🇧🇮",
  BMD: "🇧🇲",
  BND: "🇧🇳",
  BOB: "🇧🇴",
  BRL: "🇧🇷",
  BSD: "🇧🇸",
  BTN: "🇧🇹",
  BWP: "🇧🇼",
  BYN: "🇧🇾",
  BYR: "🇧🇾",
  BZD: "🇧🇿",
  CAD: "🇨🇦",
  CDF: "🇨🇩",
  CHF: "🇨🇭",
  CLF: "🇨🇱",
  CLP: "🇨🇱",
  CNY: "🇨🇳",
  COP: "🇨🇴",
  CRC: "🇨🇷",
  CUC: "🇨🇺",
  CUP: "🇨🇺",
  CVE: "🇨🇻",
  CZK: "🇨🇿",
  DJF: "🇩🇯",
  DKK: "🇩🇰",
  DOP: "🇩🇴",
  DZD: "🇩🇿",
  EGP: "🇪🇬",
  ERN: "🇪🇷",
  ETB: "🇪🇹",
  EUR: "🇪🇺",
  FJD: "🇫🇯",
  FKP: "🇫🇰",
  GBP: "🇬🇧",
  GEL: "🇬🇪",
  GHS: "🇬🇭",
  GIP: "🇬🇮",
  GMD: "🇬🇲",
  GNF: "🇬🇳",
  GTQ: "🇬🇹",
  GYD: "🇬🇾",
  HKD: "🇭🇰",
  HNL: "🇭🇳",
  HRK: "🇭🇷",
  HTG: "🇭🇹",
  HUF: "🇭🇺",
  IDR: "🇮🇩",
  ILS: "🇮🇱",
  INR: "🇮🇳",
  IQD: "🇮🇶",
  IRR: "🇮🇷",
  ISK: "🇮🇸",
  JMD: "🇯🇲",
  JOD: "🇯🇴",
  JPY: "🇯🇵",
  KES: "🇰🇪",
  KGS: "🇰🇬",
  KHR: "🇰🇭",
  KMF: "🇰🇲",
  KPW: "🇰🇵",
  KRW: "🇰🇷",
  KWD: "🇰🇼",
  KYD: "🇰🇾",
  KZT: "🇰🇿",
  LAK: "🇱🇦",
  LBP: "🇱🇧",
  LKR: "🇱🇰",
  LRD: "🇱🇷",
  LSL: "🇱🇸",
  LTL: "🇱🇹",
  LVL: "🇱🇻",
  LYD: "🇱🇾",
  MAD: "🇲🇦",
  MDL: "🇲🇩",
  MGA: "🇲🇬",
  MKD: "🇲🇰",
  MMK: "🇲🇲",
  MNT: "🇲🇳",
  MOP: "🇲🇴",
  MRO: "🇲🇷",
  MUR: "🇲🇺",
  MVR: "🇲🇻",
  MWK: "🇲🇼",
  MXN: "🇲🇽",
  MYR: "🇲🇾",
  MZN: "🇲🇿",
  NAD: "🇳🇦",
  NGN: "🇳🇬",
  NIO: "🇳🇮",
  NOK: "🇳🇴",
  NPR: "🇳🇵",
  NZD: "🇳🇿",
  OMR: "🇴🇲",
  PAB: "🇵🇦",
  PEN: "🇵🇪",
  PGK: "🇵🇬",
  PHP: "🇵🇭",
  PKR: "🇵🇰",
  PLN: "🇵🇱",
  PYG: "🇵🇾",
  QAR: "🇶🇦",
  RON: "🇷🇴",
  RSD: "🇷🇸",
  RUB: "🇷🇺",
  RWF: "🇷🇼",
  SAR: "🇸🇦",
  SBD: "🇸🇧",
  SCR: "🇸🇨",
  SDG: "🇸🇩",
  SEK: "🇸🇪",
  SGD: "🇸🇬",
  SHP: "🇸🇭",
  SLE: "🇸🇱",
  SLL: "🇸🇱",
  SOS: "🇸🇴",
  SRD: "🇸🇷",
  STD: "🇸🇹",
  SYP: "🇸🇾",
  SZL: "🇸🇿",
  THB: "🇹🇭",
  TJS: "🇹🇯",
  TMT: "🇹🇲",
  TND: "🇹🇳",
  TOP: "🇹🇴",
  TRY: "🇹🇷",
  TTD: "🇹🇹",
  TWD: "🇹🇼",
  TZS: "🇹🇿",
  UAH: "🇺🇦",
  UGX: "🇺🇬",
  USD: "🇺🇸",
  UYU: "🇺🇾",
  UZS: "🇺🇿",
  VEF: "🇻🇪",
  VES: "🇻🇪",
  VND: "🇻🇳",
  VUV: "🇻🇺",
  WST: "🇼🇸",
  XAF: "🇨🇲",
  XCD: "🇦🇮",
  XOF: "🇧🇯",
  XPF: "🇵🇫",
  YER: "🇾🇪",
  ZAR: "🇿🇦",
  ZMW: "🇿🇲",
  ZWL: "🇿🇼"
}

const currencies = Object.entries(currencyFlags).map(([code, flag]) => ({
  value: code,
  label: `${flag} ${code}`
}))

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
  // const { setTheme } = useTheme()
  // setTheme("light")

  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false)
  const [name, setName] = useState("")
  const [newLedgerMembers, setNewLedgerMembers] = useState([])
  const [step, setStep] = useState(1)
  const [error, setError] = useState("")
  const defaultCurrency = "CAD"

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

  // @ts-ignore
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
      <Drawer open={isCreateDrawerOpen} onOpenChange={setIsCreateDrawerOpen} onClose={handleClose}>
        <DrawerContent className="h-auto">
          <DrawerHeader>
            <DrawerTitle>
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
                  className="text-black font-mono"
                />
              </div>
              <DrawerFooter>
                <Button type="submit" disabled={!!error || !name}>
                  Next
                </Button>
              </DrawerFooter>
            </form>
          )}

          {step == 2 && (
            <form onSubmit={() => setStep(3)}>
              <Command className="px-4">
                <div className="border rounded-lg">
                  <div className="relative">
                    <CommandInput placeholder="Search currency..." />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 font-large px-4 py-2">
                      {selectedCurrency} {currencyFlags[selectedCurrency]}
                    </div>
                  </div>

                  <CommandList>
                    <CommandEmpty>No currency found.</CommandEmpty>
                    <CommandEmpty>No currency found.</CommandEmpty>
                    <CommandGroup className="max-h-[200px]">
                      {currencies.map((currency) => (
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

              <DrawerFooter className="flex flex-row w-full p-4">
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
                <DrawerFooter className="flex flex-row w-full">
                  <Button className="flex-grow" type="button" variant="outline" onClick={() => setStep(step - 1)}>
                    Back
                  </Button>
                  <Button className="flex-grow" type="submit">
                    Next
                  </Button>
                </DrawerFooter>
              </form>
            </ScrollArea>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}
