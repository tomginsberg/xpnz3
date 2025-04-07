// server.js (or your main Fastify file)

import Fastify from "fastify"
import cors from "@fastify/cors"
import admin from "firebase-admin"
import { Timestamp } from "firebase-admin/firestore" // Import Timestamp
import { omit, uniq } from "lodash-es" // Keep lodash if still needed for data manipulation
// Import utility functions (ensure path is correct)
import {
  defaultCategories,
  generateId,
  getDateString,
  integerCentsToDollars,
  integerMultiplyByFloat,
  integerSplitByWeights,
  supportedCurrencies
} from "./utilities.js"
import { connectFirestoreEmulator } from "firebase/firestore" // Assuming utilities.js exists and is updated

// --- Firebase Admin Initialization ---
// Load service account credentials from environment variables
// or specify the path directly.
// Ensure GOOGLE_APPLICATION_CREDENTIALS environment variable is set.
try {
  admin.initializeApp({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: "xpnz-b7857.firebaseapp.com",
    projectId: "xpnz-b7857",
    storageBucket: "xpnz-b7857.firebasestorage.app",
    messagingSenderId: "559439908567",
    appId: "1:559439908567:web:1f4297d0b2511c9df1aa92"
  })
  console.log("Firebase Admin SDK initialized successfully.")
} catch (error) {
  console.error("Firebase Admin SDK initialization failed:", error)
  process.exit(1)
}

const firestore = admin.firestore() // Firestore database instance
// --- End Firebase Admin Initialization ---

const app = Fastify({ logger: true })

app.register(cors, { origin: "*" })

// --- Helper Functions ---

/**
 * Finds a ledger document ID and data by its name.
 * @param {admin.firestore.Firestore} db - Firestore instance.
 * @param {string} ledgerName - The name of the ledger.
 * @returns {Promise<{id: string, data: admin.firestore.DocumentData}|null>} The document ID and data or null if not found.
 */
async function findLedgerDocByName(db, ledgerName) {
  if (!ledgerName) return null
  const ledgersRef = db.collection("ledgers")
  const q = ledgersRef.where("name", "==", ledgerName).limit(1)
  const snapshot = await q.get()
  if (snapshot.empty) {
    return null
  }
  const doc = snapshot.docs[0]
  return { id: doc.id, data: doc.data() }
}

/**
 * Fetches member documents for a given list of IDs within a ledger.
 * @param {admin.firestore.Firestore} db Firestore instance
 * @param {admin.firestore.Transaction | null} t Firestore transaction object (optional)
 * @param {string} ledgerId Ledger Document ID
 * @param {string[]} memberIds Array of member IDs to fetch.
 * @returns {Promise<Map<string, admin.firestore.DocumentData>>} Map of memberId to member data.
 */
async function getMemberDataByIds(db, t, ledgerId, memberIds) {
  if (!memberIds || memberIds.length === 0) {
    return new Map()
  }
  const memberRefs = memberIds.map((id) => db.collection("ledgers").doc(ledgerId).collection("members").doc(id))
  const memberDocs = t ? await t.getAll(...memberRefs) : await db.getAll(...memberRefs) // Use transaction if available

  const memberDataMap = new Map()
  memberDocs.forEach((doc) => {
    if (doc.exists) {
      memberDataMap.set(doc.id, doc.data())
    }
  })
  return memberDataMap
}

// --- Balance Calculation Logic (Adapted for Firestore) ---

/**
 * Calculates the balance for each member in a ledger using Firestore.
 * @param {admin.firestore.Firestore} db Firestore instance
 * @param {admin.firestore.Transaction | null} t Firestore transaction object (optional)
 * @param {string} ledgerId Ledger Document ID
 * @param {string} ledgerName Ledger Name
 * @param {object} options Calculation options (moneyFormat: 'dollars' | 'cents', errorOnUnbalancedDeletedMember: boolean)
 * @returns {Promise<Array<object>>} Array of member balance objects { id, name, paid, owes, balance, isActive }
 */
