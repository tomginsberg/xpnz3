// component topbar

import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { ExpandIcon, Moon, Search, Share2, ShrinkIcon, Sun, ChartArea } from "lucide-react"

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

import { useTheme } from "@/components/theme-provider"
import Error from "@/pages/error"
import { cn } from "@/lib/utils"

function MenuIcon() {
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

function NavigationButton({ route, icon, label }) {
  const navigate = useNavigate()

  return (
    <SheetClose asChild>
      <Button onClick={() => navigate(route)} variant="outline" className="justify-start transition-none">
        <span className="mr-2">{icon}</span> {label}
      </Button>
    </SheetClose>
  )
}

function Dropdown({ descriptor, label, placeholder, value, onChange, options }) {
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

export default function Topbar({ onSearch, toggleExpansion, toggleChart, showChartToggle }) {
  const location = useLocation()
  const { ledgerName } = useParams()
  // Extract the page type from the pathname
  const pathSegments = location.pathname.split("/")
  const pageType = pathSegments[2] || "expenses"
  const [expanded, setExpanded] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [themeName, setThemeName] = useState(localStorage.getItem("vite-ui-theme") || "dark")

  const { setTheme } = useTheme()

  useEffect(() => {
    onSearch(searchValue)
  }, [searchValue])

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
    dash: { emoji: "📊", label: "Dashboard" },
    itemize: { emoji: "📝", label: "Itemized Split" }
  }

  const share = async () => {
    const text = `💸 Track group expenses with XPNZ @ https://xpnz.ca/${ledgerName}`

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

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-20">
        <div className="bg-background pb-1">
          <div className="flex justify-between items-center p-4">
            <div className="text-primary">
              <Sheet>
                <SheetTrigger asChild>
                  <Button size="icon" variant="ghost" className="group -translate-x-1">
                    <MenuIcon />
                  </Button>
                </SheetTrigger>

                <SheetContent side="left" className="bg-background text-primary transition-none">
                  <SheetDescription className="sr-only">Sidebar</SheetDescription>
                  <SheetHeader>
                    <SheetTitle className="text-left">Options</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col py-4 gap-2 text-black dark:text-white">
                    <NavigationButton route="/" icon="🏠" label="Home" />
                    <NavigationButton route={`/${ledgerName}/itemize`} icon="📝" label="Itemize Split" />
                    <Button onClick={share} variant="outline" className="justify-start transition-none">
                      <span className="mr-2">🤝</span> Share
                    </Button>

                    <Separator className="my-2" />

                    <h2 className="text-lg font-bold">Settings</h2>

                    <Dropdown
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
                      <Button variant="outline" className="transition-none">
                        Close
                      </Button>
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
              {pageType === "expenses" && showChartToggle && (
                <Button className="px-5" variant="ghost" onClick={toggleChart} aria-label="Toggle Expand">
                  <ChartArea className={cn("absolute h-5 w-5 text-primary")} />
                </Button>
              )}
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

              <Button className="px-5" variant="ghost" onClick={share} aria-label="Share">
                <Share2 className="absolute h-5 w-5 text-primary" />
              </Button>
            </div>
          </div>

          {pageType === "expenses" && (
            <div className="px-4">
              <div className="relative mb-4 mt-1">
                <Search className="h-5 w-5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <Input
                  type="search"
                  id="searchbar"
                  value={searchValue}
                  placeholder="Search expenses..."
                  className="pb-2 w-full pl-10 text-primary border-none"
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
