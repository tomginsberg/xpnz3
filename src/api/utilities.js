import { customAlphabet } from "nanoid"

import Lodash from "lodash"
import Decimal from "decimal.js"
import seedrandom from "seedrandom"

// datetime utilities

const pad = (n) => n.toString().padStart(2, "0")

export function getDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1) // Months are zero-based
  const day = pad(date.getDate())

  return `${year}-${month}-${day}`
}

export function getDateTimeString(date = new Date()) {
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1) // Months are zero-based
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// id generation utilities

const { sum } = Lodash

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
const nanoid = customAlphabet(alphabet, 10)

export const generateId = () => nanoid()

// integer ledger utilities

Decimal.set({ rounding: Decimal.ROUND_HALF_EVEN })

function shuffle(array, random) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

export function integerSplitByWeights(totalAmount, weights, seed) {
  if (seed === undefined) {
    seed = totalAmount
  }

  const random = seedrandom(seed)
  const totalWeight = sum(weights)
  const rawShares = weights.map((weight) => (weight / totalWeight) * totalAmount)

  // Initial rounding down of each share
  const flooredShares = rawShares.map(Math.floor)
  const flooredTotal = sum(flooredShares)

  // Calculate the remainder to distribute
  let remainder = totalAmount - flooredTotal

  // Create a pseudo-random but deterministic order using the Fisher-Yates shuffle
  const result = [...flooredShares]
  const indices = weights.map((_, index) => index)

  shuffle(indices, random)

  // If all the results are zero, just distribute the remainder normally
  if (flooredTotal === 0) {
    for (let i = 0; remainder > 0; i = (i + 1) % indices.length) {
      result[indices[i]]++
      remainder--
    }
  }
  // Otherwise, distribute the remainder only to the non-zero shares
  else {
    for (let i = 0; remainder > 0; i = (i + 1) % indices.length) {
      if (result[indices[i]] !== 0) {
        result[indices[i]]++
        remainder--
      }

      if (result.every((share) => share === 0)) {
        throw new Error("Assertion failed: all shares are zero.")
      }
    }
  }

  return result
}

export const integerCentsToDollars = (cents) => new Decimal(cents).dividedBy(100).toNumber()
export const integerMultiplyByFloat = (i, m) => new Decimal(i).times(m).round().toNumber()

export function formatDigit(x) {
  // Round to a maximum of 2 decimal places and remove trailing zeroes
  return parseFloat(x.toFixed(2))
}

export const defaultCategories = [
  "🚰 Utilities",
  "🍱 Food",
  "🛒 Groceries",
  "🏠 Rent",
  "🚗 Auto",
  "💳 Subscriptions",
  "🛍️ Shopping",
  "🏥 Health",
  "🍽️ Dining",
  "⚡ Hydro",
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
  "⛽ Gas",
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
  "🚬 Tobacco"
]

export const formatLedgerName = (input) => {
  // Remove non-alphanumeric characters and replace spaces with dashes
  return input
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
}

function mapCurrenciesToFormatted(currencies) {
  const mappedCurrencies = {}
  for (const [code, flag] of Object.entries(currencies)) {
    mappedCurrencies[code] = `${flag} ${code}`
  }
  return mappedCurrencies
}