async function getBalanceForLedgerFirestore(db, t, ledgerId, ledgerName, options = {}) {
  const { moneyFormat = "dollars", errorOnUnbalancedDeletedMember = true } = options

  if (moneyFormat !== "dollars" && moneyFormat !== "cents") {
    throw new Error("Invalid money format.")
  }

  const ledgerRef = db.collection("ledgers").doc(ledgerId)

  // 1. Fetch all non-deleted, non-template transactions for the ledger
  const transactionsRef = ledgerRef.collection("transactions")
  const transactionsQuery = transactionsRef.where("isTemplate", "==", false).where("isDeleted", "==", false)
  const transactionsSnapshot = t ? await t.get(transactionsQuery) : await transactionsQuery.get() // Use transaction if available

  // 2. Fetch all members for the ledger
  const membersRef = ledgerRef.collection("members")
  const membersSnapshot = t ? await t.get(membersRef) : await membersRef.get() // Use transaction if available
  const members = membersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

  // 3. Calculate balance for each member
  return members.map((member) => {
    const memberId = member.id
    let totalPaidCents = 0
    let totalOwesCents = 0

    transactionsSnapshot.docs.forEach((doc) => {
      const tx = doc.data()
      const contributionsMap = tx.contributions || {}
      const contribution = contributionsMap[memberId]

      if (contribution) {
        const amountCents = contribution.amount || 0 // Amount is stored in cents
        const weight = contribution.weight || 0
        const multiplier = tx.exchangeRate || 1 // Use exchange rate stored on transaction
        const adjustedAmountCents = integerMultiplyByFloat(amountCents, multiplier)

        // Calculate owes based on split *within this transaction*
        const txMemberIds = Object.keys(contributionsMap)
        const txWeights = txMemberIds.map((id) => contributionsMap[id]?.weight || 0)
        const txTotalAmount = txMemberIds.reduce((sum, id) => {
          const memberAmount = contributionsMap[id]?.amount || 0
          const memberMultiplier = tx.exchangeRate || 1
          return sum + integerMultiplyByFloat(memberAmount, memberMultiplier)
        }, 0)

        const owesCentsArray = integerSplitByWeights(txTotalAmount, txWeights, doc.id)
        const memberOwesIndex = txMemberIds.indexOf(memberId)
        const memberOwesCents = memberOwesIndex !== -1 ? owesCentsArray[memberOwesIndex] : 0

        if (tx.expenseType === "income") {
          totalPaidCents -= adjustedAmountCents // Receiving money is like negative paid
          totalOwesCents -= memberOwesCents
        } else {
          // expense or transfer
          totalPaidCents += adjustedAmountCents
          totalOwesCents += memberOwesCents
        }
      }
    })

    const balanceCents = totalPaidCents - totalOwesCents

    // Check for unbalanced inactive members
    if (errorOnUnbalancedDeletedMember && !member.isActive && balanceCents !== 0) {
      console.error(
        `Assertion Failure: Inactive member ${member.name} (ID: ${memberId}) in ledger ${ledgerName} has non-zero balance (${balanceCents} cents).`
      )
      throw new Error(`Assertion failure: inactive member ${member.name} has a non-zero balance.`)
    }

    // Format output
    if (moneyFormat === "dollars") {
      return {
        id: memberId,
        name: member.name,
        isActive: member.isActive,
        paid: integerCentsToDollars(totalPaidCents),
        owes: integerCentsToDollars(totalOwesCents),
        balance: integerCentsToDollars(balanceCents)
      }
    } else {
      // cents
      return {
        id: memberId,
        name: member.name,
        isActive: member.isActive,
        paid: totalPaidCents,
        owes: totalOwesCents,
        balance: balanceCents
      }
    }
  })
}

/**
 * Audits members in a ledger (Firestore version).
 * @param {admin.firestore.Firestore} db Firestore instance
 * @param {admin.firestore.Transaction} t Firestore transaction object
 * @param {string} ledgerId Ledger Document ID
 * @param {string} ledgerName Ledger Name
 */
async function auditMembersFirestore(db, t, ledgerId, ledgerName) {
  console.log(`Auditing members for ledger: ${ledgerName} (ID: ${ledgerId})`)
  try {
    const balances = await getBalanceForLedgerFirestore(db, t, ledgerId, ledgerName, {
      moneyFormat: "cents",
      errorOnUnbalancedDeletedMember: false
    })

    const membersToReactivate = balances.filter((b) => !b.isActive && b.balance !== 0).map((b) => b.id)

    if (membersToReactivate.length > 0) {
      const membersRef = db.collection("ledgers").doc(ledgerId).collection("members")
      for (const memberId of membersToReactivate) {
        t.update(membersRef.doc(memberId), { isActive: true })
      }
      console.log(`Reactivated ${membersToReactivate.length} members in ledger ${ledgerName}.`)
    } else {
      console.log(`No members needed reactivation in ledger ${ledgerName}.`)
    }
  } catch (error) {
    console.error(`Error during member audit for ledger ${ledgerName}:`, error)
    // Decide whether to re-throw
  }
}

// --- Route Handlers (Modified for Firestore) ---

// GET /members and /members/:id
async function membersGetHandler(request, reply) {
  // Filters from query string OR path parameter
  const { ledger: ledgerName, name: filterName, is_active: filterIsActive } = request.query
  const { id: memberIdParam } = request.params // For /members/:id

  if (!ledgerName && !memberIdParam) {
    // If getting all members, ledger name is required
    return reply
      .code(400)
      .send({ error: "The 'ledger' query parameter (ledger name) is required when not specifying a member ID." })
  }
  // If getting specific member, we still need ledger context eventually, but maybe not required in query
  // Let's assume ledgerName is always provided for now, matching original likely usage

  try {
    let targetLedgerName = ledgerName
    let targetLedgerId = null

    // If getting a specific member by ID, find their ledger first
    if (memberIdParam && !ledgerName) {
      // This requires searching across all members subcollections - potentially slow/expensive.
      // Consider requiring ledgerName even for /members/:id or implementing a different lookup mechanism.
      // For now, let's assume ledgerName IS provided in the query for /members/:id as well.
      return reply
        .code(400)
        .send({ error: "The 'ledger' query parameter is required even when specifying a member ID." })
    }

    if (ledgerName) {
      const ledgerDoc = await findLedgerDocByName(firestore, ledgerName)
      console.log("ledgerDoc", ledgerDoc)
      if (!ledgerDoc) {
        return reply.code(404).send({ error: "The specified ledger does not exist." })
      }
      targetLedgerId = ledgerDoc.id
      targetLedgerName = ledgerName // Already have it
    } else {
      // This case should be prevented by checks above, but handle defensively
      return reply.code(400).send({ error: "Ledger context is required." })
    }

    const membersCollectionRef = firestore.collection("ledgers").doc(targetLedgerId).collection("members")

    // Handle GET /members/:id
    if (memberIdParam) {
      const memberDoc = await membersCollectionRef.doc(memberIdParam).get()
      if (!memberDoc.exists) {
        return reply.code(404).send({ error: "The specified member could not be found in this ledger." })
      }
      const memberData = memberDoc.data()
      // Format response to match original API (add ledger name, ensure boolean isActive)
      return reply.status(200).send({
        id: memberDoc.id,
        name: memberData.name,
        ledger: targetLedgerName,
        is_active: Boolean(memberData.isActive) // Ensure boolean
      })
    }

    // Handle GET /members?ledger=...&filters...
    let query = membersCollectionRef
    if (filterName) {
      query = query.where("name", "==", filterName)
    }
    if (typeof filterIsActive !== "undefined") {
      const isActiveBool = filterIsActive === "true" || filterIsActive === "1" || filterIsActive === true
      query = query.where("isActive", "==", isActiveBool)
    }

    const snapshot = await query.get()
    const members = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name,
        ledger: targetLedgerName, // Add ledger name
        is_active: Boolean(data.isActive) // Ensure boolean
      }
    })

    return reply.status(200).send(members)
  } catch (error) {
    app.log.error("Error in membersGetHandler:", error)
    return reply.code(500).send({ error: "Internal server error fetching members." })
  }
}

