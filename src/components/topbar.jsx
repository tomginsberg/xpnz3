// component topbar

import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ExpandIcon, Moon, Search, ShrinkIcon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"

import { currencies } from "@/api/client.js"
import { useTheme } from "@/components/theme-provider"
import Error from "@/pages/error"
import { cn } from "@/lib/utils"

function XpnzMenuIcon() {
  return (
    <svg strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
      <path
        d="M3 5H11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="group-hover:text-green-600"
      ></path>
      <path
        d="M3 12H16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="group-hover:text-blue-600"
      ></path>
      <path
        d="M3 19H21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="group-hover:text-red-600"
      ></path>
    </svg>
  )
}

function XpnzNavigationButton(props) {
  const { route, icon, label } = props
  const navigate = useNavigate()

  return (
    <Button onClick={() => navigate(route)} variant="outline" className="justify-start">
      <span className="mr-2">{icon}</span> {label}
    </Button>
  )
}

function XpnzDropdown(props) {
  const { descriptor, label, placeholder, value, onChange, options } = props

  return (
    <div className="space-y-2">
      <Label htmlFor={descriptor} className="mb-2">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full mx-0">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(({ value, text }) => (
            <SelectItem key={value} value={value}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default function Topbar({ onSearch, toggleExpansion }) {
  const location = useLocation()
  // Extract the page type from the pathname
  const pathSegments = location.pathname.split("/")
  const pageType = pathSegments[2] || "expenses"
  const [expanded, setExpanded] = useState(false)

  const [currency, setCurrency] = useState("CAD")
  const [themeName, setThemeName] = useState(localStorage.getItem("vite-ui-theme") || "dark")

  const { setTheme } = useTheme()

  function toggleTheme() {
    const newTheme = themeName === "dark" ? "light" : "dark"
    setTheme(newTheme)
    setThemeName(newTheme)
  }

  function toggleExpand() {
    const exp = !expanded
    setExpanded(exp)
    toggleExpansion()
  }

  const headlines = {
    expenses: { emoji: "💸", label: "Expenses" },
    members: { emoji: "🧑‍🤝‍🧑", label: "Members" },
    debts: { emoji: "💳", label: "Debts" },
    recurring: { emoji: "🔄", label: "Recurring" },
    dash: { emoji: "📊", label: "Dashboard" }
  }

  const copyDebts = async () => {
    const text = `💸 Track group expenses with XPNZ @ https://xpnz.ca${location.pathname}`

    if (navigator.share) {
      await navigator.share({ text })
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
    } else {
      alert(text)
    }
  }

  const headline = headlines[pageType]

  if (!headline) return <Error />

  const ColorBullet = ({ color }) => (
    <span className="mr-2">
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="10" fill={color} />
      </svg>
    </span>
  )

  return (
    <div className="fixed top-0 left-0 right-0 z-20">
      <div className="border-b bg-card">
        <div className="flex justify-between items-center p-4">
          <div className="text-primary">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" className="group translate-y-[3px] -translate-x-1">
                  <XpnzMenuIcon />
                </Button>
              </SheetTrigger>

              <SheetContent side="left" className="bg-card text-primary">
                <SheetDescription className="sr-only">Sidebar</SheetDescription>
                <SheetHeader>
                  <SheetTitle className="text-left">Options</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col py-4 gap-2 text-black dark:text-white">
                  <XpnzNavigationButton route="/" icon="🏠" label="Home" />
                  {/*<XpnzNavigationButton route="/recurring" icon="🔄" label="Recurring" />*/}
                  {/*<XpnzNavigationButton route="/plots" icon="📊" label="Plots" />*/}
                  <Button onClick={copyDebts} variant="outline" className="justify-start">
                    <span className="mr-2">🤝</span> Share
                  </Button>

                  <Separator className="my-2" />

                  <h2 className="text-lg font-bold">Users</h2>

                  <Button variant="outline" className="justify-start">
                    <ColorBullet color="#FFC107" />
                    Mark
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <ColorBullet color="#FF5722" />
                    John
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <ColorBullet color="#3F51B5" />
                    Jane
                  </Button>

                  <Separator className="my-2" />

                  <h2 className="text-lg font-bold">Settings</h2>

                  <XpnzDropdown
                    descriptor="currency"
                    label="Default Currency"
                    placeholder="Select a currency"
                    value={currency}
                    onChange={setCurrency}
                    options={Object.entries(currencies).map(([value, text]) => ({ value, text }))}
                  />

                  <XpnzDropdown
                    descriptor="theme"
                    label="Theme"
                    placeholder="Select a theme"
                    value={themeName}
                    onChange={(value) => {
                      setThemeName(value)
                      setTheme(value)
                    }}
                    options={[
                      { value: "light", text: "Light" },
                      { value: "dark", text: "Dark" }
                    ]}
                  />

                  <Separator className="my-2" />
                </div>

                <SheetFooter>
                  <SheetClose asChild>
                    <Button variant="secondary">Close</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
            <span aria-label={headline.label} className="text-2xl mr-2">
              {headline.emoji}
            </span>{" "}
            <span className="font-semibold text-2xl">{headline.label}</span>
          </div>

          <div className="flex">
            {pageType === "expenses" && (
              <Button className="px-5" variant="ghost" onClick={toggleExpand} aria-label="Toggle Expand">
                <ExpandIcon
                  className={cn(
                    "absolute h-5 w-5 rotate-0 scale-100 transition-all text-primary",
                    expanded && "scale-0 -rotate-90"
                  )}
                />
                <ShrinkIcon
                  className={cn(
                    "absolute h-5 w-5 transition-all rotate-0 scale-100 text-primary",
                    !expanded && "rotate-90 scale-0"
                  )}
                />
              </Button>
            )}
            <Button className="px-5" variant="ghost" onClick={toggleTheme} aria-label="Toggle theme">
              <Sun className="absolute h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-black" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-white" />
            </Button>
          </div>
        </div>

        {pageType === "expenses" && (
          <div className="px-4">
            <div className="relative mb-4 mt-1">
              <Search className="h-5 w-5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <Input
                type="search"
                placeholder="Search expenses..."
                className="pb-2 w-full pl-10 text-primary"
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
