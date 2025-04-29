import { db } from "./config";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  limit,
  orderBy
} from "firebase/firestore";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";

// Initialize Firebase Functions
const functions = getFunctions();

// Connect to Firebase Functions emulator in development environment
if (window.location.hostname === "localhost") {
  console.log("Connecting to Functions emulator on localhost:5001");
  connectFunctionsEmulator(functions, "localhost", 5001);
}

// Create client for our Firebase Cloud Functions
export const firebaseFunctions = {
  getBalances: httpsCallable(functions, 'getBalances')
};

/**
 * Find a ledger document ID by its name
 * @param {string} ledgerName - The name of the ledger to find
 * @returns {Promise<{id: string, data: Object}|null>} The ledger doc and ID or null
 */
export async function findLedgerByName(ledgerName) {
  if (!ledgerName) return null;
  
  const ledgersRef = collection(db, "ledgers");
  const q = query(ledgersRef, where("name", "==", ledgerName), limit(1));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  const docRef = snapshot.docs[0];
  return { 
    id: docRef.id, 
    data: docRef.data() 
  };
}

/**
 * Fetches members for a ledger with optional filters
 * @param {string} ledgerName - The name of the ledger
 * @param {Object} filters - Filter options like name, is_active
 * @returns {Promise<Array<Object>>} Array of member objects
 */
export async function getMembers(ledgerName, filters = {}) {
  const ledgerDoc = await findLedgerByName(ledgerName);
  if (!ledgerDoc) {
    throw new Error(`Ledger '${ledgerName}' not found`);
  }
  
  const membersRef = collection(db, "ledgers", ledgerDoc.id, "members");
  let q = membersRef;
  
  // Apply filters if provided
  const clauses = [];
  if (filters.name) {
    clauses.push(where("name", "==", filters.name));
  }
  if (typeof filters.is_active === "boolean") {
    clauses.push(where("isActive", "==", filters.is_active));
  }
  
  if (clauses.length > 0) {
    q = query(membersRef, ...clauses);
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name,
    ledger: ledgerName,
    is_active: doc.data().isActive
  }));
}

/**
 * Get a specific member by ID
 * @param {string} ledgerName - The ledger name
 * @param {string} memberId - The member ID
 * @returns {Promise<Object|null>} The member data or null
 */
export async function getMemberById(ledgerName, memberId) {
  const ledgerDoc = await findLedgerByName(ledgerName);
  if (!ledgerDoc) {
    throw new Error(`Ledger '${ledgerName}' not found`);
  }
  
  const memberRef = doc(db, "ledgers", ledgerDoc.id, "members", memberId);
  const memberDoc = await getDoc(memberRef);
  
  if (!memberDoc.exists()) {
    return null;
  }
  
  return {
    id: memberDoc.id,
    name: memberDoc.data().name,
    ledger: ledgerName,
    is_active: memberDoc.data().isActive
  };
}

/**
 * Fetches all categories for a ledger
 * @param {string} ledgerName - The ledger name
 * @returns {Promise<string[]>} Array of category names
 */
export async function getCategories(ledgerName) {
  const ledgerDoc = await findLedgerByName(ledgerName);
  if (!ledgerDoc) {
    throw new Error(`Ledger '${ledgerName}' not found`);
  }
  
  const transactionsRef = collection(db, "ledgers", ledgerDoc.id, "transactions");
  const q = query(
    transactionsRef, 
    where("isDeleted", "==", false),
    where("isTemplate", "==", false)
  );
  
  const snapshot = await getDocs(q);
  
  // Extract unique categories
  const categoriesSet = new Set();
  
  // Default categories (matching your server implementation)
  const defaultCategories = ["Groceries", "Rent", "Utilities", "Transportation", "Entertainment", "Dining Out", "Other"];
  defaultCategories.forEach(c => categoriesSet.add(c));
  
  // Add categories from transactions
  snapshot.docs.forEach(doc => {
    const category = doc.data().category;
    if (category) {
      categoriesSet.add(category);
    }
  });
  
  return Array.from(categoriesSet);
}

/**
 * Fetches transactions (expenses) for a ledger with optional filters
 * @param {string} ledgerName - The ledger name
 * @param {Object} filters - Filter options
 * @returns {Promise<Array<Object>>} Array of formatted transaction objects
 */