// POST /members and PUT /members/:id
async function membersPutPostHandler(request, reply) {
  const isPost = request.params.id === undefined
  const isPut = !isPost
  const memberId = request.params.id // For PUT
  const { name, ledger: ledgerName, is_active } = request.body

  // --- Request Validation (Similar to Original) ---
  if (request.body.id && isPost) {
    return reply.code(400).send({ error: "Cannot specify an id on POST." })
  }
  if (isPut && request.body.id && request.body.id !== memberId) {
    return reply.code(400).send({ error: "ID in body does not match ID in URL." })
  }
  if (!name || !ledgerName || typeof is_active === "undefined") {
    return reply.code(400).send({ error: "Missing required fields: name, ledger (name), is_active." })
  }
  // --- End Validation ---

  try {
    const ledgerDoc = await findLedgerDocByName(firestore, ledgerName)
    if (!ledgerDoc) {
      return reply.code(404).send({ error: "The specified ledger does not exist." })
    }
    const ledgerId = ledgerDoc.id
    const membersCollectionRef = firestore.collection("ledgers").doc(ledgerId).collection("members")

    // Check for name conflict
    const conflictQuery = membersCollectionRef.where("name", "==", name).limit(1)
    const conflictSnapshot = await conflictQuery.get()
    let conflictExists = false
    let conflictingMemberId = null
    if (!conflictSnapshot.empty) {
      conflictExists = true
      conflictingMemberId = conflictSnapshot.docs[0].id
    }

    // --- POST Logic ---
    if (isPost) {
      if (conflictExists) {
        return reply.code(409).send({ error: "A member with the same name already exists in this ledger." })
      }

      const newMemberId = generateId() // Or use Firestore auto-ID with .add()
      const memberData = {
        name: name,
        isActive: Boolean(is_active),
        userId: null // As per schema
      }
      await membersCollectionRef.doc(newMemberId).set(memberData)

      const createdMemberResponse = {
        id: newMemberId,
        ledger: ledgerName,
        ...memberData,
        is_active: memberData.isActive
      } // Use is_active for response
      return reply.code(201).send({ message: "Member created successfully.", member: createdMemberResponse })
    }
    // --- PUT Logic ---
    else {
      // isPut
      if (conflictExists && conflictingMemberId !== memberId) {
        return reply.code(409).send({ error: "Another member with the same name already exists in this ledger." })
      }

      const memberRef = membersCollectionRef.doc(memberId)
      const memberDoc = await memberRef.get()

      if (!memberDoc.exists) {
        return reply.code(404).send({ message: "Member not found. Cannot update via PUT. Use POST to create." })
      }

      const updateData = {
        name: name,
        isActive: Boolean(is_active)
      }
      await memberRef.update(updateData)

      const updatedMemberResponse = {
        id: memberId,
        ledger: ledgerName,
        ...updateData,
        is_active: updateData.isActive
      }
      return reply.code(200).send({ message: "Member updated successfully.", member: updatedMemberResponse })
    }
  } catch (error) {
    app.log.error("Error in membersPutPostHandler:", error)
    return reply.code(500).send({ error: "Internal server error processing member." })
  }
}

// DELETE /members/:id
async function membersDeleteHandler(request, reply) {
  const { id: memberId } = request.params
  // We need ledger context. Assume it's passed as a query param like '?ledger=ledgerName'
  const { ledger: ledgerName } = request.query

  if (!memberId) {
    return reply.code(400).send({ error: "Member ID parameter is required." })
  }
  if (!ledgerName) {
    return reply.code(400).send({ error: "The 'ledger' query parameter (ledger name) is required for context." })
  }

  try {
    const ledgerDoc = await findLedgerDocByName(firestore, ledgerName)
    if (!ledgerDoc) {
      return reply.code(404).send({ error: "The specified ledger does not exist." })
    }
    const ledgerId = ledgerDoc.id
    const ledgerRef = firestore.collection("ledgers").doc(ledgerId)
    const memberRef = ledgerRef.collection("members").doc(memberId)

    await firestore.runTransaction(async (t) => {
      const memberDoc = await t.get(memberRef)
      if (!memberDoc.exists) {
        throw { status: 404, message: "The specified member does not exist." }
      }

      // Check balance within transaction
      const balances = await getBalanceForLedgerFirestore(firestore, t, ledgerId, ledgerName, { moneyFormat: "cents" })
      const memberBalanceInfo = balances.find((b) => b.id === memberId)
      const balanceIsZero = memberBalanceInfo ? Math.abs(memberBalanceInfo.balance) === 0 : true

      if (!balanceIsZero) {
        throw { status: 400, message: "Cannot delete a member with a non-zero balance." }
      }

      // Check involvement in transactions
      const transactionsInvolvingMemberQuery = ledgerRef
        .collection("transactions")
        .where(`contributions.${memberId}`, "!=", null) // Check if the key exists
        .limit(1)
      const involvedSnapshot = await t.get(transactionsInvolvingMemberQuery)
      const isMemberInvolved = !involvedSnapshot.empty

      // Delete or Deactivate
      if (isMemberInvolved) {
        t.update(memberRef, { isActive: false })
      } else {
        t.delete(memberRef)
      }
    })

    // Original API returned 200 on success, not 204
    return reply.code(200).send({ message: "Member deactivated or deleted successfully." }) // Match original API response if possible
  } catch (error) {
    app.log.error(`Error deleting member ${memberId} in ledger ${ledgerName}:`, error)
    if (error.status) {
      // Send specific status and message if thrown from transaction
      return reply.code(error.status).send({ message: error.message })
    } else {
      return reply.code(500).send({ error: "Internal server error processing member deletion." })
    }
  }
}

