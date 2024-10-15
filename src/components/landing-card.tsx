'use client'

import {useState, useEffect} from 'react'
import {motion, AnimatePresence} from 'framer-motion'
import {emptyExpense} from "@/api/client.js";

const random = () => Math.random();

const expenses = [
    {name: "Dinner 4 the Boyz", category: "🍔 Dining"},
    {name: "😸 Meow Mix", category: "🐾 Pet Supplies"},
    {name: "🐆 Leopard Print Tees", category: "👗 Fashion"},
    {name: "☢️ Nukes", category: "🛠️ Tools & Gadgets"},
    {name: "🍕 Pizza Party", category: "🎉 Entertainment"},
    {name: "🛌 Sleepytime PJs", category: "👗 Fashion"},
    {name: "🚀 Rocket Fuel", category: "⛽️ Transportation"},
    {name: "🎮 Gamer Snacks", category: "🍫 Snacks"},
    {name: "🍩 Donut O'Clock", category: "🍰 Desserts"},
    {name: "🎧 Jam Session Gear", category: "🎵 Music"},
    {name: "🕹️ Arcade Tokens", category: "🎉 Entertainment"},
    {name: "🧙 Magic Beans", category: "🌱 Groceries"},
    {name: "🏄 Surf’s Up Board Wax", category: "🏄‍♂️ Outdoor"},
    {name: "🍣 Sushi Splurge", category: "🍴 Dining"},
    {name: "🌮 Taco Tuesday", category: "🍴 Dining"},
    {name: "🦄 Unicorn Ride Tickets", category: "🎢 Entertainment"},
    {name: "👑 Royal Robes", category: "👗 Fashion"},
    {name: "🍿 Movie Night Snacks", category: "🍫 Snacks"},
    {name: "🌌 Starry Night Camping Gear", category: "🏕️ Outdoor"},
    {name: "🛠️ DIY Toolbox", category: "🛠️ Tools & Gadgets"},
    {name: "🍓 Berry Good Smoothies", category: "🍹 Beverages"},
    {name: "🎁 Surprise Gift", category: "🎁 Gifts"},
    {name: "🚗 Road Trip Tunes", category: "🎵 Music"},
    {name: "💎 Bling Bling", category: "💍 Jewelry"},
    {name: "🍺 Cheers & Beers", category: "🍻 Drinks"},
    {name: "🎈 Party Balloons", category: "🎉 Entertainment"},
    {name: "🍔 Burger Bonanza", category: "🍴 Dining"},
    {name: "🍦 Ice Cream Scoops", category: "🍰 Desserts"},
    {name: "🚴 Cycle the World", category: "🚲 Fitness"},
    {name: "📚 Bookworm Bundle", category: "📚 Education"},
    {name: "🍹 Tropical Drinks", category: "🍸 Beverages"},
    {name: "🎨 Paint Night Supplies", category: "🎨 Arts & Crafts"},
    {name: "🏋️ Gainz Protein Shakes", category: "💪 Fitness"},
    {name: "🛏️ Cozy Blanket", category: "🛋️ Home Goods"},
    {name: "🍪 Cookie Cravings", category: "🍫 Snacks"},
    {name: "🕶️ Cool Shades", category: "👗 Fashion"},
    {name: "🚤 Yacht Club Membership", category: "🏖️ Leisure"},
    {name: "📱 Latest Tech Gizmo", category: "📱 Electronics"},
    {name: "🚚 Moving Day Boxes", category: "📦 Home Goods"},
    {name: "💼 Fancy Briefcase", category: "👜 Accessories"},
    {name: "🍇 Vineyard Wine", category: "🍷 Beverages"},
    {name: "🍜 Ramen Night", category: "🍴 Dining"},
    {name: "🌿 Herbal Teas", category: "☕️ Beverages"},
    {name: "🎾 Tennis Gear", category: "🎾 Sports"},
    {name: "🏰 Castle Tour", category: "🏞️ Travel"},
    {name: "🎃 Halloween Costumes", category: "👗 Fashion"},
    {name: "🌸 Garden Seeds", category: "🌻 Gardening"},
    {name: "🛁 Spa Day Supplies", category: "🛀 Wellness"},
    {name: "🍭 Candy Stash", category: "🍬 Treats"},
];

const members = ["Alice", "Bob", "Charlie", "David", "Eve"]

