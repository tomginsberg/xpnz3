// app/[ledger]/Toolbar.tsx

"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";

interface Tab {
    id: string;
    label: string;
}

interface ToolbarProps {
    ledger: string;
    setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Toolbar: React.FC<ToolbarProps> = ({ ledger, setIsDrawerOpen }) => {
    const pathname = usePathname();
    const [activeTab, setActiveTab] = useState<string>("");

    const tabs: Tab[] = [
        { id: "", label: "💸" },
        { id: "members", label: "🧑‍🤝‍🧑" },
        { id: "debts", label: "💳" },
    ];

    // Reference to hold tab elements
    const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

    const [bubbleStyle, setBubbleStyle] = useState<{ left: number; width: number }>({
        left: 0,
        width: 0,
    });

    useEffect(() => {
        const tabId = pathname.split("/")[2] || "";
        setActiveTab(tabId);
    }, [pathname]);

    // Update bubble position when activeTab changes
    useEffect(() => {
        const el = tabRefs.current[activeTab];
        if (el) {
            const { offsetLeft, offsetWidth } = el;
            setBubbleStyle({ left: offsetLeft, width: offsetWidth });
        }
    }, [activeTab]);

    return (
        <div
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-full p-2 bg-gray-200 shadow-xl dark:bg-gray-700"
        >
            <div className="flex flex-row gap-2">
                {/* + Button */}
                <button
                    className="h-14 w-14 p-2 rounded-full bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 flex items-center justify-center"
                    onClick={() => setIsDrawerOpen(true)}
                >
                    <Plus className="h-8 w-8 text-white" />
                </button>

                {/* Tabs */}
                <div className="flex flex-grow justify-between items-center relative">
                    {tabs.map((tab) => (
                        <Link key={tab.id} href={`/${ledger}${tab.id ? `/${tab.id}` : ""}`} passHref>
                            <button
                                ref={(el) => {
                                    tabRefs.current[tab.id] = el;
                                }}
                                className={cn(
                                    "relative",
                                    activeTab !== tab.id ? "hover:scale-125 transition ease-in-out duration-300" : ""
                                )}
                            >
                                <span className="relative z-20 text-4xl px-[10px]">{tab.label}</span>
                            </button>
                        </Link>
                    ))}

                    {/* Motion Bubble for Active Tab */}
                    <motion.span
                        className="absolute z-10 bg-gray-300 dark:bg-gray-600 rounded-full"
                        layout
                        initial={false}
                        animate={{
                            left: bubbleStyle.left,
                            width: bubbleStyle.width,
                        }}
                        transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
                        style={{
                            top: 0,
                            bottom: 0,
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Toolbar;
