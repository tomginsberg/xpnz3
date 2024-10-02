// component topbar

import {useEffect, useState} from "react";
import {Moon, Search, Sun} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {Separator} from "@/components/ui/separator";
import {currencies} from "@/api/get.js";
import {useTheme} from "@/components/theme-provider"


interface TopBarProps {
    ledger: string
    onSearch: (value: string) => void;
}


interface Headline {
    emoji: string;
    label: string;
}

interface HeadlineMap {
    [key: string]: Headline;
}

export default function Topbar({ledger, onSearch}: TopBarProps) {
    const {setTheme} = useTheme()
    const [themeName, setThemeName] = useState("system")

    function toggleTheme() {
        setThemeName(themeName === "light" ? "dark" : "light")
        setTheme(themeName)
    }

    const pathname = "test"
    const [headline, setHeadline] = useState("");

    const [currency, setCurrency] = useState("CAD");

    const headlines: HeadlineMap = {
        "expenses": {emoji: "💸", label: "Expenses"},
        "members": {emoji: "🧑‍🤝‍🧑", label: "Members"},
        "debts": {emoji: "💳", label: "Debts"},
        "recurring": {emoji: "🔄", label: "Recurring"},
        "dash": {emoji: "📊", label: "Dashboard"},
        "": {emoji: "", label: ""},
    };


    useEffect(() => {
            setHeadline(pathname.split("/")[2] || "expenses")
        }, [pathname]
    );


    return (

        <div
            className="fixed top-0 left-0 right-0 z-10 border-b bg-white dark:bg-black">
            <div className="flex justify-between items-center p-4">
                <h1 className="text-xl font-bold flex items-center">

                    <div className="text-black dark:text-white">

                        <Sheet>
                            <SheetTrigger asChild>
                                <button className="mr-3 ml-2 group">
                                    <svg strokeWidth="1.5" viewBox="0 0 24 24" fill="none"
                                         xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                                        <path d="M3 5H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                                              strokeLinejoin="round"
                                              className="transition-all duration-300 group-hover:text-green-600"></path>
                                        <path d="M3 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                                              strokeLinejoin="round"
                                              className="transition-all duration-300 group-hover:text-blue-600"></path>
                                        <path d="M3 19H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                                              strokeLinejoin="round"
                                              className="transition-all duration-300 group-hover:text-red-600"></path>
                                    </svg>
                                </button>

                            </SheetTrigger>
                            <SheetContent side="left" className="bg-card">
                                <SheetHeader>
                                    <SheetTitle>Options</SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col py-4 gap-2 text-black dark:text-white">
                                    {/* Home Button */}
                                    <Button
                                        // onClick={() => router.push("/")}
                                        variant="outline"
                                        className="justify-start"
                                    >
                                        <span className="mr-2">🏠</span> Home
                                    </Button>

                                    <Button
                                        // onClick={() => router.push("/recurring")}
                                        variant="outline"
                                        className="justify-start"
                                    >
                                        <span className="mr-2">🔄</span> Recurring
                                    </Button>
                                    <Button className="justify-start"
                                            variant="outline">
                                        <span className="mr-2">📊</span> Plots
                                    </Button>

                                    {/* Share Button */}
                                    <Button className="justify-start"
                                            variant="outline">
                                        <span className="mr-2">📤</span> Share
                                    </Button>
                                    <Separator className="my-2"/>
                                    {/*Recurring Expenses and Plots tab */}

                                    <h2 className="text-lg font-semibold p2-b">Settings</h2>

                                    <div className="space-y-2">

                                        <Label htmlFor="currency" className="mb-2">
                                            Default Currency
                                        </Label>
                                        <Select
                                            value={currency}
                                            onValueChange={(value) => setCurrency(value)}
                                        >
                                            <SelectTrigger className="w-full mx-0">
                                                <SelectValue placeholder="Select a currency"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(currencies).map(([code, flag]) => (
                                                    <SelectItem key={code} value={code}>{flag}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">

                                        <Label htmlFor="theme" className="mb-2">
                                            Theme
                                        </Label>
                                        <Select
                                            value={themeName}
                                            onValueChange={(value) => {
                                                setThemeName(value)
                                                setTheme(value)
                                            }
                                        }
                                        >
                                            <SelectTrigger className="w-full mx-0">
                                                <SelectValue placeholder="Select a theme"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="light">Light</SelectItem>
                                                <SelectItem value="dark">Dark</SelectItem>
                                                <SelectItem value="system">System</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Separator className="my-2"/>
                                </div>

                                <SheetFooter>
                                    <SheetClose asChild>
                                        <Button variant="secondary">Close</Button>
                                    </SheetClose>
                                </SheetFooter>
                            </SheetContent>
                        </Sheet>

                        <span
                            aria-label={headlines[headline].label}
                            className="text-2xl mr-2"
                        >
                      {headlines[headline].emoji}
                    </span> {headlines[headline].label}

                    </div>

                </h1>
                {/* Theme Toggle Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                >
                    <Sun
                        className="absolute h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-black"/>
                    <Moon
                        className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-white"/>
                </Button>
            </div>
            {/*<AnimatePresence>*/}
            {headline === "expenses" && (
                <div className="px-4 pb-4">
                    <div className="relative">
                        <Search className="h-5 w-5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500"/>
                        <Input
                            type="search"
                            placeholder="Search expenses..."
                            className="pb-2.5 w-full pl-10"
                            onChange={(e) => onSearch(e.target.value)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}