// --- Transaction Helper: Format Firestore Transaction Doc for API Response ---
/**
 * Formats a single Firestore transaction document and its contributions into the API structure.
 * @param {admin.firestore.DocumentSnapshot} doc Firestore transaction document snapshot.
 * @param {string} ledgerName Ledger Name.
 * @param {Map<string, admin.firestore.DocumentData>} memberDataMap Map of memberId to member data (including name).
 * @param {object} options Formatting options (format, useExchangeRates, moneyFormat).
 * @returns {object} Formatted transaction object for the API response.
 */
function formatSingleTransactionForAPI(doc, ledgerName, memberDataMap, options) {
  const { format = "object", useExchangeRates = false, moneyFormat = "dollars" } = options
  const data = doc.data()

  let transaction = {
    id: doc.id,
    ledger: ledgerName,
    name: data.name,
    currency: data.currency,
    category: data.category,
    date: data.date, // Assumes string format 'YYYY-MM-DD'
    exchange_rate: data.exchangeRate,
    expense_type: data.expenseType
    // Add createdAt if needed, converting from Timestamp: data.createdAt.toDate().toISOString()
    // is_template and is_deleted are usually filtered out before this point
  }

  const contributionsMap = data.contributions || {}
  const memberIds = Object.keys(contributionsMap)

  // Calculate total amount and process contributions
  let totalAmountCents = 0
  const processedContributions = memberIds.map((memberId) => {
    const contribution = contributionsMap[memberId]
    const amountCents = contribution.amount || 0
    const weight = contribution.weight || 0
    const multiplier = useExchangeRates ? transaction.exchange_rate || 1 : 1
    const adjustedAmountCents = integerMultiplyByFloat(amountCents, multiplier)
    totalAmountCents += adjustedAmountCents
    return { memberId, amountCents: adjustedAmountCents, weight }
  })

  transaction.amount = totalAmountCents // Total amount in cents

  // Split owes based on weights
  const owesCentsArray = integerSplitByWeights(
    transaction.amount,
    processedContributions.map((c) => c.weight),
    transaction.id
  )

  // Format based on options
  let paidArray = processedContributions.map((c) => c.amountCents)
  let owesArray = owesCentsArray

  if (moneyFormat === "dollars") {
    transaction.amount = integerCentsToDollars(transaction.amount)
    paidArray = paidArray.map(integerCentsToDollars)
    owesArray = owesArray.map(integerCentsToDollars)
  }

  // Add contributions in the required format
  if (format === "array") {
    transaction.members = memberIds.map((id) => memberDataMap.get(id)?.name || id) // Use fetched names
    transaction.member_ids = memberIds
    transaction.weights = processedContributions.map((c) => c.weight)
    transaction.paid = paidArray
    transaction.owes = owesArray
  } else {
    // 'object' or 'hash'
    const contributionDetails = format === "object" ? [] : {}
    processedContributions.forEach((c, i) => {
      const memberName = memberDataMap.get(c.memberId)?.name || c.memberId // Fallback to ID if name not found
      const detail = {
        id: c.memberId,
        name: memberName, // Include member name
        weight: c.weight,
        paid: paidArray[i],
        owes: owesArray[i]
      }
      if (format === "hash") {
        contributionDetails[memberName] = detail // Use name as key for hash format
      } else {
        // format === 'object'
        contributionDetails.push(detail)
      }
    })
    transaction.contributions = contributionDetails
  }

  return transaction
}