export async function getTransactions(ledgerName, filters = {}) {
  const ledgerDoc = await findLedgerByName(ledgerName);
  if (!ledgerDoc) {
    throw new Error(`Ledger '${ledgerName}' not found`);
  }
  
  // Get transactions collection
  const transactionsRef = collection(db, "ledgers", ledgerDoc.id, "transactions");
  
  // Build the query
  const clauses = [
    where("isDeleted", "==", false),
    where("isTemplate", "==", false)
  ];
  
  // Add filters
  if (filters.name) clauses.push(where("name", "==", filters.name));
  if (filters.category) clauses.push(where("category", "==", filters.category));
  if (filters.currency) clauses.push(where("currency", "==", filters.currency));
  if (filters.expensetype) clauses.push(where("expenseType", "==", filters.expensetype));
  if (filters.dateafter) clauses.push(where("date", ">=", filters.dateafter));
  if (filters.datebefore) clauses.push(where("date", "<=", filters.datebefore));
  
  // Add ordering (similar to server implementation)
  clauses.push(orderBy("date", "desc"));
  clauses.push(orderBy("createdAt", "desc"));
  
  const q = query(transactionsRef, ...clauses);
  const snapshot = await getDocs(q);
  
  // Get all member IDs involved in these transactions
  const memberIds = new Set();
  snapshot.docs.forEach(doc => {
    const contributions = doc.data().contributions || {};
    Object.keys(contributions).forEach(id => memberIds.add(id));
  });
  
  // Fetch all member data in batch
  const memberData = await fetchMemberData(ledgerDoc.id, Array.from(memberIds));
  
  // Format transactions
  return snapshot.docs.map(doc => formatTransactionForClient(doc, ledgerName, memberData));
}

/**
 * Fetches member data in batch
 * @param {string} ledgerId - The ledger ID
 * @param {Array<string>} memberIds - Array of member IDs
 * @returns {Promise<Map<string, Object>>} Map of member ID to member data
 */
async function fetchMemberData(ledgerId, memberIds) {
  const memberData = new Map();
  
  if (!memberIds.length) return memberData;
  
  // Batch get is not directly available in client SDK like admin SDK
  // so we need to fetch them individually
  const memberPromises = memberIds.map(async (id) => {
    const memberRef = doc(db, "ledgers", ledgerId, "members", id);
    const memberDoc = await getDoc(memberRef);
    if (memberDoc.exists()) {
      memberData.set(id, {
        id: memberDoc.id,
        ...memberDoc.data()
      });
    }
  });
  
  await Promise.all(memberPromises);
  return memberData;
}

/**
 * Formats a Firestore transaction document for client consumption
 * @param {Object} doc - Firestore document snapshot
 * @param {string} ledgerName - Ledger name
 * @param {Map<string, Object>} memberData - Map of member data
 * @returns {Object} Formatted transaction object
 */
function formatTransactionForClient(doc, ledgerName, memberData) {
  const data = doc.data();
  
  // Basic transaction info
  const transaction = {
    id: doc.id,
    ledger: ledgerName,
    name: data.name,
    currency: data.currency,
    category: data.category,
    date: data.date,
    exchange_rate: data.exchangeRate,
    expense_type: data.expenseType
  };
  
  // Process contributions
  const contributionsMap = data.contributions || {};
  const memberIds = Object.keys(contributionsMap);
  
  // Calculate total amount
  let totalAmountCents = 0;
  const processedContributions = memberIds.map(id => {
    const contribution = contributionsMap[id];
    const amountCents = contribution.amount || 0;
    const weight = contribution.weight || 0;
    totalAmountCents += amountCents;
    return { id, amountCents, weight };
  });
  
  // Calculate owes using weight distribution
  const totalWeight = processedContributions.reduce((sum, c) => sum + c.weight, 0);
  const owesArray = processedContributions.map(c => {
    if (totalWeight === 0) return 0;
    return Math.floor((c.weight / totalWeight) * totalAmountCents);
  });
  
  // Format contributions for client
  const contributions = memberIds.map((id, index) => {
    const memberInfo = memberData.get(id) || { name: "Unknown" };
    const contribution = contributionsMap[id];
    const paid = centsToDollars(contribution.amount || 0);
    const owes = centsToDollars(owesArray[index] || 0);
    
    return {
      id,
      name: memberInfo.name,
      weight: contribution.weight || 0,
      paid,
      owes
    };
  });
  
  // Set amount in dollars
  transaction.amount = centsToDollars(totalAmountCents);
  transaction.contributions = contributions;
  
  return transaction;
}

/**
 * Converts cents to dollars (matches server implementation)
 * @param {number} cents - Amount in cents
 * @returns {number} Amount in dollars
 */
function centsToDollars(cents) {
  return parseFloat((cents / 100).toFixed(2));
}