import React, { useRef, useEffect, useState, useCallback } from "react"
import { PlusIcon } from "@radix-ui/react-icons"
import { motion } from "framer-motion"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"

interface Tab {
  id: string
  label: string
}

interface ToolbarProps {
  ledger: string
  onClickPlus: () => void
  emptyMode?: boolean
}

const Toolbar: React.FC<ToolbarProps> = ({ ledger, onClickPlus, emptyMode = false }) => {
  const tabs: Tab[] = [
    { id: "expenses", label: "💸" },
    { id: "members", label: "🧑‍🤝‍🧑" },
    { id: "debts", label: "💳" }
  ]

  const location = useLocation()
  const currentPath = location.pathname.split("/").pop() || "expenses"
  const navigate = useNavigate()

  // Reference to hold tab elements
  const tabRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({})

  const [bubbleStyle, setBubbleStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0
  })

  const updateBubble = useCallback(() => {
    const el = tabRefs.current[currentPath]
    if (el) {
      const { offsetLeft, offsetWidth } = el
      setBubbleStyle({ left: offsetLeft, width: offsetWidth })
    }
  }, [currentPath, ledger])

  useEffect(() => {
    updateBubble()
  }, [updateBubble])

  function handleClickPlus() {
    if (currentPath !== ledger) {
      navigate(`/${ledger}/expenses`)
    }
    onClickPlus()
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-full p-2 bg-background shadow-lg shadow-muted">
      <div className="flex flex-row gap-2">
        {/* + Button */}
        <button
          className="relative h-14 w-14 p-2 rounded-full bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 flex items-center justify-center"
          onClick={handleClickPlus}
          aria-label="Add Transaction"
        >
          <PlusIcon className="h-8 w-8 text-white" />
          {emptyMode && (
            <span className="absolute inset-0 rounded-full border-2 border-blue-400 opacity-0 group-hover:opacity-100 animate-pulse-border"></span>
          )}
        </button>

        {/* Tabs */}
        <div className="flex flex-grow justify-between items-center relative">
          {tabs.map((tab) => (
            <NavLink
              to={`/${ledger}/${tab.id}`}
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el
              }}
              className={({ isActive }) =>
                cn("relative", !isActive ? "hover:scale-125 transition ease-in-out duration-300" : "")
              }
            >
              <span className="relative z-20 text-4xl px-[10px]">{tab.label}</span>
            </NavLink>
          ))}

          {/* Motion Bubble for Active Tab */}
          <motion.span
            className="absolute z-10 bg-gray-200 dark:bg-gray-700 rounded-full"
            layout
            initial={false}
            animate={{
              left: bubbleStyle.left,
              width: bubbleStyle.width
            }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
            style={{
              top: 0,
              bottom: 0
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default Toolbar