// GET /transactions and /transactions/:id
async function transactionsGetHandler(request, reply) {
  const { ledger: ledgerName, ...filters } = request.query
  const { id: transactionIdParam } = request.params

  if (!ledgerName) {
    return reply.code(400).send({ error: "The 'ledger' query parameter (ledger name) is required." })
  }
  if (filters.date) {
    return reply.code(400).send({ message: 'The "date" filter is not supported. Use "dateafter"/"datebefore".' })
  }

  try {
    const ledgerDoc = await findLedgerDocByName(firestore, ledgerName)
    if (!ledgerDoc) {
      return reply.code(404).send({ error: "The specified ledger does not exist." })
    }
    const ledgerId = ledgerDoc.id
    const transactionsRef = firestore.collection("ledgers").doc(ledgerId).collection("transactions")
    let transactionDocs = []

    // --- Fetch Transaction Documents ---
    if (transactionIdParam) {
      const docSnap = await transactionsRef.doc(transactionIdParam).get()
      if (docSnap.exists && !docSnap.data().isDeleted) {
        transactionDocs.push(docSnap)
      }
    } else {
      let query = transactionsRef
      query = query.where("isTemplate", "==", false)
      query = query.where("isDeleted", "==", false)

      if (filters.name) query = query.where("name", "==", filters.name)
      if (filters.category) query = query.where("category", "==", filters.category)
      if (filters.currency) query = query.where("currency", "==", filters.currency)
      if (filters.expensetype) query = query.where("expenseType", "==", filters.expensetype)
      if (filters.dateafter) query = query.where("date", ">=", filters.dateafter)
      if (filters.datebefore) query = query.where("date", "<=", filters.datebefore)

      query = query.orderBy("date", "desc").orderBy("createdAt", "desc")
      const snapshot = await query.get()
      transactionDocs = snapshot.docs
    }

    if (transactionIdParam && transactionDocs.length === 0) {
      return reply.code(404).send({ message: "Transaction not found or has been deleted." })
    }
    if (transactionDocs.length === 0) {
      return reply.status(200).send([]) // Return empty array if no transactions match
    }

    // --- Fetch Necessary Member Data ---
    // Collect all unique member IDs involved in the fetched transactions
    const allMemberIds = new Set()
    transactionDocs.forEach((doc) => {
      const contributions = doc.data().contributions || {}
      Object.keys(contributions).forEach((id) => allMemberIds.add(id))
    })
    const memberDataMap = await getMemberDataByIds(firestore, null, ledgerId, Array.from(allMemberIds))

    // --- Format Transactions for API Response ---
    const options = {
      format: "object", // Default format from original API
      useExchangeRates: false, // Default
      moneyFormat: "dollars" // Default
    }
    const formattedTransactions = transactionDocs.map((doc) =>
      formatSingleTransactionForAPI(doc, ledgerName, memberDataMap, options)
    )

    return reply.status(200).send(transactionIdParam ? formattedTransactions[0] : formattedTransactions)
  } catch (error) {
    app.log.error("Error in transactionsGetHandler:", error)
    return reply.code(500).send({ error: "Internal server error fetching transactions." })
  }
}

// Helper: Validate transaction data before saving (Firestore context)
async function validateTransactionFirestore(db, transactionData) {
  // (Reusing the validation logic from the Firebase Functions version)
  // Basic structure checks
  if (!transactionData.ledger) throw { status: 400, message: "Ledger name is required." }
  if (!transactionData.currency) throw { status: 400, message: "Currency is required." }
  // API uses expense_type, map it internally if needed, or expect expenseType
  const expenseType = transactionData.expense_type || transactionData.expenseType
  if (!expenseType) throw { status: 400, message: "Expense type (expense_type) is required." }

  if (
    !transactionData.contributions ||
    !Array.isArray(transactionData.contributions) ||
    transactionData.contributions.length === 0
  ) {
    throw { status: 400, message: "Contributions array is required and must not be empty." }
  }
  if (!transactionData.name && !transactionData.category) {
    throw { status: 400, message: "A transaction must have a name or a category." }
  }
  if (!["expense", "income", "transfer"].includes(expenseType)) {
    throw { status: 400, message: 'The expense type must be either "expense", "income", or "transfer".' }
  }
  if (!supportedCurrencies.includes(transactionData.currency)) {
    throw { status: 400, message: `Currency '${transactionData.currency}' is not supported.` }
  }

  // Contribution checks (assuming input 'paid' is dollars from client)
  const memberIds = []
  let totalWeight = 0
  for (const c of transactionData.contributions) {
    if (!c.id || typeof c.weight === "undefined" || typeof c.paid === "undefined") {
      throw { status: 400, message: "Each contribution must have id, weight, and paid fields." }
    }
    if (c.paid < 0) {
      // Check paid amount (dollars)
      throw {
        status: 400,
        message: `All ${expenseType === "income" ? "received" : "paid"} amounts must be non-negative.`
      }
    }
    if (memberIds.includes(c.id)) {
      throw { status: 400, message: "Member IDs in contributions must be unique." }
    }
    memberIds.push(c.id)
    totalWeight += c.weight
  }
  // Check if transaction has impact (using dollars input)
  if (totalWeight === 0 && transactionData.contributions.every((c) => c.paid === 0)) {
    throw { status: 400, message: "Transaction has no financial impact (all paid amounts and weights are zero)." }
  }

  // Check ledger existence
  const ledgerDoc = await findLedgerDocByName(db, transactionData.ledger)
  if (!ledgerDoc) {
    throw { status: 400, message: "The specified ledger does not exist." }
  }
  const ledgerId = ledgerDoc.id

  // Check member existence within the ledger
  const memberRefs = memberIds.map((id) => db.collection("ledgers").doc(ledgerId).collection("members").doc(id))
  const memberDocs = await db.getAll(...memberRefs)
  const existingMemberIds = memberDocs.filter((doc) => doc.exists).map((doc) => doc.id)

  if (existingMemberIds.length !== memberIds.length) {
    const missingIds = memberIds.filter((id) => !existingMemberIds.includes(id))
    throw { status: 400, message: `One or more members do not exist in the ledger: ${missingIds.join(", ")}` }
  }

  return { ledgerId, ledgerCurrency: ledgerDoc.data.currency, validatedExpenseType: expenseType } // Return ledgerId, currency and validated type
}

// Helper: Fetch exchange rate (same as original, ensure fetch is available)
async function getExchangeRate(baseCurrency, newCurrency) {
  if (baseCurrency === newCurrency) return 1
  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`) // Requires node-fetch or Node 18+
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`)
    const exchangeRates = await response.json()
    if (!exchangeRates.rates || !exchangeRates.rates[newCurrency]) {
      throw new Error(`Rate for ${newCurrency} not found for base ${baseCurrency}.`)
    }
    return 1 / exchangeRates.rates[newCurrency]
  } catch (error) {
    console.error("Exchange rate fetch error:", error)
    throw { status: 503, message: `Service Unavailable: Unable to get exchange rates. ${error.message}` }
  }
}

