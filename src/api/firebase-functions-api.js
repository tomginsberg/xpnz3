// index.js
// Main entry point for Firebase Functions

const functions = require("firebase-functions")
const admin = require("firebase-admin")
const cors = require("cors")({ origin: true }) // Enable CORS

// Initialize Firebase Admin SDK
// Ensure your service account key is configured in your Firebase environment
// (e.g., via environment variables or application default credentials)
admin.initializeApp()

const db = admin.firestore() // Firestore database instance

// Import route handlers
const ledgerHandlers = require("./handlers/ledgers")
const memberHandlers = require("./handlers/members")
const transactionHandlers = require("./handlers/transactions")
const utilityHandlers = require("./handlers/utilities") // For balance, settlement, categories

// --- Ledger Routes ---

// GET /ledgers - List public ledgers
exports.getLedgers = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    ledgerHandlers.getPublicLedgers(db, req, res)
  })
})

// GET /ledgers/:ledgerName - Get specific ledger details by name
exports.getLedgerByName = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    ledgerHandlers.getLedgerByName(db, req, res)
  })
})

// POST /ledgers - Create a new ledger and its initial members
exports.createLedger = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    // TODO: Add schema validation if desired (using a library like Joi or Zod)
    // For now, assuming request body matches expected structure
    ledgerHandlers.createLedger(db, req, res)
  })
})

// --- Member Routes ---

// GET /members?ledger=ledgerName - Get members for a specific ledger (filtered)
// GET /members/:id?ledger=ledgerName - Get a specific member by ID within a ledger
exports.getMembers = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    memberHandlers.getMembers(db, req, res)
  })
})

// POST /members - Create a new member within a ledger
exports.createMember = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    // TODO: Add schema validation
    memberHandlers.createMember(db, req, res)
  })
})

// PUT /members/:id - Update/replace a member within a ledger
exports.updateMember = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    // TODO: Add schema validation
    memberHandlers.updateMember(db, req, res)
  })
})

// DELETE /members/:id?ledger=ledgerName - Delete/deactivate a member
exports.deleteMember = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    memberHandlers.deleteMember(db, req, res)
  })
})

// --- Transaction Routes ---

// GET /transactions?ledger=ledgerName&...filters - Get transactions for a ledger (filtered)
// GET /transactions/:id?ledger=ledgerName - Get a specific transaction by ID within a ledger
exports.getTransactions = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    transactionHandlers.getTransactionsHandler(db, req, res)
  })
})

// POST /transactions - Create a new transaction within a ledger
exports.createTransaction = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    // TODO: Add schema validation
    transactionHandlers.createTransactionHandler(db, req, res)
  })
})

// PUT /transactions/:id - Update/replace a transaction within a ledger
exports.updateTransaction = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    // TODO: Add schema validation
    transactionHandlers.updateTransactionHandler(db, req, res)
  })
})

// DELETE /transactions/:id?ledger=ledgerName - Mark a transaction as deleted
exports.deleteTransaction = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    transactionHandlers.deleteTransactionHandler(db, req, res)
  })
})

// --- Utility Routes (Balance, Settlement, Categories) ---

// GET /ledgers/:ledgerName/categories
exports.getCategories = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    utilityHandlers.categoriesGetHandler(db, req, res)
  })
})

// GET /ledgers/:ledgerName/balance
exports.getBalance = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    utilityHandlers.balancesGetHandler(db, req, res)
  })
})

// GET /ledgers/:ledgerName/settlement
exports.getSettlement = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    utilityHandlers.settlementsGetHandler(db, req, res)
  })
})

// --- Helper Functions (Could be in separate files) ---

/**
 * Finds a ledger document ID by its name.
 * @param {admin.firestore.Firestore} db - Firestore instance.
 * @param {string} ledgerName - The name of the ledger.
 * @returns {Promise<string|null>} The document ID or null if not found.
 */
async function findLedgerIdByName(db, ledgerName) {
  if (!ledgerName) return null
  const ledgersRef = db.collection("ledgers")
  const q = ledgersRef.where("name", "==", ledgerName).limit(1)
  const snapshot = await q.get()
  if (snapshot.empty) {
    return null
  }
  return snapshot.docs[0].id
}

// Export helper for use in handlers
module.exports.findLedgerIdByName = findLedgerIdByName

// NOTE: Recurring transactions (cron job) would be implemented using
// Firebase Scheduled Functions (exports.scheduledFunctionCrontab).
// The logic from `createRecurringTransactions` would need to be adapted
// to read templates and write new transactions using the Firestore SDK.
// This is not included here but follows a similar pattern.

// handlers/ledgers.js
// Route handlers for /ledgers endpoints

const admin = require("firebase-admin")
const { findLedgerIdByName } = require("../index") // Import helper if needed elsewhere, or define locally
const { generateId } = require("../utils/utilities") // Assuming utilities are ported