export const currencies = mapCurrenciesToFormatted({
  CAD: "🇨🇦",
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  AED: "🇦🇪",
  AFN: "🇦🇫",
  ALL: "🇦🇱",
  AMD: "🇦🇲",
  ANG: "🇳🇱", // Netherlands Antilles
  AOA: "🇦🇴",
  ARS: "🇦🇷",
  AUD: "🇦🇺",
  AWG: "🇦🇼",
  AZN: "🇦🇿",
  BAM: "🇧🇦",
  BBD: "🇧🇧",
  BDT: "🇧🇩",
  BGN: "🇧🇬",
  BHD: "🇧🇭",
  BIF: "🇧🇮",
  BMD: "🇧🇲",
  BND: "🇧🇳",
  BOB: "🇧🇴",
  BRL: "🇧🇷",
  BSD: "🇧🇸",
  BTN: "🇧🇹",
  BWP: "🇧🇼",
  BYN: "🇧🇾",
  BZD: "🇧🇿",
  CDF: "🇨🇩",
  CHF: "🇨🇭",
  CLP: "🇨🇱",
  CNY: "🇨🇳",
  COP: "🇨🇴",
  CRC: "🇨🇷",
  CUP: "🇨🇺",
  CVE: "🇨🇻",
  CZK: "🇨🇿",
  DKK: "🇩🇰",
  DOP: "🇩🇴",
  DZD: "🇩🇿",
  EGP: "🇪🇬",
  ERN: "🇪🇷",
  ETB: "🇪🇹",
  FJD: "🇫🇯",
  FKP: "🇫🇰",
  GEL: "🇬🇪",
  GHS: "🇬🇭",
  GIP: "🇬🇮",
  GMD: "🇬🇲",
  GNF: "🇬🇳",
  GTQ: "🇬🇹",
  GYD: "🇬🇾",
  HKD: "🇭🇰",
  HNL: "🇭🇳",
  HRK: "🇭🇷",
  HTG: "🇭🇹",
  HUF: "🇭🇺",
  IDR: "🇮🇩",
  ILS: "🇮🇱",
  INR: "🇮🇳",
  IQD: "🇮🇶",
  IRR: "🇮🇷",
  ISK: "🇮🇸",
  JMD: "🇯🇲",
  JOD: "🇯🇴",
  JPY: "🇯🇵",
  KES: "🇰🇪",
  KGS: "🇰🇬",
  KHR: "🇰🇭",
  KMF: "🇰🇲",
  KRW: "🇰🇷",
  KWD: "🇰🇼",
  KZT: "🇰🇿",
  LAK: "🇱🇦",
  LBP: "🇱🇧",
  LKR: "🇱🇰",
  LRD: "🇱🇷",
  LSL: "🇱🇸",
  MAD: "🇲🇦",
  MDL: "🇲🇩",
  MGA: "🇲🇬",
  MKD: "🇲🇰",
  MMK: "🇲🇲",
  MNT: "🇲🇳",
  MOP: "🇲🇴",
  MRO: "🇲🇷",
  MUR: "🇲🇺",
  MVR: "🇲🇻",
  MWK: "🇲🇼",
  MXN: "🇲🇽",
  MYR: "🇲🇾",
  MZN: "🇲🇿",
  NAD: "🇳🇦",
  NGN: "🇳🇬",
  NOK: "🇳🇴",
  NPR: "🇳🇵",
  NZD: "🇳🇿",
  OMR: "🇴🇲",
  PAB: "🇵🇦",
  PEN: "🇵🇪",
  PGK: "🇵🇬",
  PHP: "🇵🇭",
  PKR: "🇵🇰",
  PLN: "🇵🇱",
  PYG: "🇵🇾",
  QAR: "🇶🇦",
  RON: "🇷🇴",
  RUB: "🇷🇺",
  RWF: "🇷🇼",
  SAR: "🇸🇦",
  SBD: "🇸🇧",
  SCR: "🇸🇨",
  SEK: "🇸🇪",
  SGD: "🇸🇬",
  SHP: "🇸🇭",
  SLL: "🇸🇱",
  SOS: "🇸🇴",
  SRD: "🇸🇷",
  SSP: "🇸🇸",
  STD: "🇸🇹",
  SZL: "🇸🇿",
  THB: "🇹🇭",
  TJS: "🇹🇯",
  TMT: "🇹🇲",
  TND: "🇹🇳",
  TOP: "🇹🇴",
  TRY: "🇹🇷",
  TTD: "🇹🇹",
  TZS: "🇹🇿",
  UAH: "🇺🇦",
  UGX: "🇺🇬",
  UYU: "🇺🇾",
  UZS: "🇺🇿",
  VES: "🇻🇪",
  VND: "🇻🇳",
  VUV: "🇻🇺",
  WST: "🇼🇸",
  XAF: "🇨🇲", // Cameroon (Central Africa)
  XCD: "🇦🇬", // Antigua and Barbuda
  XOF: "🇸🇳", // Senegal (West Africa)
  XPF: "🇵🇫", // French Polynesia
  YER: "🇾🇪",
  ZAR: "🇿🇦",
  ZMW: "🇿🇲",
  ZWL: "🇿🇼"
})