// POST /transactions
async function transactionsPostHandler(request, reply) {
  const transactionData = { ...request.body } // Copy request body

  try {
    // 1. Validate Input Data (returns ledgerId, currency, validated type)
    const { ledgerId, ledgerCurrency, validatedExpenseType } = await validateTransactionFirestore(
      firestore,
      transactionData
    )
    const ledgerRef = firestore.collection("ledgers").doc(ledgerId)

    // 2. Prepare Firestore Document Data
    const transactionId = generateId()
    const now = Timestamp.now() // Use Firestore Timestamp
    const dateString = transactionData.date || getDateString() // Default to today

    const exchangeRate = await getExchangeRate(ledgerCurrency, transactionData.currency)

    // Convert contribution 'paid' from dollars (API) to cents (Firestore)
    const contributionsMap = transactionData.contributions.reduce((acc, c) => {
      acc[c.id] = {
        amount: dollarsToIntegerCents(c.paid), // Convert dollars to cents
        weight: c.weight
      }
      return acc
    }, {})

    const firestoreDoc = {
      name: transactionData.name?.trim() || null,
      currency: transactionData.currency,
      category: transactionData.category?.trim() || null,
      date: dateString,
      expenseType: validatedExpenseType, // Use validated type
      createdAt: now, // Store Firestore Timestamp
      exchangeRate: exchangeRate,
      contributions: contributionsMap, // Store map with amounts in cents
      isTemplate: false,
      isDeleted: false
    }

    // 3. Save using Firestore Transaction (includes audit)
    await firestore.runTransaction(async (t) => {
      const newTransactionRef = ledgerRef.collection("transactions").doc(transactionId)
      t.set(newTransactionRef, firestoreDoc)
      await auditMembersFirestore(firestore, t, ledgerId, transactionData.ledger)
    })

    // 4. Fetch and return the newly created transaction in the desired API format
    const newDocSnap = await ledgerRef.collection("transactions").doc(transactionId).get()
    if (!newDocSnap.exists) throw { status: 500, message: "Failed to retrieve created transaction." }

    const memberIds = Object.keys(firestoreDoc.contributions)
    const memberDataMap = await getMemberDataByIds(firestore, null, ledgerId, memberIds)
    const formattedTransaction = formatSingleTransactionForAPI(newDocSnap, transactionData.ledger, memberDataMap, {
      format: "object",
      moneyFormat: "dollars",
      useExchangeRates: false
    })

    return reply.code(201).send({ message: "Transaction created successfully.", transaction: formattedTransaction })
  } catch (error) {
    app.log.error("Error creating transaction:", error)
    const status = error.status || 500
    const message = error.message || "Internal server error creating transaction."
    return reply.code(status).send({ error: message })
  }
}

// PUT /transactions/:id
async function transactionsPutHandler(request, reply) {
  const { id: transactionId } = request.params
  const transactionData = { ...request.body }

  if (!transactionId) {
    return reply.code(400).send({ error: "Transaction ID parameter is required." })
  }
  // Optional: Check if transactionData.id matches transactionId

  try {
    // 1. Validate Input Data
    const { ledgerId, ledgerCurrency, validatedExpenseType } = await validateTransactionFirestore(
      firestore,
      transactionData
    )
    const ledgerRef = firestore.collection("ledgers").doc(ledgerId)
    const transactionRef = ledgerRef.collection("transactions").doc(transactionId)

    // 2. Prepare Firestore Update Data
    const dateString = transactionData.date || getDateString()
    const contributionsMap = transactionData.contributions.reduce((acc, c) => {
      acc[c.id] = { amount: dollarsToIntegerCents(c.paid), weight: c.weight }
      return acc
    }, {})

    const updateDocData = {
      name: transactionData.name?.trim() || null,
      currency: transactionData.currency,
      category: transactionData.category?.trim() || null,
      date: dateString,
      expenseType: validatedExpenseType,
      contributions: contributionsMap
      // exchangeRate might be updated within transaction if currency changes
    }

    // 3. Update using Firestore Transaction
    await firestore.runTransaction(async (t) => {
      const existingDocSnap = await t.get(transactionRef)
      if (!existingDocSnap.exists) throw { status: 404, message: "Transaction not found. Use POST to create." }

      const existingData = existingDocSnap.data()
      if (existingData.isDeleted) throw { status: 410, message: "Transaction deleted." }
      if (existingData.isTemplate) throw { status: 400, message: "Cannot update template." }

      // Update exchange rate if currency changed
      if (existingData.currency !== updateDocData.currency) {
        updateDocData.exchangeRate = await getExchangeRate(ledgerCurrency, updateDocData.currency)
      } else {
        updateDocData.exchangeRate = existingData.exchangeRate // Keep existing if no change
      }

      t.update(transactionRef, updateDocData)
      await auditMembersFirestore(firestore, t, ledgerId, transactionData.ledger)
    })

    // 4. Fetch and return updated transaction
    const updatedDocSnap = await transactionRef.get()
    if (!updatedDocSnap.exists) throw { status: 500, message: "Failed to retrieve updated transaction." }

    const memberIds = Object.keys(updateDocData.contributions)
    const memberDataMap = await getMemberDataByIds(firestore, null, ledgerId, memberIds)
    const formattedTransaction = formatSingleTransactionForAPI(updatedDocSnap, transactionData.ledger, memberDataMap, {
      format: "object",
      moneyFormat: "dollars",
      useExchangeRates: false
    })

    return reply.code(200).send({ message: "Transaction updated successfully.", transaction: formattedTransaction })
  } catch (error) {
    app.log.error(`Error updating transaction ${transactionId}:`, error)
    const status = error.status || 500
    const message = error.message || "Internal server error updating transaction."
    return reply.code(status).send({ error: message })
  }
}

