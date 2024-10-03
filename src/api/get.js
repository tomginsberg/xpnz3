import {api} from '../../xpnz.config.js'

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
    "Ghost Tour 👻",
    ""
];
export const categories = [
    "🚰 Utilities",
    "🛒 Groceries",
    "🏠 Rent",
    "🚗 Auto",
    "💳 Subscriptions",
    "🛍️ Shopping",
    "🏥 Health",
    "🍽️ Dining",
    "🚌 Transit",
    "🎉 Entertainment",
    "🏋️ Fitness",
    "📚 Education",
    "🐾 Pets",
    "🎁 Gifts",
    "🧹 Household",
    "💻 Internet",
    "📱 Phone",
    "🛫 Travel",
    "🍷 Alcohol",
    "🧴 Personal Care",
    "💡 Electricity",
    "🌊 Water",
    "🚿 Gas",
    "🌐 Cable",
    "📉 Investments",
    "🛡️ Insurance",
    "📬 Postal",
    "🧾 Taxes",
    "👶 Childcare",
    "🎓 Tuition",
    "🧰 Maintenance",
    "🎨 Crafts",
    "📸 Photography",
    "🎠 Hobbies",
    "🚸 School Supplies",
    "🧢 Sportswear",
    "⚽ Sports",
    "👟 Footwear",
    "🔧 Tools",
    "💊 Supplements",
    "💒 Donations",
    "❓ Misc",
    "🖥️ Tech",
    "📖 Books",
    "🧽 Cleaning",
    "🚪 Home Improvement",
    "🏛️ Museums",
    "🎸 Music Instruments",
    "🎭 Theater",
    "🚬 Tobacco",
    ""
];
export const members = ["Alice", "Bob", "Charlie", "David", "Eve"]

export const emptyExpense = {
    id: "",
    name: "",
    amount: "",
    currency: "CAD",
    income: false,
    date: new Date(),
    category: "",
    paidBy: [], // [{ member: string, amount: number }]
    splitBetween: [], // [{ member: string, weight: number, normalizedWeight: number }]
};

export async function getExpenses(ledger) {
  const expensesPromise = fetch(`${api.base}/transactions?ledger=${ledger}`, { cache: "no-store" })
    .then(res => res.json())
    .then(expenses => {
      expenses.forEach(d => {
        d.income = d.expense_type === 'income';
        d.paidBy = d.contributions
          .map(c => ({ member: c.member, amount: c.paid }))
          .filter(c => c.amount > 0);
        d.splitBetween = d.contributions
          .map(c => ({ member: c.member, weight: c.weight, normalizedWeight: c.owes }))
          .filter(c => c.weight > 0);
      });
      return expenses;
    });

  const balancesPromise = fetch(`${api.base}/ledgers/${ledger}/balance`, { cache: "no-store" }).then(res => res.json());
  const debtsPromise = fetch(`${api.base}/ledgers/${ledger}/settlement`, { cache: "no-store" }).then(res => res.json());

  const [expenses, balances, debts] = await Promise.all([expensesPromise, balancesPromise, debtsPromise]);

  return { expenses, balances, debts };
}


export const currencies = {
    CAD: '🇨🇦 CAD',
    USD: '🇺🇸 USD',
    EUR: '🇪🇺 EUR',
    JPY: '🇯🇵 JPY',
    GBP: '🇬🇧 GBP',
    PLN: '🇵🇱 PLN',
    CNY: '🇨🇳 CNY',
    INR: '🇮🇳 INR',
    RUB: '🇷🇺 RUB',
    BRL: '🇧🇷 BRL',
    MXN: '🇲🇽 MXN',
    AUD: '🇦🇺 AUD',
    KRW: '🇰🇷 KRW',
    IDR: '🇮🇩 IDR',
    TRY: '🇹🇷 TRY',
    ZAR: '🇿🇦 ZAR',
    NGN: '🇳🇬 NGN',
    SEK: '🇸🇪 SEK',
}