/**
 * Finds a ledger document ID by its name.
 * Helper function specific to ledger operations.
 * @param {admin.firestore.Firestore} db - Firestore instance.
 * @param {string} ledgerName - The name of the ledger.
 * @returns {Promise<{id: string, data: object}|null>} The document ID and data or null if not found.
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

// GET /ledgers - List public ledgers
exports.getPublicLedgers = async (db, req, res) => {
  try {
    const ledgersRef = db.collection("ledgers")
    // Assuming 'public' permission means the field is set to 'public'
    // Adjust if using 'is_private: false' or other conventions
    const q = ledgersRef.where("permissions", "==", "public")
    const snapshot = await q.get()
    const ledgers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    res.status(200).send(ledgers)
  } catch (error) {
    console.error("Error fetching public ledgers:", error)
    res.status(500).send({ error: "Internal server error fetching ledgers." })
  }
}

// GET /ledgers/:ledgerName - Get specific ledger details by name
exports.getLedgerByName = async (db, req, res) => {
  const { ledgerName } = req.params
  if (!ledgerName) {
    return res.status(400).send({ error: "Ledger name parameter is required." })
  }

  try {
    const ledgerDoc = await findLedgerDocByName(db, ledgerName)

    if (!ledgerDoc) {
      return res.status(404).send({ error: "The specified ledger does not exist." })
    }

    // Optionally fetch members/transactions count or other details if needed by client
    res.status(200).send({ id: ledgerDoc.id, ...ledgerDoc.data })
  } catch (error) {
    console.error(`Error fetching ledger ${ledgerName}:`, error)
    res.status(500).send({ error: "Internal server error fetching ledger details." })
  }
}

// POST /ledgers - Create a new ledger and its initial members
exports.createLedger = async (db, req, res) => {
  const { name, currency, members, permissions = "public" } = req.body // Match schema: permissions, not is_private

  // Basic validation
  if (!name || !currency || !members || !Array.isArray(members) || members.length === 0) {
    return res.status(400).send({ error: "Missing required fields: name, currency, and at least one member." })
  }
  if (members.some((m) => !m.name || typeof m.isActive === "undefined")) {
    // Check isActive based on migration script
    return res.status(400).send({ error: "Each member must have a name and isActive status." })
  }
  // TODO: Add currency validation (check against supportedCurrencies)

  try {
    // Check if ledger name already exists
    const existingLedger = await findLedgerDocByName(db, name)
    if (existingLedger) {
      return res.status(409).send({ error: "A ledger with the specified name already exists." })
    }

    // Use Firestore transaction to ensure atomicity
    const ledgerRef = await db.runTransaction(async (t) => {
      // 1. Create the ledger document
      const newLedgerRef = db.collection("ledgers").doc() // Auto-generate ID for ledger doc
      t.set(newLedgerRef, {
        name,
        currency,
        permissions // Use permissions field
        // Add other fields like createdAt if needed
      })

      // 2. Create member documents in the subcollection
      const membersCollectionRef = newLedgerRef.collection("members")
      for (const member of members) {
        const memberId = generateId() // Generate unique ID for member doc
        const memberRef = membersCollectionRef.doc(memberId)
        t.set(memberRef, {
          name: member.name,
          isActive: Boolean(member.isActive), // Ensure boolean
          userId: null // As per schema
          // Add other fields if needed
        })
      }
      return newLedgerRef // Return the reference to the new ledger
    })

    res.status(201).send({ message: "Ledger and members created successfully.", ledgerId: ledgerRef.id, name: name })
  } catch (error) {
    console.error("Error creating ledger:", error)
    if (error.code === 409) {
      // Just in case transaction failed after check
      res.status(409).send({ error: "A ledger with the specified name already exists." })
    } else {
      res.status(500).send({ error: "Internal server error creating ledger." })
    }
  }
}

// handlers/members.js
// Route handlers for /members endpoints

const admin = require("firebase-admin")
const { findLedgerIdByName } = require("../index") // Use shared helper
const { generateId } = require("../utils/utilities")
const { getBalanceForLedger } = require("./utilities") // Import balance calculation

// GET /members?ledger=ledgerName - Get members for a specific ledger (filtered)
// GET /members/:id?ledger=ledgerName - Get a specific member by ID within a ledger
exports.getMembers = async (db, req, res) => {
  const { ledger: ledgerName, name: filterName, is_active: filterIsActive } = req.query
  const { id: memberIdParam } = req.params // For /members/:id route

  if (!ledgerName) {
    return res.status(400).send({ error: "The 'ledger' query parameter (ledger name) is required." })
  }

  try {
    const ledgerId = await findLedgerIdByName(db, ledgerName)
    if (!ledgerId) {
      return res.status(404).send({ error: "The specified ledger does not exist." })
    }

    const membersCollectionRef = db.collection("ledgers").doc(ledgerId).collection("members")
    let query = membersCollectionRef // Start with base collection reference

    // --- Apply Filters ---
    // Specific Member ID takes precedence
    if (memberIdParam) {
      const memberDoc = await membersCollectionRef.doc(memberIdParam).get()
      if (!memberDoc.exists) {
        return res.status(404).send({ error: "The specified member could not be found in this ledger." })
      }
      // Return single member, matching original API structure
      return res.status(200).send({ id: memberDoc.id, ledger: ledgerName, ...memberDoc.data() })
    }

    // Filter by name (if provided)
    if (filterName) {
      query = query.where("name", "==", filterName)
    }

    // Filter by isActive status (if provided)
    // Ensure the query value matches the stored data type (boolean)
    if (typeof filterIsActive !== "undefined") {
      const isActiveBool = filterIsActive === "true" || filterIsActive === "1" || filterIsActive === true
      query = query.where("isActive", "==", isActiveBool)
    }

    // --- Execute Query ---
    const snapshot = await query.get()
    const members = snapshot.docs.map((doc) => ({
      id: doc.id,
      ledger: ledgerName, // Add ledger name for compatibility
      ...doc.data()
    }))

    res.status(200).send(members)
  } catch (error) {
    console.error(`Error fetching members for ledger ${ledgerName}:`, error)
    res.status(500).send({ error: "Internal server error fetching members." })
  }
}

// POST /members - Create a new member within a ledger
exports.createMember = async (db, req, res) => {
  const { name, ledger: ledgerName, is_active } = req.body

  // Basic validation
  if (!name || !ledgerName || typeof is_active === "undefined") {
    return res.status(400).send({ error: "Missing required fields: name, ledger (name), is_active." })
  }

  try {
    const ledgerId = await findLedgerIdByName(db, ledgerName)
    if (!ledgerId) {
      return res.status(404).send({ error: "The specified ledger does not exist." })
    }

    const membersCollectionRef = db.collection("ledgers").doc(ledgerId).collection("members")

    // Check for existing member with the same name in the same ledger
    const q = membersCollectionRef.where("name", "==", name).limit(1)
    const existingSnapshot = await q.get()
    if (!existingSnapshot.empty) {
      return res.status(409).send({ error: "A member with the same name already exists in this ledger." })
    }

    // Generate ID and create member
    const memberId = generateId()
    const memberData = {
      name: name,
      isActive: Boolean(is_active),
      userId: null // As per schema
    }

    await membersCollectionRef.doc(memberId).set(memberData)

    // Return created member data, matching API structure
    const createdMember = { id: memberId, ledger: ledgerName, ...memberData }
    res.status(201).send({ message: "Member created successfully.", member: createdMember })
  } catch (error) {
    console.error(`Error creating member in ledger ${ledgerName}:`, error)
    res.status(500).send({ error: "Internal server error creating member." })
  }
}

// PUT /members/:id - Update/replace a member within a ledger
exports.updateMember = async (db, req, res) => {
  const { id: memberId } = req.params
  const { name, ledger: ledgerName, is_active } = req.body // Get ledger name from body

  // Basic validation
  if (!memberId) {
    return res.status(400).send({ error: "Member ID parameter is required." })
  }
  if (!name || !ledgerName || typeof is_active === "undefined") {
    return res.status(400).send({ error: "Missing required fields in body: name, ledger (name), is_active." })
  }
  // Check if ID in body matches param ID (optional, but good practice like original API)
  if (req.body.id && req.body.id !== memberId) {
    return res.status(400).send({ error: "The id in the request body does not match the id in the URL." })
  }

  try {
    const ledgerId = await findLedgerIdByName(db, ledgerName)
    if (!ledgerId) {
      // Note: Original API returned 404 if member didn't exist, not if ledger didn't exist.
      // This check is slightly different but arguably more correct for the new structure.
      return res.status(404).send({ error: "The specified ledger does not exist." })
    }

    const memberRef = db.collection("ledgers").doc(ledgerId).collection("members").doc(memberId)

    // Check for name conflict (another member in the same ledger with the new name)
    if (name) {
      const q = db.collection("ledgers").doc(ledgerId).collection("members").where("name", "==", name).limit(1)
      const conflictSnapshot = await q.get()
      if (!conflictSnapshot.empty && conflictSnapshot.docs[0].id !== memberId) {
        return res.status(409).send({ error: "Another member with the same name already exists in this ledger." })
      }
    }

    // Prepare update data
    const updateData = {
      name: name,
      isActive: Boolean(is_active)
      // Do not update userId here unless explicitly intended
    }

    // Use set with merge:false (or update) to replace/update document
    // Need to check if it exists first for PUT semantics (replace or fail)
    const memberDoc = await memberRef.get()
    if (!memberDoc.exists) {
      return res.status(404).send({
        message: "The specified member does not exist and thus cannot be replaced. Use POST to create."
      })
    }

    await memberRef.update(updateData) // Use update to modify existing fields

    // Return updated member data
    const updatedMember = { id: memberId, ledger: ledgerName, ...updateData }
    res.status(200).send({ message: "Member updated successfully.", member: updatedMember })
  } catch (error) {
    console.error(`Error updating member ${memberId} in ledger ${ledgerName}:`, error)
    // Handle potential errors during update (e.g., permissions)
    res.status(500).send({ error: "Internal server error updating member." })
  }
}

// DELETE /members/:id?ledger=ledgerName - Delete/deactivate a member
exports.deleteMember = async (db, req, res) => {
  const { id: memberId } = req.params
  const { ledger: ledgerName } = req.query // Get ledger name from query

  if (!memberId) {
    return res.status(400).send({ error: "Member ID parameter is required." })
  }
  if (!ledgerName) {
    return res.status(400).send({ error: "The 'ledger' query parameter (ledger name) is required." })
  }

  try {
    const ledgerId = await findLedgerIdByName(db, ledgerName)
    if (!ledgerId) {
      return res.status(404).send({ error: "The specified ledger does not exist." })
    }

    const ledgerRef = db.collection("ledgers").doc(ledgerId)
    const memberRef = ledgerRef.collection("members").doc(memberId)

    // Use Firestore transaction for atomicity
    await db.runTransaction(async (t) => {
      const memberDoc = await t.get(memberRef)
      if (!memberDoc.exists) {
        // Throw error inside transaction to abort and send 404 later
        throw { status: 404, message: "The specified member does not exist." }
      }
      const memberData = memberDoc.data()

      // 1. Check member balance
      // Need to fetch transactions and calculate balance within the transaction
      // This requires the full balance logic (simplified here for brevity)
      // We pass the transaction object 't' to getBalanceForLedger
      const balances = await getBalanceForLedger(db, t, ledgerId, ledgerName, { moneyFormat: "cents" })
      const memberBalanceInfo = balances.find((b) => b.id === memberId)

      // Use a tolerance for floating point comparisons if using dollars, safer with cents
      const balanceIsZero = memberBalanceInfo ? Math.abs(memberBalanceInfo.balance) === 0 : true // Assume zero if not found (shouldn't happen)

      if (!balanceIsZero) {
        throw { status: 400, message: "Cannot delete a member with a non-zero balance." }
      }

      // 2. Check if member is involved in any transactions
      // This is harder in Firestore without joins. Query transactions where the memberId key exists in contributions.
      // Note: This query might be slow or require specific indexing.
      const transactionsInvolvingMemberQuery = ledgerRef
        .collection("transactions")
        .where(`contributions.${memberId}`, "!=", null) // Check if the key exists (basic check)
        .limit(1) // We only need to know if *any* exist

      const involvedSnapshot = await t.get(transactionsInvolvingMemberQuery)
      const isMemberInvolved = !involvedSnapshot.empty

      // 3. Delete or Deactivate
      if (isMemberInvolved) {
        // Deactivate: Update isActive to false
        t.update(memberRef, { isActive: false })
      } else {
        // Delete outright
        t.delete(memberRef)
      }
    })

    res.status(200).send({ message: "Member deactivated or deleted successfully." }) // Use 200 for success as per original API
  } catch (error) {
    console.error(`Error deleting/deactivating member ${memberId} in ledger ${ledgerName}:`, error)
    if (error.status) {
      res.status(error.status).send({ message: error.message })
    } else {
      res.status(500).send({ error: "Internal server error processing member deletion." })
    }
  }
}

// handlers/transactions.js
// Route handlers for /transactions endpoints

const admin = require("firebase-admin")
const { findLedgerIdByName } = require("../index")
const {
  generateId,
  getDateString,
  getDateTimeString,
  integerCentsToDollars,
  integerMultiplyByFloat,
  integerSplitByWeights,
  supportedCurrencies,
  defaultCategories // Assuming ported
} = require("../utils/utilities")
const { Timestamp } = require("firebase-admin/firestore")
const { getBalanceForLedger, auditMembersFirestore } = require("./utilities") // Import balance and audit logic

// --- Helper Function to Fetch and Format Transactions ---
/**
 * Fetches and formats transactions based on filters, similar to original getTransactions.
 * @param {admin.firestore.Firestore} db Firestore instance
 * @param {admin.firestore.Transaction | null } t Firestore transaction object (optional)
 * @param {string} ledgerId Ledger Document ID
 * @param {string} ledgerName Ledger Name (for response compatibility)
 * @param {object} filters Query filters (id, name, category, currency, expensetype, dateafter, datebefore)
 * @param {object} options Formatting options (format: 'object' | 'array' | 'hash', useExchangeRates: boolean, moneyFormat: 'dollars' | 'cents')
 * @returns {Promise<Array<object>>} Array of formatted transaction objects
 */
