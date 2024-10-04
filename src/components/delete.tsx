import React, {useState, useRef, useEffect} from 'react'
import {Button} from "@/components/ui/button"
import {Fingerprint} from 'lucide-react'
import {motion, useAnimation} from "framer-motion"

interface HoldToConfirmButtonProps {
    onConfirm: () => void
    holdTime?: number
    size?: 'sm' | 'md' | 'lg'
    baseColor?: string
    activeColor?: string
    gradientColors?: [string, string, string]
    icon?: React.ReactNode
    text?: string
    holdText?: string
    className?: string
}
import {Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger} from '@/components/ui/drawer';

const HoldToConfirmButton: React.FC<HoldToConfirmButtonProps> = ({
                                                                     onConfirm,
                                                                     holdTime = 1500,
                                                                     activeColor = 'text-primary',
                                                                     gradientColors = ['#3b82f6', '#8b5cf6', '#ec4899'],
                                                                 }) => {
    const [isHolding, setIsHolding] = useState(false)
    const holdTimeout = useRef<NodeJS.Timeout | null>(null)
    const controls = useAnimation()

    useEffect(() => {
        return () => {
            if (holdTimeout.current) clearTimeout(holdTimeout.current)
        }
    }, [])

    const startHolding = () => {
        setIsHolding(true)
        controls.start({
            strokeDasharray: "283 283",
            transition: {duration: holdTime / 1000, ease: "linear"}
        })

        holdTimeout.current = setTimeout(() => {
            setIsHolding(false)
            onConfirm()
        }, holdTime)
    }

    const stopHolding = () => {
        setIsHolding(false)
        controls.start({strokeDasharray: "0 283"})
        if (holdTimeout.current) clearTimeout(holdTimeout.current)
    }

    return (
        <div className="relative w-32 h-32 flex items-center justify-center mx-auto">
    <svg viewBox="0 0 100 100">
        <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={gradientColors[0]}/>
                <stop offset="50%" stopColor={gradientColors[1]}/>
                <stop offset="100%" stopColor={gradientColors[2]}/>
            </linearGradient>
        </defs>
        <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            className="text-secondary"
        />
        <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="5"
            strokeDasharray="0 283"
            strokeDashoffset="0"
            animate={controls}
        />
    </svg>
    <button
        className={`absolute inset-0 flex items-center justify-center focus:outline-none`}
        onMouseDown={startHolding}
        onMouseUp={stopHolding}
        onMouseLeave={stopHolding}
        onTouchStart={startHolding}
        onTouchEnd={stopHolding}
    >
        <Fingerprint
            className={`w-12 h-12 ${isHolding ? `${activeColor} animate-pulse` : 'text-secondary-foreground'}`}>
        </Fingerprint>
    </button>
</div>
    )
}

interface HoldToDeleteProps {
    onConfirm: () => void
    isDrawerOpen: boolean
    handleCloseDrawer: () => void
}

export default function HoldToDelete({ onConfirm, isDrawerOpen, handleCloseDrawer }: HoldToDeleteProps) {

    const handleDelete = () => {
        handleCloseDrawer();
        onConfirm();
    };

    return (
        <Drawer open={isDrawerOpen} onClose={handleCloseDrawer}>
            <DrawerContent className="text-black dark:text-white">
                <DrawerHeader>
                    <DrawerTitle>Hold to Delete</DrawerTitle>
                </DrawerHeader>
                <div className="flex justify-center py-4">
                    <HoldToConfirmButton
                        onConfirm={handleDelete}
                        holdTime={1000}
                        baseColor="bg-red-100"
                        activeColor="text-red-500"
                        gradientColors={['#ef4444', '#ef4444', '#ef4444']}
                    />
                </div>
            </DrawerContent>
        </Drawer>
    )
}