export function generateRandomExpense(defaultCurrency = 'CAD') {


    let name = expenseNames[Math.floor(Math.random() * expenseNames.length)]

    const date = (new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)).toDateString()
    let category = categories[Math.floor(Math.random() * categories.length)]
    // get random currency code
    let currency = Object.keys(currencies)[Math.floor(Math.random() * Object.keys(currencies).length)]
    let exchangeRate = getExchangeRate(currency, defaultCurrency)
    const income = false

    if (name === "") {
        name = "Expense"
    }

    // Generate random paidBy
    const paidByMembers = members.filter(() => Math.random() > 0.5);
    const paidBy = paidByMembers.map((member) => ({
        member,
        amount: Math.round(Math.floor(Math.random() * 100 * 50) / 100),
    }));

    const amount = paidBy.reduce((sum, p) => sum + p.amount, 0);
    const convertedAmount = amount * exchangeRate
    paidBy.forEach((p) => (p.amount = Math.round(p.amount * 100) / 100));

    // Generate random splitBetween
    const splitBetweenMembers = members.filter(() => Math.random() > 0.5);
    const splitBetween = splitBetweenMembers.map((member) => ({
        member,
        weight: Math.floor(Math.random() * 10) + 1,
        normalizedWeight: 0, // Will be calculated later
    }));

    // Calculate normalized weights
    const totalWeight = splitBetween.reduce((sum, s) => sum + s.weight, 0);
    splitBetween.forEach((s) => (s.normalizedWeight = Math.round((s.weight / totalWeight) * amount)));

    return {
        name,
        amount,
        convertedAmount,
        date,
        category,
        paidBy,
        splitBetween,
        currency,
        income
    };
}

export function settle(balances) {
    let neg = {};
    let pos = {};

    // Separating balances into positive and negative
    for (let member in balances) {
        let balance = balances[member];
        if (balance < 0) {
            neg[member] = -balance;
        } else if (balance > 0) {
            pos[member] = balance;
        }
    }

    // Sorting the dictionaries
    pos = Object.fromEntries(Object.entries(pos).sort(([a], [b]) => a.localeCompare(b)));
    neg = Object.fromEntries(Object.entries(neg).sort(([a], [b]) => a.localeCompare(b)));

    return settleRecursive(pos, neg);
}

function headRest(balances) {
    let minMem = popKey(balances);
    let minBalance = balances[minMem];
    let b = {...balances};
    delete b[minMem];
    return [{member: minMem, balance: minBalance}, b];
}

function popKey(d) {
    return Object.keys(d)[0];
}

function settleRecursive(pos, neg) {
    if (Object.keys(pos).length === 0 || Object.keys(neg).length === 0) {
        return [];
    }
    if (Object.keys(pos).length === 1) {
        let x = popKey(pos);
        return Object.entries(neg).map(([a, b]) => [a, x, b]);
    }
    if (Object.keys(neg).length === 1) {
        let x = popKey(neg);
        return Object.entries(pos).map(([a, b]) => [x, a, b]);
    } else {
        let [nm, nr] = headRest(neg);
        let [pm, pr] = headRest(pos);
        if (nm.balance < pm.balance) {
            pos[pm.member] = pm.balance - nm.balance;
            let transactions = settleRecursive(pos, nr);
            transactions.push([nm.member, pm.member, nm.balance]);
            return transactions;
        } else if (nm.balance > pm.balance) {
            neg[nm.member] = nm.balance - pm.balance;
            let transactions = settleRecursive(pr, neg);
            transactions.push([nm.member, pm.member, pm.balance]);
            return transactions;
        } else {
            let transactions = settleRecursive(pr, nr);
            transactions.push([nm.member, pm.member, pm.balance]);
            return transactions;
        }
    }
}

export async function getExchangeRate(fromCurrency, toCurrency) {
    const api = `https://api.exchangerate-api.com/v4/latest/${toCurrency}`;
    return fetch(api).then((response) => response.json()).then((data) => data.rates[fromCurrency]);
}


export function compputeBalance(expenses) {
    let balances = {}
    members.forEach(member => balances[member] = 0)
    expenses.forEach(expense => {
        let incomeFactor = expense.income ? -1 : 1
        expense.paidBy.forEach(paidBy => {
            balances[paidBy.member] -= (paidBy.amount) * incomeFactor
        })
        expense.splitBetween.forEach(split => {
            balances[split.member] += (split.normalizedWeight) * incomeFactor
        })
    })
    return balances
}

export function generateRandomLedgerData(count) {
    const expenses = Array.from({length: count}, (_, i) => ({
        id: i,
        ...generateRandomExpense(),
    }))
    // for each member compute how much they are up or down
    const balances = compputeBalance(expenses)
    const debts = settle(balances)
    return {expenses, balances, debts}
}