export const currencySymbols = {
  AED: "د.إ",
  AFN: "؋",
  ALL: "L",
  AMD: "֏",
  ANG: "ƒ",
  AOA: "Kz",
  ARS: "$",
  AUD: "$",
  AWG: "ƒ",
  AZN: "₼",
  BAM: "KM",
  BBD: "$",
  BDT: "৳",
  BGN: "лв",
  BHD: ".د.ب",
  BIF: "FBu",
  BMD: "$",
  BND: "$",
  BOB: "$b",
  BOV: "BOV",
  BRL: "R$",
  BSD: "$",
  BTC: "₿",
  BTN: "Nu.",
  BWP: "P",
  BYN: "Br",
  BYR: "Br",
  BZD: "BZ$",
  CAD: "$",
  CDF: "FC",
  CHE: "CHE",
  CHF: "CHF",
  CHW: "CHW",
  CLF: "CLF",
  CLP: "$",
  CNH: "¥",
  CNY: "¥",
  COP: "$",
  COU: "COU",
  CRC: "₡",
  CUC: "$",
  CUP: "₱",
  CVE: "$",
  CZK: "Kč",
  DJF: "Fdj",
  DKK: "kr",
  DOP: "RD$",
  DZD: "دج",
  EEK: "kr",
  EGP: "£",
  ERN: "Nfk",
  ETB: "Br",
  ETH: "Ξ",
  EUR: "€",
  FJD: "$",
  FKP: "£",
  GBP: "£",
  GEL: "₾",
  GGP: "£",
  GHC: "₵",
  GHS: "GH₵",
  GIP: "£",
  GMD: "D",
  GNF: "FG",
  GTQ: "Q",
  GYD: "$",
  HKD: "$",
  HNL: "L",
  HRK: "kn",
  HTG: "G",
  HUF: "Ft",
  IDR: "Rp",
  ILS: "₪",
  IMP: "£",
  INR: "₹",
  IQD: "ع.د",
  IRR: "﷼",
  ISK: "kr",
  JEP: "£",
  JMD: "J$",
  JOD: "JD",
  JPY: "¥",
  KES: "KSh",
  KGS: "лв",
  KHR: "៛",
  KMF: "CF",
  KPW: "₩",
  KRW: "₩",
  KWD: "KD",
  KYD: "$",
  KZT: "₸",
  LAK: "₭",
  LBP: "£",
  LKR: "₨",
  LRD: "$",
  LSL: "M",
  LTC: "Ł",
  LTL: "Lt",
  LVL: "Ls",
  LYD: "LD",
  MAD: "MAD",
  MDL: "lei",
  MGA: "Ar",
  MKD: "ден",
  MMK: "K",
  MNT: "₮",
  MOP: "MOP$",
  MRO: "UM",
  MRU: "UM",
  MUR: "₨",
  MVR: "Rf",
  MWK: "MK",
  MXN: "$",
  MXV: "MXV",
  MYR: "RM",
  MZN: "MT",
  NAD: "$",
  NGN: "₦",
  NIO: "C$",
  NOK: "kr",
  NPR: "₨",
  NZD: "$",
  OMR: "﷼",
  PAB: "B/.",
  PEN: "S/.",
  PGK: "K",
  PHP: "₱",
  PKR: "₨",
  PLN: "zł",
  PYG: "Gs",
  QAR: "﷼",
  RMB: "￥",
  RON: "lei",
  RSD: "Дин.",
  RUB: "₽",
  RWF: "R₣",
  SAR: "﷼",
  SBD: "$",
  SCR: "₨",
  SDG: "ج.س.",
  SEK: "kr",
  SGD: "S$",
  SHP: "£",
  SLL: "Le",
  SOS: "S",
  SRD: "$",
  SSP: "£",
  STD: "Db",
  STN: "Db",
  SVC: "$",
  SYP: "£",
  SZL: "E",
  THB: "฿",
  TJS: "SM",
  TMT: "T",
  TND: "د.ت",
  TOP: "T$",
  TRL: "₤",
  TRY: "₺",
  TTD: "TT$",
  TVD: "$",
  TWD: "NT$",
  TZS: "TSh",
  UAH: "₴",
  UGX: "USh",
  USD: "$",
  UYI: "UYI",
  UYU: "$U",
  UYW: "UYW",
  UZS: "лв",
  VEF: "Bs",
  VES: "Bs.S",
  VND: "₫",
  VUV: "VT",
  WST: "WS$",
  XAF: "FCFA",
  XBT: "Ƀ",
  XCD: "$",
  XOF: "CFA",
  XPF: "₣",
  XSU: "Sucre",
  XUA: "XUA",
  YER: "﷼",
  ZAR: "R",
  ZMW: "ZK",
  ZWD: "Z$",
  ZWL: "$"
}

export function dollarsToIntegerCents(dollars) {
  if (typeof dollars !== "number" || isNaN(dollars)) {
    // console.warn("Invalid input to dollarsToIntegerCents:", dollars);
    return 0
  }
  // Use Math.round to handle potential floating point inaccuracies
  return Math.floor(dollars * 100)
}

export const supportedCurrencies = Object.keys(currencySymbols)
