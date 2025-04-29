// Firebase Cloud Functions
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { omit } from "lodash-es";
import { integerCentsToDollars, integerMultiplyByFloat, integerSplitByWeights } from "./utilities.js";

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

/**
 * Finds a ledger document ID and data by its name.
 * @param {string} ledgerName - The name of the ledger.
 * @returns {Promise<{id: string, data: object}|null>} The document ID and data or null if not found.
 */
async function findLedgerDocByName(ledgerName) {
  if (!ledgerName) return null;
  const ledgersRef = db.collection("ledgers");
  const q = ledgersRef.where("name", "==", ledgerName).limit(1);
  const snapshot = await q.get();
  if (snapshot.empty) {
    return null;
  }
  const doc = snapshot.docs[0];
  return { id: doc.id, data: doc.data() };
}

/**
 * Calculates the balance for each member in a ledger using Firestore.
 * @param {string} ledgerId Ledger Document ID
 * @param {string} ledgerName Ledger Name
 * @param {object} options Calculation options (moneyFormat: 'dollars' | 'cents', errorOnUnbalancedDeletedMember: boolean)
 * @returns {Promise<Array<object>>} Array of member balance objects { id, name, paid, owes, balance, isActive }
 */
async function getBalanceForLedgerFirestore(ledgerId, ledgerName, options = {}) {
  const { moneyFormat = "dollars", errorOnUnbalancedDeletedMember = true } = options;

  if (moneyFormat !== "dollars" && moneyFormat !== "cents") {
    throw new Error("Invalid money format.");
  }

  const ledgerRef = db.collection("ledgers").doc(ledgerId);

  // 1. Fetch all non-deleted, non-template transactions for the ledger
  const transactionsRef = ledgerRef.collection("transactions");
  const transactionsQuery = transactionsRef
    .where("isTemplate", "==", false)
    .where("isDeleted", "==", false);
  const transactionsSnapshot = await transactionsQuery.get();

  // 2. Fetch all members for the ledger
  const membersRef = ledgerRef.collection("members");
  const membersSnapshot = await membersRef.get();
  const members = membersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  // 3. Calculate balance for each member
  return members.map((member) => {
    const memberId = member.id;
    let totalPaidCents = 0;
    let totalOwesCents = 0;

    transactionsSnapshot.docs.forEach((doc) => {
      const tx = doc.data();
      const contributionsMap = tx.contributions || {};
      const contribution = contributionsMap[memberId];

      if (contribution) {
        const amountCents = contribution.amount || 0; // Amount is stored in cents
        const weight = contribution.weight || 0;
        const multiplier = tx.exchangeRate || 1; // Use exchange rate stored on transaction
        const adjustedAmountCents = integerMultiplyByFloat(amountCents, multiplier);

        // Calculate owes based on split *within this transaction*
        const txMemberIds = Object.keys(contributionsMap);
        const txWeights = txMemberIds.map((id) => contributionsMap[id]?.weight || 0);
        const txTotalAmount = txMemberIds.reduce((sum, id) => {
          const memberAmount = contributionsMap[id]?.amount || 0;
          const memberMultiplier = tx.exchangeRate || 1;
          return sum + integerMultiplyByFloat(memberAmount, memberMultiplier);
        }, 0);

        const owesCentsArray = integerSplitByWeights(txTotalAmount, txWeights, doc.id);
        const memberOwesIndex = txMemberIds.indexOf(memberId);
        const memberOwesCents = memberOwesIndex !== -1 ? owesCentsArray[memberOwesIndex] : 0;

        if (tx.expenseType === "income") {
          totalPaidCents -= adjustedAmountCents; // Receiving money is like negative paid
          totalOwesCents -= memberOwesCents;
        } else {
          // expense or transfer
          totalPaidCents += adjustedAmountCents;
          totalOwesCents += memberOwesCents;
        }
      }
    });

    const balanceCents = totalPaidCents - totalOwesCents;

    // Check for unbalanced inactive members
    if (errorOnUnbalancedDeletedMember && !member.isActive && balanceCents !== 0) {
      console.error(
        `Assertion Failure: Inactive member ${member.name} (ID: ${memberId}) in ledger ${ledgerName} has non-zero balance (${balanceCents} cents).`
      );
      throw new Error(`Assertion failure: inactive member ${member.name} has a non-zero balance.`);
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
      };
    } else {
      // cents
      return {
        id: memberId,
        name: member.name,
        isActive: member.isActive,
        paid: totalPaidCents,
        owes: totalOwesCents,
        balance: balanceCents
      };
    }
  });
}

// Define the Cloud Function for calculating balances
export const getBalances = onCall(
  { region: "us-central1", timeoutSeconds: 60 },
  async (request) => {
    const { ledgerName } = request.data;

    if (!ledgerName) {
      throw new HttpsError('invalid-argument', 'Ledger name is required');
    }

    try {
      const ledgerDoc = await findLedgerDocByName(ledgerName);
      
      if (!ledgerDoc) {
        throw new HttpsError('not-found', 'The specified ledger does not exist.');
      }
      
      const ledgerId = ledgerDoc.id;
      
      const balances = await getBalanceForLedgerFirestore(ledgerId, ledgerName, {
        moneyFormat: "dollars",
        errorOnUnbalancedDeletedMember: true
      });

      // Filter out inactive members for API response
      const activeBalances = balances.filter((b) => b.isActive);
      
      // Remove isActive field for client response, matching original API structure
      const responseBalances = activeBalances.map((b) => omit(b, ["isActive"]));

      return {
        success: true,
        data: responseBalances
      };
    } catch (error) {
      console.error(`Error calculating balance for ${ledgerName}:`, error);
      
      if (error.message.includes("Assertion failure")) {
        throw new HttpsError(
          'internal', 
          `Internal server error: ${error.message}`
        );
      } else {
        throw new HttpsError(
          'internal', 
          'Internal server error calculating balance.'
        );
      }
    }
  }
);