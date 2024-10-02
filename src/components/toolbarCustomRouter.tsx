// app/[ledger]/Toolbar.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Tab {
    id: string;
    label: string;
}

interface ToolbarProps {
    onClickPlus: () => void;
    activeTab: string;
    onTabClick: (tabId: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onClickPlus, activeTab, onTabClick }) => {
    const tabs: Tab[] = [
        { id: '', label: '💸' },
        { id: 'members', label: '🧑‍🤝‍🧑' },
        { id: 'debts', label: '💳' },
    ];

    // Reference to hold tab elements
    const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

    const [bubbleStyle, setBubbleStyle] = useState<{ left: number; width: number }>({
        left: 0,
        width: 0,
    });

    // Update bubble position when activeTab changes
    useEffect(() => {
        const el = tabRefs.current[activeTab];
        if (el) {
            const { offsetLeft, offsetWidth } = el;
            setBubbleStyle({ left: offsetLeft, width: offsetWidth });
        }
    }, [activeTab]);

    function handleTabClick(tabId: string) {
        onTabClick(tabId);
    }

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-full p-2 shadow-xl border bg-card">
            <div className="flex flex-row gap-2">
                {/* + Button */}
                <button
                    className="h-14 w-14 p-2 rounded-full bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 flex items-center justify-center"
                    onClick={onClickPlus}
                >
                    <Plus className="h-8 w-8 text-white" />
                </button>

                {/* Tabs */}
                <div className="flex flex-grow justify-between items-center relative">
                    {tabs.map((tab) => (
                        <button
                            ref={(el) => {
                                tabRefs.current[tab.id] = el;
                            }}
                            className={cn(
                                'relative',
                                activeTab !== tab.id ? 'hover:scale-125 transition ease-in-out duration-300' : ''
                            )}
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id)}
                        >
                            <span className="relative z-20 text-4xl px-[10px]">{tab.label}</span>
                        </button>
                    ))}

                    {/* Motion Bubble for Active Tab */}
                    <motion.span
                        className="absolute z-10 bg-accent rounded-full"
                        layout
                        initial={false}
                        animate={{
                            left: bubbleStyle.left,
                            width: bubbleStyle.width,
                        }}
                        transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
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