function generateRandomExpense() {
    const expense = expenses[Math.floor(random() * expenses.length)]
    let name = expense.name
    const date = new Date(Date.now() - Math.floor(random() * 30) * 24 * 60 * 60 * 1000).toDateString()
    const category = expense.category
    const income = false

    if (name === "") {
        name = "Expense"
    }

    // Generate random paidBy
    const paidByMembers = [members[Math.floor(random() * members.length)]]
    const paidBy = paidByMembers.map((member) => ({
        member,
        amount: Math.floor(random() * 100 * 50) / 100 + 2,
    }))

    const amount = paidBy.reduce((sum, p) => sum + p.amount, 0)
    paidBy.forEach((p) => (p.amount = Math.round(p.amount * 100) / 100))

    // Generate random splitBetween
    let splitBetweenMembers = members.filter(() => random() > 0.5)
    if (splitBetweenMembers.length === 0) {
        splitBetweenMembers = [members[Math.floor(random() * members.length)]]
    }
    const splitBetween = splitBetweenMembers.map((member) => ({
        member,
        weight: Math.floor(random() * 10) + 1,
        normalizedWeight: 0, // Will be calculated later
    }))

    // Calculate normalized weights
    const totalWeight = splitBetween.reduce((sum, s) => sum + s.weight, 0)
    splitBetween.forEach((s) => (s.normalizedWeight = (s.weight / totalWeight) * amount))

    return {
        name,
        amount,
        date,
        category,
        paidBy,
        splitBetween,
        income
    }
}

export default function AnimatedExpenseCard() {
    const [expense, setExpense] = useState({
        id: "",
        name: "",
        amount: 0,
        currency: "",
        income: false,
        date: "",
        category: "",
        paidBy: [],
        splitBetween: []
    })
    useEffect(() => {
        setExpense(generateRandomExpense())
    }, []);
    // const [showDetails, setShowDetails] = useState(random() > 0.5)

    // const expense = generateRandomExpense()
    const showDetails = random() > 0.5

    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         setExpense(generateRandomExpense())
    //         setShowDetails(random() > 0.5)
    //     }, 2000)
    //     return () => clearInterval(interval)
    // }, [])

    return (
        <motion.div
            layout
            initial={{opacity: 0, y: 50}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -50}}
            transition={{duration: 0.5}}
            className="w-auto p-[3px] rounded-lg overflow-hidden mx-auto"
            style={{
                background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #8b00ff)',
                backgroundSize: '300% 300%',
                animation: 'rainbow-border 5s ease infinite',
            }}
        >
            <motion.div
                layout
                transition={{duration: 0.3}}
                className="flex flex-col overflow-hidden rounded-lg bg-card text-black dark:text-white"
            >
                <div className="p-4">
                    <div className="flex flex-wrap mb-2 justify-between">
                        <h2 className="break-normal pr-3 text-ellipsis overflow-hidden text-balance text-lg font-extrabold tracking-tight">{expense.name}</h2>
                        <span className="mt-[0.1rem] truncate font-normal tracking-tight text-gray-700 dark:text-gray-400">
              ${expense.amount.toFixed(2)}
            </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{expense.date}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{expense.category}</p>
                </div>

                <AnimatePresence initial={false}>
                    {showDetails && (
                        <motion.div
                            key="details"
                            initial={{opacity: 0, height: 0}}
                            animate={{opacity: 1, height: 'auto'}}
                            exit={{opacity: 0, height: 0}}
                            transition={{duration: 0.3}}
                        >
                            <hr className="mx-2 border-gray-200"/>
                            <div className="p-4 text-sm">
                                <p>
                                    <span className="font-semibold">Paid by: </span>
                                    {expense.paidBy.map(({
                                                             member,
                                                             amount
                                                         }) => `${member} ($${amount.toFixed(2)})`).join(', ')}
                                </p>
                                <p className="mt-1">
                                    <span className="font-semibold">Split between: </span>
                                    {expense.splitBetween.map(({member, normalizedWeight}) =>
                                        `${member} ($${normalizedWeight.toFixed(2)})`
                                    ).join(', ')}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
            <style jsx global>{`
                @keyframes rainbow-border {
                    0% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                    100% {
                        background-position: 0% 50%;
                    }
                }
            `}</style>
        </motion.div>
    )
}