// DELETE /transactions/:id
async function transactionsDeleteHandler(request, reply) {
  const { id: transactionId } = request.params
  const { ledger: ledgerName } = request.query // Requires ledger context

  if (!transactionId) {
    return reply.code(400).send({ error: "Transaction ID parameter is required." })
  }
  if (!ledgerName) {
    return reply.code(400).send({ error: "The 'ledger' query parameter is required." })
  }

  try {
    const ledgerDoc = await findLedgerDocByName(firestore, ledgerName)
    if (!ledgerDoc) {
      return reply.code(404).send({ error: "The specified ledger does not exist." })
    }
    const ledgerId = ledgerDoc.id
    const ledgerRef = firestore.collection("ledgers").doc(ledgerId)
    const transactionRef = ledgerRef.collection("transactions").doc(transactionId)

    await firestore.runTransaction(async (t) => {
      const docSnap = await t.get(transactionRef)
      if (!docSnap.exists) throw { status: 204 } // Not found, mimic original 204

      const data = docSnap.data()
      if (data.isTemplate) throw { status: 400, message: "Templates cannot be deleted." }
      if (data.isDeleted) return // Already deleted, idempotent success

      t.update(transactionRef, { isDeleted: true })
      await auditMembersFirestore(firestore, t, ledgerId, ledgerName)
    })

    // Original API sent 200 on success
    return reply.code(200).send({ message: "Transaction deleted successfully." })
  } catch (error) {
    app.log.error(`Error deleting transaction ${transactionId}:`, error)
    if (error.status === 204) {
      return reply.code(204).send()
    } else if (error.status) {
      return reply.code(error.status).send({ message: error.message })
    } else {
      return reply.code(500).send({ error: "Internal server error deleting transaction." })
    }
  }
}

// GET /ledgers/:ledgerName/categories
async function categoriesGetHandler(request, reply) {
  const { ledgerName } = request.params
  if (!ledgerName) {
    return reply.code(400).send({ error: "Ledger name parameter is required." })
  }

  try {
    const ledgerDoc = await findLedgerDocByName(firestore, ledgerName)
    if (!ledgerDoc) {
      return reply.code(404).send({ error: "The specified ledger does not exist." })
    }
    const ledgerId = ledgerDoc.id

    const transactionsRef = firestore.collection("ledgers").doc(ledgerId).collection("transactions")
    const q = transactionsRef.where("isDeleted", "==", false).where("isTemplate", "==", false)
    const snapshot = await q.get()

    const categoriesFromDb = snapshot.docs.map((doc) => doc.data().category).filter((category) => category) // Filter out null/empty

    const allCategories = uniq([...defaultCategories, ...categoriesFromDb])
    return reply.status(200).send(allCategories)
  } catch (error) {
    app.log.error(`Error fetching categories for ${ledgerName}:`, error)
    return reply.code(500).send({ error: "Internal server error fetching categories." })
  }
}

// GET /ledgers/:ledgerName/balance
async function balancesGetHandler(request, reply) {
  const { ledgerName } = request.params
  if (!ledgerName) {
    return reply.code(400).send({ error: "Ledger name parameter is required." })
  }

  try {
    const ledgerDoc = await findLedgerDocByName(firestore, ledgerName)
    if (!ledgerDoc) {
      return reply.code(404).send({ error: "The specified ledger does not exist." })
    }
    const ledgerId = ledgerDoc.id

    const balances = await getBalanceForLedgerFirestore(firestore, null, ledgerId, ledgerName, {
      moneyFormat: "dollars",
      errorOnUnbalancedDeletedMember: true
    })

    // Filter out inactive members for API response
    const activeBalances = balances.filter((b) => b.isActive)
    // Original API response structure didn't include isActive, remove it if needed for strict compatibility
    const responseBalances = activeBalances.map((b) => omit(b, ["isActive"]))

    return reply.status(200).send(responseBalances)
  } catch (error) {
    app.log.error(`Error calculating balance for ${ledgerName}:`, error)
    if (error.message.includes("Assertion failure")) {
      return reply.code(500).send({ error: `Internal server error: ${error.message}` })
    } else {
      return reply.code(500).send({ error: "Internal server error calculating balance." })
    }
  }
}

// GET /ledgers/:ledgerName/settlement
async function settlementsGetHandler(request, reply) {
  const { ledgerName } = request.params
  if (!ledgerName) {
    return reply.code(400).send({ error: "Ledger name parameter is required." })
  }

  try {
    const ledgerDoc = await findLedgerDocByName(firestore, ledgerName)
    if (!ledgerDoc) {
      return reply.code(404).send({ error: "The specified ledger does not exist." })
    }
    const ledgerId = ledgerDoc.id

    let balances = await getBalanceForLedgerFirestore(firestore, null, ledgerId, ledgerName, {
      moneyFormat: "cents",
      errorOnUnbalancedDeletedMember: true
    })

    balances = balances.filter((b) => b.isActive && b.balance !== 0)
    balances.sort((a, b) => b.balance - a.balance)

    let settlements = []
    let creditors = balances.filter((b) => b.balance > 0)
    let debtors = balances.filter((b) => b.balance < 0)
    let creditorIndex = 0
    let debtorIndex = 0

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      let creditor = creditors[creditorIndex]
      let debtor = debtors[debtorIndex]
      let amount = Math.min(creditor.balance, Math.abs(debtor.balance))

      if (amount > 0.01) {
        // Use tolerance for cents comparison
        settlements.push({ payer: debtor.name, payee: creditor.name, amount: amount })
        creditor.balance -= amount
        debtor.balance += amount
      }
      if (Math.abs(creditor.balance) < 0.01) creditorIndex++
      if (Math.abs(debtor.balance) < 0.01) debtorIndex++
    }

    const formattedSettlements = settlements.map((s) => ({
      ...s,
      amount: integerCentsToDollars(s.amount)
    }))
    return reply.status(200).send(formattedSettlements)
  } catch (error) {
    app.log.error(`Error calculating settlement for ${ledgerName}:`, error)
    if (error.message.includes("Assertion failure")) {
      return reply.code(500).send({ error: `Internal server error: ${error.message}` })
    } else {
      return reply.code(500).send({ error: "Internal server error calculating settlement." })
    }
  }
}

