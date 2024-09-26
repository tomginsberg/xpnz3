"use client"

import {
    ArrowUpRightSquareIcon,
    Loader,
    Mail,
    MessageCircle, Moon,
    MousePointerClickIcon, Sun,
    User,
    Waves, X, Search
} from "lucide-react"

import {useState, useEffect, useContext} from "react";
import {Button} from "@/components/ui/button"
import RetroGrid from "../components/ui/retro-grid";
import {useTheme} from "next-themes";
import {Input} from "../components/ui/input";
import {generateRandomExpense} from "../api/get";

import {
    DynamicContainer,
    DynamicIsland,
    DynamicIslandProvider,
    useDynamicIslandSize,
    DynamicTitle
} from "@/components/ui/dynamic-island"
import AnimatedExpenseCard from "../components/landing-card";
import {Skeleton} from "../components/ui/skeleton";
// Sizes for the dynamic island
const sizePresets = ["compact", "large", "tall", "medium"]

import Masonry from "react-masonry-css";
import Link from "next/link";


const breakpointColumnsObj = {
    default: 4,
    1100: 4,
    700: 3,
    500: 2,
};


export default function Home() {
    const [ledgerName, setLedgerName] = useState('tomisabitch')
    const [showMemberInput, setShowMemberInput] = useState(false)
    const [memberName, setMemberName] = useState('')
    const [members, setMembers] = useState<string[]>([])
    const [cardCount, setCardCount] = useState(1)

    useEffect(() => {
        const interval = setInterval(() => {
            if (cardCount > 10) {
                setCardCount(1)
            } else {
                setCardCount(cardCount + 1)
            }

        }, 1000)
        return () => clearInterval(interval)
    }, [cardCount]);

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
            setMemberName('')
        }
    }

    const handleRemoveMember = (member: string) => {
        setMembers(members.filter(m => m !== member))
    }

    const {theme, setTheme} = useTheme();

    // make the button route to the ledger page at /ledgerName
    // im using next file based router
    const handleSubmit = (e) => {
        // if the ledger name is empty, do nothing
        if (!ledgerName) return;
        e.preventDefault();
        window.location.href = `/${ledgerName}`;
    };
    return (
        <div className="h-full  min-h-screen bg-gradient-to-b from-[#ffd319] via-[#ff2975] to-[#8c1eff]">
            <div className="z-0">
            <RetroGrid/>
            </div>

            <div
                className="flex flex-col">


                <div className="flex items-start">
                    <div className="w-full max-w-4xl mx-auto px-4 pt-8 pb-4">
                        <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold leading-none tracking-tight mb-4 md:mb-8 text-center text-black"
                        >
                            xpnz
                        </h1>
                        <div
                            className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl border border-black p-6 md:p-8">

                            <form className="w-full max-w-md mx-auto" onSubmit={handleSubmit}>
                                <label
                                    htmlFor="default-search"
                                    className="mb-2 text-sm font-medium text-gray-900 block text-center"
                                >
                                    Find or Create your Ledger!
                                </label>
                                <div className="relative w-full max-w-md mt-3">
                                    <Search
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black"
                                        size={20}/>
                                    <Input
                                        value={ledgerName}
                                        onChange={(e) => setLedgerName(e.target.value)}
                                        // type="search"
                                        className="text-black w-full pl-12 pr-12 py-2 bg-none backdrop-blur-2xl border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
                                    />
                                    <ArrowUpRightSquareIcon
                                        type={"submit"}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black"
                                        size={20}/>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                {/*<div className="columns-2 gap-x-4 space-y-4 px-4 pb-4">*/}
                {/*create `cardCount` AnimatedExpenseCards*/}
                <Masonry className="flex w-auto gap-x-4 gap-y-4 px-4"
                         breakpointCols={{
                             default: 4,
                             1100: 4,
                             700: 3,
                             500: 2,
                         }}>
                    {
                        Array.from({length: cardCount}).map((_, i) => (
                            <div className="py-2" key={i}><AnimatedExpenseCard/></div>
                        ))
                    }
                </Masonry>
                {/*</div>*/}


            </div>

            <div className="absolute right-2 top-1 z-10">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                    aria-label="Toggle theme"
                >
                    <Sun
                        className="absolute h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-black"/>
                    <Moon
                        className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-white"/>
                </Button>
            </div>

        </div>
    )
}