async function getFormattedTransactions(db, t, ledgerId, ledgerName, filters = {}, options = {}) {
  const { format = "object", useExchangeRates = false, moneyFormat = "dollars" } = options

  if (moneyFormat !== "dollars" && moneyFormat !== "cents") {
    throw new Error("Invalid money format.")
  }

  const ledgerRef = db.collection("ledgers").doc(ledgerId)
  const transactionsRef = ledgerRef.collection("transactions")
  let query = transactionsRef

  // Apply Filters
  // NOTE: Firestore requires indexes for compound queries.
  // NOTE: Firestore does not support inequality filters on multiple fields.
  // Some complex filtering might need to be done client-side or in the function after fetching.

  if (filters.id) {
    // If filtering by specific ID, handle it directly
    const docRef = transactionsRef.doc(filters.id)
    const docSnap = t ? await t.get(docRef) : await docRef.get() // Use transaction if available
    if (!docSnap.exists || docSnap.data().isDeleted) {
      // Check isDeleted flag
      return [] // Not found or marked as deleted
    }
    // Wrap in array for consistent return type
    return formatFirestoreTransaction([docSnap], ledgerName, options)
  }

  // Standard Filters (apply sequentially)
  query = query.where("isTemplate", "==", false) // From original logic
  query = query.where("isDeleted", "==", false) // Exclude deleted transactions

  if (filters.name) query = query.where("name", "==", filters.name)
  if (filters.category) query = query.where("category", "==", filters.category)
  if (filters.currency) query = query.where("currency", "==", filters.currency)
  if (filters.expensetype) query = query.where("expenseType", "==", filters.expensetype) // Field name from migration script

  // Date Filtering (Requires date field to be consistently formatted string or Timestamp)
  // Assuming 'date' is stored as 'YYYY-MM-DD' string as per original logic
  if (filters.dateafter) query = query.where("date", ">=", filters.dateafter)
  if (filters.datebefore) query = query.where("date", "<=", filters.datebefore)
  // If using Timestamps for 'date', use Timestamp.fromDate(new Date(filters.dateafter)) etc.

  // Order results
  query = query.orderBy("date", "desc").orderBy("createdAt", "desc") // Match original order

  // Execute Query
  const snapshot = t ? await t.get(query) : await query.get() // Use transaction if available

  // Format Results
  return formatFirestoreTransaction(snapshot.docs, ledgerName, options)
}

