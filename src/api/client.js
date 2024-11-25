import { api } from "../../xpnz.config.js"
import { sample } from "lodash-es"
import { getDateString } from "./utilities.js"

export const expenseNames = [
  "Coffee Break ☕",
  "Pet Supplies 🐾",
  "Book Club 📚",
  "Movie Night 🎬",
  "Travel Fund ✈️",
  "Art Supplies 🎨",
  "Game Night 🎲",
  "Concert Tickets 🎟️",
  "Tech Gadgets 📱",
  "Gardening Tools 🌱",
  "Pizza Party 🍕",
  "Ice Cream Treats 🍦",
  "Sunday Brunch 🍳",
  "Fitness Club 🏋️",
  "Spa Day 💆",
  "Chocolate Stash 🍫",
  "Sushi Date 🍣",
  "Beach Day 🏖️",
  "Happy Hour 🍹",
  "Cheese Platter 🧀",
  "DIY Projects 🔨",
  "Tea Time 🫖",
  "Vegan Snacks 🥑",
  "Wine Night 🍷",
  "Burger Bash 🍔",
  "Music Streaming 🎵",
  "Magic Show 🎩",
  "Vintage Finds 🕰️",
  "Plant Babies 🪴",
  "Candle Collection 🕯️",
  "Makeup Magic 💄",
  "Baking Bonanza 🧁",
  "Holiday Gifts 🎁",
  "Car Wash 🚗",
  "Photography 📸",
  "Knitting Kit 🧶",
  "Craft Beer 🍺",
  "Smoothie Sips 🥤",
  "Science Fiction 🛸",
  "Sports Gear ⚽",
  "Picnic Party 🧺",
  "Comedy Club 😂",
  "Thrift Shopping 🛍️",
  "Aquarium Visit 🐠",
  "Skate Session 🛹",
  "Ballet Tickets 🩰",
  "Poetry Books 📖",
  "Farmers Market 🥦",
  "Star Gazing 🔭",
  "Puzzle Pieces 🧩",
  "Herbal Remedies 🌿",
  "Video Games 🎮",
  "Jazz Night 🎷",
  "Camping Trip ⛺",
  "Fast Food Frenzy 🍟",
  "New Sneakers 👟",
  "Online Course 🖥️",
  "Fishing Trip 🎣",
  "Tailgate Party 🍗",
  "Ghost Tour 👻"
]

export function getRandomExpenseName() {
  return sample(expenseNames)
}

export const emptyExpense = {
  id: "",
  name: "",
  amount: "",
  currency: "",
  income: false,
  date: getDateString(),
  category: "",
  paidBy: [], // [{ member: string, amount: number }]
  splitBetween: [] // [{ member: string, weight: number, normalizedWeight: number }]
}

export async function getExpenses(ledger) {
  const expensesPromise = fetch(`${api.base}/transactions?ledger=${ledger}`, { cache: "no-store" })
    .then((res) => res.json())
    .then((expenses) => {
      expenses.forEach((d) => {
        d.income = d.expense_type === "income"
        d.paidBy = d.contributions.map((c) => ({ member: c.member, amount: c.paid })).filter((c) => c.amount > 0)
        d.splitBetween = d.contributions
          .map((c) => ({ member: c.member, weight: c.weight, normalizedWeight: c.owes }))
          .filter((c) => c.weight > 0)
      })
      return expenses
    })

  const balancesPromise = fetch(`${api.base}/ledgers/${ledger}/balance`, { cache: "no-store" }).then((res) =>
    res.json()
  )
  const debtsPromise = fetch(`${api.base}/ledgers/${ledger}/settlement`, { cache: "no-store" }).then((res) =>
    res.json()
  )

  const [expenses, balances, debts] = await Promise.all([expensesPromise, balancesPromise, debtsPromise])

  return { expenses, balances, debts }
}
