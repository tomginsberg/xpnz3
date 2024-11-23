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

import { customAlphabet } from "nanoid"

import Lodash from "lodash"

const { sum } = Lodash

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
const nanoid = customAlphabet(alphabet, 10)

export const generateId = () => nanoid()

// integer ledger utilities

import Decimal from "decimal.js"
import seedrandom from "seedrandom"

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

// currency utilities

export const supportedCurrencies = [
  "AED",
  "AFN",
  "ALL",
  "AMD",
  "ANG",
  "AOA",
  "ARS",
  "AUD",
  "AWG",
  "AZN",
  "BAM",
  "BBD",
  "BDT",
  "BGN",
  "BHD",
  "BIF",
  "BMD",
  "BND",
  "BOB",
  "BRL",
  "BSD",
  "BTN",
  "BWP",
  "BYN",
  "BZD",
  "CAD",
  "CDF",
  "CHF",
  "CLP",
  "CNY",
  "COP",
  "CRC",
  "CUP",
  "CVE",
  "CZK",
  "DJF",
  "DKK",
  "DOP",
  "DZD",
  "EGP",
  "ERN",
  "ETB",
  "EUR",
  "FJD",
  "FKP",
  "FOK",
  "GBP",
  "GEL",
  "GGP",
  "GHS",
  "GIP",
  "GMD",
  "GNF",
  "GTQ",
  "GYD",
  "HKD",
  "HNL",
  "HRK",
  "HTG",
  "HUF",
  "IDR",
  "ILS",
  "IMP",
  "INR",
  "IQD",
  "IRR",
  "ISK",
  "JEP",
  "JMD",
  "JOD",
  "JPY",
  "KES",
  "KGS",
  "KHR",
  "KID",
  "KMF",
  "KRW",
  "KWD",
  "KYD",
  "KZT",
  "LAK",
  "LBP",
  "LKR",
  "LRD",
  "LSL",
  "LYD",
  "MAD",
  "MDL",
  "MGA",
  "MKD",
  "MMK",
  "MNT",
  "MOP",
  "MRU",
  "MUR",
  "MVR",
  "MWK",
  "MXN",
  "MYR",
  "MZN",
  "NAD",
  "NGN",
  "NIO",
  "NOK",
  "NPR",
  "NZD",
  "OMR",
  "PAB",
  "PEN",
  "PGK",
  "PHP",
  "PKR",
  "PLN",
  "PYG",
  "QAR",
  "RON",
  "RSD",
  "RUB",
  "RWF",
  "SAR",
  "SBD",
  "SCR",
  "SDG",
  "SEK",
  "SGD",
  "SHP",
  "SLE",
  "SOS",
  "SRD",
  "SSP",
  "STN",
  "SYP",
  "SZL",
  "THB",
  "TJS",
  "TMT",
  "TND",
  "TOP",
  "TRY",
  "TTD",
  "TVD",
  "TWD",
  "TZS",
  "UAH",
  "UGX",
  "USD",
  "UYU",
  "UZS",
  "VES",
  "VND",
  "VUV",
  "WST",
  "XAF",
  "XCD",
  "XDR",
  "XOF",
  "XPF",
  "YER",
  "ZAR",
  "ZMW",
  "ZWL"
]