// GET /ledgers (List public ledgers)
const ledgersGetHandler = async (request, reply) => {
  try {
    const ledgersRef = firestore.collection("ledgers")
    const q = ledgersRef.where("permissions", "==", "public") // Assuming 'permissions' field exists
    const snapshot = await q.get()
    // Format response similar to original if needed (e.g., just name, currency)
    const ledgers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    return reply.status(200).send(ledgers)
  } catch (error) {
    app.log.error("Error fetching public ledgers:", error)
    return reply.code(500).send({ error: "Internal server error fetching ledgers." })
  }
}

// GET /ledgers/:ledgerName (Specific ledger)
async function ledgersGetHandlerWithRoute(request, reply) {
  const { ledgerName } = request.params
  if (!ledgerName) {
    return reply.code(400).send({ error: "Ledger name parameter is required." })
  }
  try {
    const ledgerDoc = await findLedgerDocByName(firestore, ledgerName)
    if (!ledgerDoc) {
      return reply.code(404).send({ error: "The specified resource does not exist." })
    }
    // Return ID and data
    return reply.status(200).send({ id: ledgerDoc.id, ...ledgerDoc.data })
  } catch (error) {
    app.log.error(`Error fetching ledger ${ledgerName}:`, error)
    return reply.code(500).send({ error: "Internal server error fetching ledger details." })
  }
}

// POST /ledgers (Create ledger) - Renamed from PUT in original routes
async function ledgersPostHandler(request, reply) {
  const { name, currency, members, permissions = "public" } = request.body

  // Validation
  if (!name || !currency || !members || !Array.isArray(members) || members.length === 0) {
    return reply.code(400).send({ error: "Missing required fields: name, currency, members." })
  }
  if (members.some((m) => !m.name || typeof m.is_active === "undefined")) {
    // Match client field name 'is_active'
    return reply.code(400).send({ error: "Each member must have a name and is_active status." })
  }
  // TODO: Currency validation

  try {
    const existingLedger = await findLedgerDocByName(firestore, name)
    if (existingLedger) {
      return reply.code(409).send({ error: "A ledger with the specified name already exists." })
    }

    const ledgerRef = await firestore.runTransaction(async (t) => {
      const newLedgerRef = firestore.collection("ledgers").doc() // Auto-ID
      t.set(newLedgerRef, { name, currency, permissions })

      const membersCollectionRef = newLedgerRef.collection("members")
      for (const member of members) {
        const memberId = generateId() // Keep generating IDs for members
        const memberRef = membersCollectionRef.doc(memberId)
        t.set(memberRef, {
          name: member.name,
          isActive: Boolean(member.is_active), // Store as boolean
          userId: null
        })
      }
      return newLedgerRef
    })

    return reply
      .code(201)
      .send({ message: "Ledger and members created successfully.", ledgerId: ledgerRef.id, name: name })
  } catch (error) {
    app.log.error("Error creating ledger:", error)
    return reply.code(500).send({ error: "Internal server error creating ledger." })
  }
}

// --- Register Routes ---
// Note: Schema validation is removed here, but you can add it back using Fastify's schema capabilities
// if you adapt the schemas to match the expected request bodies.

// Ledgers
app.get("/ledgers", ledgersGetHandler)
app.get("/ledgers/:ledgerName", ledgersGetHandlerWithRoute)
app.post("/ledgers", ledgersPostHandler) // Changed from PUT in original example to POST

// Members
app.get("/members", membersGetHandler)
app.get("/members/:id", membersGetHandler) // Reuse handler, logic inside checks params.id
app.post("/members", membersPutPostHandler)
app.put("/members/:id", membersPutPostHandler) // Reuse handler, logic inside checks params.id
app.delete("/members/:id", membersDeleteHandler)

// Transactions
app.get("/transactions", transactionsGetHandler)
app.get("/transactions/:id", transactionsGetHandler) // Reuse handler
app.post("/transactions", transactionsPostHandler)
app.put("/transactions/:id", transactionsPutHandler)
app.delete("/transactions/:id", transactionsDeleteHandler)

// Utilities
app.get("/ledgers/:ledgerName/categories", categoriesGetHandler)
app.get("/ledgers/:ledgerName/balance", balancesGetHandler)
app.get("/ledgers/:ledgerName/settlement", settlementsGetHandler)

// --- Start Server ---
const start = async () => {
  try {
    // Use environment variable for port or default
    const port = process.env.PORT || 3001
    // Listen on all available interfaces in containers/cloud environments
    await app.listen({ port: port, host: "0.0.0.0" })
    app.log.info(`Server listening on port ${port}`)
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}

start()