/**
 * Helper to format Firestore transaction docs into the API response structure.
 * @param {Array<admin.firestore.QueryDocumentSnapshot>} transactionDocs Firestore documents
 * @param {string} ledgerName Ledger Name
 * @param {object} options Formatting options
 * @returns {Promise<Array<object>>}
 */
async function formatFirestoreTransaction(transactionDocs, ledgerName, options) {
  const { format = "object", useExchangeRates = false, moneyFormat = "dollars" } = options

  // TODO: Optimize member fetching if needed (fetch all once per ledger?)
  // For simplicity here, we assume member names aren't strictly needed *in this function*
  // as the original API response structure changed based on 'format'.
  // The 'object' format requires member names, which would need fetching.

  const formattedTransactions = []

  for (const doc of transactionDocs) {
    const data = doc.data()
    let transaction = {
      id: doc.id,
      ledger: ledgerName, // Add ledger name for compatibility
      name: data.name,
      currency: data.currency,
      category: data.category,
      date: data.date, // Assumes string format 'YYYY-MM-DD'
      // createdAt: data.createdAt.toDate(), // Convert Timestamp if needed by client
      exchange_rate: data.exchangeRate, // Field name from migration script
      expense_type: data.expenseType // Field name from migration script
      // is_template: data.isTemplate, // Usually false here based on query
      // is_deleted: data.isDeleted, // Usually false here based on query
    }

    const contributionsMap = data.contributions || {}
    const memberIds = Object.keys(contributionsMap)

    // Calculate total amount and process contributions
    let totalAmountCents = 0
    const processedContributions = memberIds.map((memberId) => {
      const contribution = contributionsMap[memberId]
      const amountCents = contribution.amount || 0 // Amount is stored in cents
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

    // --- Format based on options ---

    let paidArray = processedContributions.map((c) => c.amountCents)
    let owesArray = owesCentsArray

    if (moneyFormat === "dollars") {
      transaction.amount = integerCentsToDollars(transaction.amount)
      paidArray = paidArray.map(integerCentsToDollars)
      owesArray = owesArray.map(integerCentsToDollars)
    }

    if (format === "array") {
      // Requires fetching member names if client depends on them here
      transaction.members = memberIds // Or fetch names
      transaction.member_ids = memberIds
      transaction.weights = processedContributions.map((c) => c.weight)
      transaction.paid = paidArray
      transaction.owes = owesArray
    } else if (format === "object" || format === "hash") {
      // Requires fetching member names
      // This part needs modification to fetch member names from the 'members' subcollection
      // Example (needs async/await and error handling):
      /*
            const memberDocs = await Promise.all(memberIds.map(id => db.collection('ledgers').doc(ledgerId).collection('members').doc(id).get()));
            const memberNamesMap = Object.fromEntries(memberDocs.map(d => [d.id, d.data()?.name || 'Unknown']));
            */

      const contributionDetails = {} // or array for 'object' format
      processedContributions.forEach((c, i) => {
        const detail = {
          id: c.memberId,
          // name: memberNamesMap[c.memberId], // Add fetched name
          weight: c.weight,
          paid: paidArray[i],
          owes: owesArray[i]
        }
        if (format === "hash") {
          // Use memberId or fetched name as key
          contributionDetails[c.memberId /* or name */] = detail
        } else {
          // format === 'object'
          if (!Array.isArray(contributionDetails)) contributionDetails = []
          contributionDetails.push(detail)
        }
      })
      transaction.contributions = contributionDetails
    } else {
      throw new Error("Invalid format specified.")
    }

    formattedTransactions.push(transaction)
  }

  return formattedTransactions
}

// --- Route Handlers ---

// GET /transactions, GET /transactions/:id
exports.getTransactionsHandler = async (db, req, res) => {
  const { ledger: ledgerName, ...filters } = req.query
  const { id: transactionIdParam } = req.params

  if (!ledgerName) {
    return res.status(400).send({ error: "The 'ledger' query parameter (ledger name) is required." })
  }
  // Original API didn't support 'date' filter directly
  if (filters.date) {
    return res
      .status(400)
      .send({ message: 'The "date" filter is not supported. Please use "dateafter" and "datebefore" instead.' })
  }

  try {
    const ledgerId = await findLedgerIdByName(db, ledgerName)
    if (!ledgerId) {
      return res.status(404).send({ error: "The specified ledger does not exist." })
    }

    const queryFilters = { ...filters }
    if (transactionIdParam) {
      queryFilters.id = transactionIdParam // Prioritize ID from path
    }

    const transactions = await getFormattedTransactions(db, null, ledgerId, ledgerName, queryFilters, {
      format: "object", // Default format from original API
      useExchangeRates: false, // Default from original API
      moneyFormat: "dollars" // Default from original API
    })

    if (transactionIdParam && transactions.length === 0) {
      return res.status(404).send({ message: "Transaction not found or has been deleted." })
    }

    res.status(200).send(transactionIdParam ? transactions[0] : transactions)
  } catch (error) {
    console.error(`Error fetching transactions for ledger ${ledgerName}:`, error)
    // Handle specific errors like invalid format
    if (error.message.includes("Invalid format") || error.message.includes("Invalid money format")) {
      res.status(400).send({ error: error.message })
    } else {
      res.status(500).send({ error: "Internal server error fetching transactions." })
    }
  }
}

// Helper: Validate transaction data before saving
async function validateTransactionFirestore(db, transactionData) {
  // Basic structure checks
  if (!transactionData.ledger) throw { status: 400, message: "Ledger name is required." }
  if (!transactionData.currency) throw { status: 400, message: "Currency is required." }
  if (!transactionData.expenseType) throw { status: 400, message: "Expense type is required." }
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
  if (!["expense", "income", "transfer"].includes(transactionData.expenseType)) {
    throw { status: 400, message: 'The expense type must be either "expense", "income", or "transfer".' }
  }
  if (!supportedCurrencies.includes(transactionData.currency)) {
    throw {
      status: 400,
      message: `Currency '${transactionData.currency}' is not supported. Supported: ${supportedCurrencies.join(", ")}`
    }
  }

  // Contribution checks
  const memberIds = []
  let totalWeight = 0
  for (const c of transactionData.contributions) {
    if (!c.id || typeof c.weight === "undefined" || typeof c.paid === "undefined") {
      throw { status: 400, message: "Each contribution must have id, weight, and paid fields." }
    }
    if (c.paid < 0) {
      throw {
        status: 400,
        message: `All ${transactionData.expenseType === "income" ? "received" : "paid"} amounts must be non-negative.`
      }
    }
    if (memberIds.includes(c.id)) {
      throw { status: 400, message: "Member IDs in contributions must be unique." }
    }
    memberIds.push(c.id)
    totalWeight += c.weight
  }
  if (totalWeight === 0 && transactionData.contributions.every((c) => c.paid === 0)) {
    throw { status: 400, message: "Transaction has no financial impact (all paid amounts and weights are zero)." }
  }
  // Original API allowed zero weight if paid amounts existed. Keep that?
  // if (totalWeight === 0) {
  //     throw { status: 400, message: "Sum of weights cannot be zero if splitting costs." };
  // }

  // Check ledger existence
  const ledgerId = await findLedgerIdByName(db, transactionData.ledger)
  if (!ledgerId) {
    throw { status: 400, message: "The specified ledger does not exist." }
  }

  // Check member existence within the ledger
  const memberRefs = memberIds.map((id) => db.collection("ledgers").doc(ledgerId).collection("members").doc(id))
  const memberDocs = await db.getAll(...memberRefs) // Efficiently get multiple docs
  const existingMemberIds = memberDocs.filter((doc) => doc.exists).map((doc) => doc.id)

  if (existingMemberIds.length !== memberIds.length) {
    const missingIds = memberIds.filter((id) => !existingMemberIds.includes(id))
    throw { status: 400, message: `One or more members do not exist in the ledger: ${missingIds.join(", ")}` }
  }

  return ledgerId // Return ledgerId for convenience
}

// Helper: Fetch exchange rate (same as original)
async function getExchangeRate(baseCurrency, newCurrency) {
  if (baseCurrency === newCurrency) return 1
  try {
    // Consider caching results to avoid hitting the API too often
    const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`)
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`)
    const exchangeRates = await response.json()
    if (!exchangeRates.rates || !exchangeRates.rates[newCurrency]) {
      throw new Error(`Rate for ${newCurrency} not found in response for base ${baseCurrency}.`)
    }
    // API gives rate of 1 base = X target. We need 1 target = Y base.
    return 1 / exchangeRates.rates[newCurrency]
  } catch (error) {
    console.error("Exchange rate fetch error:", error)
    // Decide how to handle failure: error out, or default to 1? Original API errored.
    throw { status: 503, message: `Service Unavailable: Unable to get exchange rates. ${error.message}` }
  }
}

// POST /transactions
exports.createTransactionHandler = async (db, req, res) => {
  const transactionData = { ...req.body } // Copy request body
  transactionData.isTemplate = false // Ensure not a template
  transactionData.isDeleted = false // Ensure not deleted

  try {
    // 1. Validate Input Data
    const ledgerId = await validateTransactionFirestore(db, transactionData)
    const ledgerRef = db.collection("ledgers").doc(ledgerId)

    // 2. Prepare Firestore Document Data
    const transactionId = generateId()
    const now = Timestamp.now()
    const dateString = transactionData.date || getDateString() // Default to today if not provided

    // Fetch ledger's base currency to calculate exchange rate
    const ledgerDoc = await ledgerRef.get()
    const ledgerCurrency = ledgerDoc.data()?.currency
    if (!ledgerCurrency) {
      throw { status: 500, message: "Could not determine ledger's base currency." }
    }

    const exchangeRate = await getExchangeRate(ledgerCurrency, transactionData.currency)

    const contributionsMap = transactionData.contributions.reduce((acc, c) => {
      acc[c.id] = {
        amount: Math.floor(c.paid * 100), // Store amount in cents
        weight: c.weight
      }
      return acc
    }, {})

    const firestoreDoc = {
      name: transactionData.name?.trim() || null,
      currency: transactionData.currency,
      category: transactionData.category?.trim() || null,
      date: dateString, // Store as YYYY-MM-DD string
      expenseType: transactionData.expenseType,
      createdAt: now,
      exchangeRate: exchangeRate,
      contributions: contributionsMap,
      isTemplate: false,
      isDeleted: false
      // Add ledgerName here if needed for denormalization/queries, though original didn't store it
    }

    // 3. Save using Firestore Transaction (includes audit)
    await db.runTransaction(async (t) => {
      const newTransactionRef = ledgerRef.collection("transactions").doc(transactionId)
      t.set(newTransactionRef, firestoreDoc)

      // Audit members after adding transaction
      await auditMembersFirestore(db, t, ledgerId, transactionData.ledger)
    })

    // 4. Fetch and return the newly created transaction in the desired format
    const [newTransactionFormatted] = await getFormattedTransactions(
      db,
      null,
      ledgerId,
      transactionData.ledger,
      { id: transactionId },
      {
        format: "object",
        moneyFormat: "dollars",
        useExchangeRates: false
      }
    )

    if (!newTransactionFormatted) {
      // Should not happen if creation succeeded, but handle defensively
      throw { status: 500, message: "Failed to retrieve the created transaction." }
    }

    res.status(201).send({ message: "Transaction created successfully.", transaction: newTransactionFormatted })
  } catch (error) {
    console.error("Error creating transaction:", error)
    const status = error.status || 500
    const message = error.message || "Internal server error creating transaction."
    res.status(status).send({ error: message })
  }
}

// PUT /transactions/:id
exports.updateTransactionHandler = async (db, req, res) => {
  const { id: transactionId } = req.params
  const transactionData = { ...req.body } // Copy request body

  if (!transactionId) {
    return res.status(400).send({ error: "Transaction ID parameter is required." })
  }
  // Add check for ID mismatch like in original API?
  // if (transactionData.id && transactionData.id !== transactionId) { ... }

  try {
    // 1. Validate Input Data (includes checking ledger/member existence)
    const ledgerId = await validateTransactionFirestore(db, transactionData)
    const ledgerRef = db.collection("ledgers").doc(ledgerId)
    const transactionRef = ledgerRef.collection("transactions").doc(transactionId)

    // 2. Prepare Firestore Update Data
    const dateString = transactionData.date || getDateString() // Use provided or default

    const contributionsMap = transactionData.contributions.reduce((acc, c) => {
      acc[c.id] = {
        amount: Math.floor(c.paid * 100), // Store amount in cents
        weight: c.weight
      }
      return acc
    }, {})

    // Fields to potentially update
    const updateDoc = {
      name: transactionData.name?.trim() || null,
      currency: transactionData.currency,
      category: transactionData.category?.trim() || null,
      date: dateString,
      expenseType: transactionData.expenseType,
      contributions: contributionsMap
      // DO NOT update createdAt, isTemplate, isDeleted here
    }

    // 3. Update using Firestore Transaction (includes checks, exchange rate, audit)
    await db.runTransaction(async (t) => {
      const existingDocSnap = await t.get(transactionRef)

      if (!existingDocSnap.exists) {
        throw { status: 404, message: "Transaction not found. Use POST to create." }
      }
      const existingData = existingDocSnap.data()
      if (existingData.isDeleted) {
        throw { status: 410, message: "This transaction has been deleted and cannot be updated." } // 410 Gone
      }
      if (existingData.isTemplate) {
        throw { status: 400, message: "Cannot update a template transaction via this endpoint." }
      }

      // Check if currency changed to update exchange rate
      if (existingData.currency !== updateDoc.currency) {
        const ledgerDoc = await t.get(ledgerRef) // Get ledger within transaction
        const ledgerCurrency = ledgerDoc.data()?.currency
        if (!ledgerCurrency) throw { status: 500, message: "Could not determine ledger's base currency." }
        updateDoc.exchangeRate = await getExchangeRate(ledgerCurrency, updateDoc.currency)
      } else {
        // Ensure exchangeRate field is not accidentally removed if currency didn't change
        updateDoc.exchangeRate = existingData.exchangeRate
      }

      t.update(transactionRef, updateDoc)

      // Audit members after updating transaction
      await auditMembersFirestore(db, t, ledgerId, transactionData.ledger)
    })

    // 4. Fetch and return the updated transaction
    const [updatedTransactionFormatted] = await getFormattedTransactions(
      db,
      null,
      ledgerId,
      transactionData.ledger,
      { id: transactionId },
      {
        format: "object",
        moneyFormat: "dollars",
        useExchangeRates: false
      }
    )

    if (!updatedTransactionFormatted) {
      throw { status: 500, message: "Failed to retrieve the updated transaction." }
    }

    res.status(200).send({ message: "Transaction updated successfully.", transaction: updatedTransactionFormatted })
  } catch (error) {
    console.error(`Error updating transaction ${transactionId}:`, error)
    const status = error.status || 500
    const message = error.message || "Internal server error updating transaction."
    res.status(status).send({ error: message })
  }
}

// DELETE /transactions/:id
exports.deleteTransactionHandler = async (db, req, res) => {
  const { id: transactionId } = req.params
  const { ledger: ledgerName } = req.query // Requires ledger context

  if (!transactionId) {
    return res.status(400).send({ error: "Transaction ID parameter is required." })
  }
  if (!ledgerName) {
    return res.status(400).send({ error: "The 'ledger' query parameter (ledger name) is required." })
  }

  try {
    const ledgerId = await findLedgerIdByName(db, ledgerName)
    if (!ledgerId) {
      return res.status(404).send({ error: "The specified ledger does not exist." })
    }

    const ledgerRef = db.collection("ledgers").doc(ledgerId)
    const transactionRef = ledgerRef.collection("transactions").doc(transactionId)

    await db.runTransaction(async (t) => {
      const docSnap = await t.get(transactionRef)

      if (!docSnap.exists) {
        // Original API returned 204 if not found on delete
        throw { status: 204, message: "The specified resource does not exist." }
      }

      const data = docSnap.data()
      if (data.isTemplate) {
        throw { status: 400, message: "Templates cannot be deleted via this endpoint." }
      }
      if (data.isDeleted) {
        // Already deleted, treat as success (idempotent) or specific status?
        // Original API likely succeeded again. Let's return 200.
        return // Exit transaction, will send 200 later
      }

      // Mark as deleted
      t.update(transactionRef, { isDeleted: true })

      // Audit members after marking transaction as deleted
      await auditMembersFirestore(db, t, ledgerId, ledgerName)
    })

    // If transaction threw status 204, it's handled by catch block
    res.status(200).send({ message: "Transaction deleted successfully." })
  } catch (error) {
    console.error(`Error deleting transaction ${transactionId}:`, error)
    if (error.status === 204) {
      res.status(204).send() // Send empty body for 204
    } else if (error.status) {
      res.status(error.status).send({ message: error.message })
    } else {
      res.status(500).send({ error: "Internal server error deleting transaction." })
    }
  }
}

// handlers/utilities.js
// Handlers for utility endpoints like balance, settlement, categories
// Also includes helper functions for balance calculation and member audit

const admin = require("firebase-admin")
const { findLedgerIdByName } = require("../index")
const { getFormattedTransactions } = require("./transactions") // Reuse transaction fetching
const {
  integerCentsToDollars,
  sum, // Assuming lodash 'sum' or a simple array sum utility
  defaultCategories, // Ported utility
  uniq // Assuming lodash 'uniq' or a Set-based utility
} = require("../utils/utilities")

/**
 * Calculates the balance for each member in a ledger.
 * @param {admin.firestore.Firestore} db Firestore instance
 * @param {admin.firestore.Transaction | null} t Firestore transaction object (optional, for use within transactions)
 * @param {string} ledgerId Ledger Document ID
 * @param {string} ledgerName Ledger Name
 * @param {object} options Calculation options (moneyFormat: 'dollars' | 'cents', errorOnUnbalancedDeletedMember: boolean)
 * @returns {Promise<Array<object>>} Array of member balance objects { id, name, paid, owes, balance }
 */
async function getBalanceForLedger(db, t, ledgerId, ledgerName, options = {}) {
  const { moneyFormat = "dollars", errorOnUnbalancedDeletedMember = true } = options

  if (moneyFormat !== "dollars" && moneyFormat !== "cents") {
    throw new Error("Invalid money format.")
  }

  const ledgerRef = db.collection("ledgers").doc(ledgerId)

  // 1. Fetch all non-deleted, non-template transactions for the ledger
  // Use getFormattedTransactions helper, ensuring 'cents' format for calculation
  // Pass the transaction object 't' if provided
  const transactions = await getFormattedTransactions(
    db,
    t,
    ledgerId,
    ledgerName,
    {
      /* No specific filters here, get all relevant */
    },
    { format: "hash", useExchangeRates: true, moneyFormat: "cents" } // Use hash format for easy lookup, cents for precision
  )

  // 2. Fetch all members for the ledger
  const membersRef = ledgerRef.collection("members")
  const membersSnapshot = t ? await t.get(membersRef) : await membersRef.get() // Use transaction if available
  const members = membersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

  // 3. Calculate balance for each member
  const balances = members.map((member) => {
    const memberId = member.id
    let totalPaidCents = 0
    let totalOwesCents = 0

    transactions.forEach((tx) => {
      // Contributions are keyed by memberId in 'hash' format
      const contribution = tx.contributions[memberId]
      if (contribution) {
        const paid = contribution.paid // Already in cents, adjusted for exchange rate
        const owes = contribution.owes // Already in cents

        if (tx.expense_type === "income") {
          // Income reduces what you 'owe' (net contribution) and increases what you 'paid' (received)
          totalPaidCents -= paid // Receiving money is like negative paid
          totalOwesCents -= owes // Reduces share of income 'owed' back
        } else {
          // expense or transfer
          totalPaidCents += paid
          totalOwesCents += owes
        }
      }
    })

    const balanceCents = totalPaidCents - totalOwesCents

    // Check for unbalanced inactive members
    if (errorOnUnbalancedDeletedMember && !member.isActive && balanceCents !== 0) {
      // Log details for debugging
      console.error(
        `Assertion Failure: Inactive member ${member.name} (ID: ${memberId}) in ledger ${ledgerName} has non-zero balance (${balanceCents} cents).`
      )
      throw new Error(
        `Assertion failure: inactive member ${member.name} has a non-zero balance. Please contact the maintainer.`
      )
    }

    // Format output
    if (moneyFormat === "dollars") {
      return {
        id: memberId,
        name: member.name,
        isActive: member.isActive, // Include status
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

  // Filter out inactive members if the original API did (original didn't explicitly filter here, but check inactive balance)
  // Let's return all members with their status, client can filter if needed.
  return balances
}
module.exports.getBalanceForLedger = getBalanceForLedger // Export for use in other handlers

/**
 * Audits members in a ledger, reactivating any inactive members with non-zero balances.
 * To be called within a Firestore transaction after operations that might affect balances.
 * @param {admin.firestore.Firestore} db Firestore instance
 * @param {admin.firestore.Transaction} t Firestore transaction object
 * @param {string} ledgerId Ledger Document ID
 * @param {string} ledgerName Ledger Name
 */
async function auditMembersFirestore(db, t, ledgerId, ledgerName) {
  console.log(`Auditing members for ledger: ${ledgerName} (ID: ${ledgerId})`)
  try {
    // Calculate balances within the transaction, ignoring the error check for inactive members
    const balances = await getBalanceForLedger(db, t, ledgerId, ledgerName, {
      moneyFormat: "cents",
      errorOnUnbalancedDeletedMember: false // Don't throw error here
    })

    const membersToReactivate = []
    for (const balanceInfo of balances) {
      if (!balanceInfo.isActive && balanceInfo.balance !== 0) {
        // Found an inactive member with a non-zero balance
        membersToReactivate.push(balanceInfo.id)
        console.warn(
          `Inactive member ${balanceInfo.name} (ID: ${balanceInfo.id}) has balance ${balanceInfo.balance}. Will reactivate.`
        )
      }
    }

    // Reactivate members within the transaction
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
    // Log the error but don't let audit failure break the main transaction if possible
    // Depending on severity, you might want to re-throw
    console.error(`Error during member audit for ledger ${ledgerName}:`, error)
    // Potentially re-throw if audit is critical: throw new Error("Member audit failed.");
  }
}
module.exports.auditMembersFirestore = auditMembersFirestore // Export for use

// --- Route Handlers ---

// GET /ledgers/:ledgerName/categories
exports.categoriesGetHandler = async (db, req, res) => {
  const { ledgerName } = req.params
  if (!ledgerName) {
    return res.status(400).send({ error: "Ledger name parameter is required." })
  }

  try {
    const ledgerId = await findLedgerIdByName(db, ledgerName)
    if (!ledgerId) {
      return res.status(404).send({ error: "The specified ledger does not exist." })
    }

    const transactionsRef = db.collection("ledgers").doc(ledgerId).collection("transactions")
    // Query non-deleted, non-template transactions and select only the category field
    const q = transactionsRef.where("isDeleted", "==", false).where("isTemplate", "==", false)
    // .select('category'); // Firestore Node SDK select() retrieves the whole doc, filtering happens after

    const snapshot = await q.get()

    // Extract unique categories in code
    const categoriesFromDb = snapshot.docs.map((doc) => doc.data().category).filter((category) => category) // Filter out null/empty categories

    // Combine with defaults and ensure uniqueness
    const allCategories = uniq([...defaultCategories, ...categoriesFromDb])

    res.status(200).send(allCategories)
  } catch (error) {
    console.error(`Error fetching categories for ledger ${ledgerName}:`, error)
    res.status(500).send({ error: "Internal server error fetching categories." })
  }
}

// GET /ledgers/:ledgerName/balance
exports.balancesGetHandler = async (db, req, res) => {
  const { ledgerName } = req.params
  if (!ledgerName) {
    return res.status(400).send({ error: "Ledger name parameter is required." })
  }

  try {
    const ledgerId = await findLedgerIdByName(db, ledgerName)
    if (!ledgerId) {
      return res.status(404).send({ error: "The specified ledger does not exist." })
    }

    // Calculate balances (outside a transaction for read-only endpoint)
    const balances = await getBalanceForLedger(db, null, ledgerId, ledgerName, {
      moneyFormat: "dollars", // Default format for API response
      errorOnUnbalancedDeletedMember: true // Enforce check for this endpoint
    })

    // Filter out inactive members for the final API response if needed
    const activeBalances = balances.filter((b) => b.isActive)

    res.status(200).send(activeBalances) // Return only active members' balances
  } catch (error) {
    console.error(`Error calculating balance for ledger ${ledgerName}:`, error)
    // Handle specific assertion errors from getBalance
    if (error.message.includes("Assertion failure")) {
      res.status(500).send({ error: `Internal server error: ${error.message}` }) // As per original API
    } else if (error.message.includes("Invalid money format")) {
      res.status(400).send({ error: error.message })
    } else {
      res.status(500).send({ error: "Internal server error calculating balance." })
    }
  }
}

// GET /ledgers/:ledgerName/settlement
exports.settlementsGetHandler = async (db, req, res) => {
  const { ledgerName } = req.params
  if (!ledgerName) {
    return res.status(400).send({ error: "Ledger name parameter is required." })
  }

  try {
    const ledgerId = await findLedgerIdByName(db, ledgerName)
    if (!ledgerId) {
      return res.status(404).send({ error: "The specified ledger does not exist." })
    }

    // 1. Get balances in cents for accurate calculation
    let balances = await getBalanceForLedger(db, null, ledgerId, ledgerName, {
      moneyFormat: "cents",
      errorOnUnbalancedDeletedMember: true
    })

    // 2. Filter out inactive members and those with zero balance
    balances = balances.filter((b) => b.isActive && b.balance !== 0)

    // 3. Perform settlement algorithm (same logic as original)
    balances.sort((a, b) => b.balance - a.balance) // Sort creditors first, debtors last

    let settlements = []
    let creditors = balances.filter((b) => b.balance > 0)
    let debtors = balances.filter((b) => b.balance < 0)

    // Simplified greedy algorithm (same as original)
    let creditorIndex = 0
    let debtorIndex = 0

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      let creditor = creditors[creditorIndex]
      let debtor = debtors[debtorIndex]
      let amount = Math.min(creditor.balance, Math.abs(debtor.balance))

      if (amount > 0) {
        // Avoid zero-amount settlements
        settlements.push({
          payer: debtor.name, // Debtor pays
          payee: creditor.name, // Creditor receives
          amount: amount // Store in cents for now
        })

        creditor.balance -= amount
        debtor.balance += amount
      }

      // Move to next creditor/debtor if their balance is settled
      if (Math.abs(creditor.balance) < 0.01) {
        // Use tolerance for floating point (though we use cents)
        creditorIndex++
      }
      if (Math.abs(debtor.balance) < 0.01) {
        debtorIndex++
      }
    }

    // 4. Format settlement amounts to dollars for response
    const formattedSettlements = settlements.map((s) => ({
      ...s,
      amount: integerCentsToDollars(s.amount)
    }))

    res.status(200).send(formattedSettlements)
  } catch (error) {
    console.error(`Error calculating settlement for ledger ${ledgerName}:`, error)
    if (error.message.includes("Assertion failure")) {
      res.status(500).send({ error: `Internal server error: ${error.message}` })
    } else {
      res.status(500).send({ error: "Internal server error calculating settlement." })
    }
  }
}

// utils/utilities.js
// Ported utility functions from the original API

const { v4: uuidv4 } = require("uuid") // Use uuid for ID generation

// --- Constants ---
const supportedCurrencies = [
  /* Add your list here, e.g., 'USD', 'CAD', 'EUR' */ "CAD",
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "JPY",
  "CNY"
]
const defaultCategories = ["Groceries", "Rent", "Utilities", "Transportation", "Entertainment", "Dining Out", "Other"]

// --- ID Generation ---
function generateId() {
  // Using UUID v4 for universally unique IDs suitable for Firestore keys
  return uuidv4()
}

// --- Date/Time ---
function getDateString(date = new Date()) {
  // Returns date in YYYY-MM-DD format
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getDateTimeString(date = new Date()) {
  // Returns date and time in 'YYYY-MM-DD HH:MM:SS' format (like original)
  // Note: Firestore Timestamps are generally preferred for storing date/time
  const dateStr = getDateString(date)
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  return `${dateStr} ${hours}:${minutes}:${seconds}`
}

// --- Currency/Integer Math ---
// These functions work with amounts assumed to be in integer cents

function integerCentsToDollars(cents) {
  if (typeof cents !== "number" || isNaN(cents)) {
    // console.warn("Invalid input to integerCentsToDollars:", cents);
    return 0 // Or handle error appropriately
  }
  return parseFloat((cents / 100).toFixed(2))
}

function dollarsToIntegerCents(dollars) {
  if (typeof dollars !== "number" || isNaN(dollars)) {
    // console.warn("Invalid input to dollarsToIntegerCents:", dollars);
    return 0
  }
  // Use Math.round to handle potential floating point inaccuracies
  return Math.round(dollars * 100)
}

function integerMultiplyByFloat(integerValue, floatMultiplier) {
  // Multiplies an integer (representing cents) by a float (like exchange rate)
  // and returns the result as an integer (cents), rounding appropriately.
  if (
    typeof integerValue !== "number" ||
    typeof floatMultiplier !== "number" ||
    isNaN(integerValue) ||
    isNaN(floatMultiplier)
  ) {
    // console.warn("Invalid input to integerMultiplyByFloat:", integerValue, floatMultiplier);
    return 0
  }
  return Math.round(integerValue * floatMultiplier)
}

function integerSplitByWeights(totalIntegerAmount, weights, debugId = "split") {
  // Splits a total integer amount (cents) according to weights, ensuring the sum matches the total.
  if (typeof totalIntegerAmount !== "number" || !Array.isArray(weights) || weights.length === 0) {
    // console.warn("Invalid input to integerSplitByWeights:", totalIntegerAmount, weights);
    return []
  }

  const totalWeight = weights.reduce((sum, w) => sum + (typeof w === "number" && !isNaN(w) ? w : 0), 0)

  if (totalWeight === 0) {
    // If total weight is zero, cannot split proportionally.
    // Decide behavior: split equally? return zeros? Original API might handle this implicitly.
    // Let's return zeros if total weight is zero, assuming no split is intended.
    // console.warn(`Total weight is zero for split ID ${debugId}. Returning zeros.`);
    return weights.map(() => 0)
  }

  let remainingAmount = totalIntegerAmount
  const splitAmounts = []
  let calculatedSum = 0

  for (let i = 0; i < weights.length; i++) {
    const weight = typeof weights[i] === "number" && !isNaN(weights[i]) ? weights[i] : 0
    // Calculate share, round for now
    const share = Math.round((totalIntegerAmount * weight) / totalWeight)
    splitAmounts.push(share)
    calculatedSum += share
  }

  // Adjust the last non-zero share (or first) to account for rounding differences
  const difference = totalIntegerAmount - calculatedSum

  if (difference !== 0) {
    // Find an index to adjust. Prefer adjusting the largest share for less relative impact.
    let adjustIndex = -1
    let maxShare = -Infinity
    for (let i = 0; i < splitAmounts.length; i++) {
      if (splitAmounts[i] !== 0 && Math.abs(splitAmounts[i]) > maxShare) {
        // Adjust non-zero share
        maxShare = Math.abs(splitAmounts[i])
        adjustIndex = i
      }
    }
    if (adjustIndex === -1) adjustIndex = 0 // Fallback to first element if all are zero (shouldn't happen if totalAmount != 0)

    splitAmounts[adjustIndex] += difference
  }

  // Final check (for debugging)
  const finalSum = splitAmounts.reduce((sum, a) => sum + a, 0)
  if (finalSum !== totalIntegerAmount) {
    console.error(
      `Split Error (ID: ${debugId}): Total amount ${totalIntegerAmount} does not match sum of splits ${finalSum}. Splits:`,
      splitAmounts
    )
    // Decide how to handle this - maybe throw an error?
  }

  return splitAmounts
}

// --- Array Utilities ---
// Basic sum function if lodash isn't used
function sum(numbers) {
  return numbers.reduce((acc, val) => acc + (typeof val === "number" && !isNaN(val) ? val : 0), 0)
}

// Basic uniq function if lodash isn't used
function uniq(arr) {
  return [...new Set(arr)]
}

// --- Exports ---
module.exports = {
  supportedCurrencies,
  defaultCategories,
  generateId,
  getDateString,
  getDateTimeString,
  integerCentsToDollars,
  dollarsToIntegerCents,
  integerMultiplyByFloat,
  integerSplitByWeights,
  sum,
  uniq
}
