import Knex from "knex"

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  addDoc,
  getDocs,
  setDoc,
  doc,
  Timestamp,
  query,
  where,
} from "firebase/firestore";

import { pick } from "lodash-es"

import { generateId } from "../src/api/utilities.js"

if (process.env.FIREBASE_API_KEY === undefined) {
  console.error ("Please set the FIREBASE_API_KEY environment variable.")
  process.exit (1)
}

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "xpnz-b7857.firebaseapp.com",
  projectId: "xpnz-b7857",
  storageBucket: "xpnz-b7857.firebasestorage.app",
  messagingSenderId: "559439908567",
  appId: "1:559439908567:web:1f4297d0b2511c9df1aa92"
}

const app = initializeApp (firebaseConfig)

const gdb = getFirestore (app)
connectFirestoreEmulator (gdb, '127.0.0.1', 8080)

// Connect to existing SQLite database
const db = Knex (
  {
    client: "sqlite3",
    connection: { filename: "data.db" },
    useNullAsDefault: true
  }
)

async function migrateData () {
  const ledgers = await db ("ledgers").select ()

  for (const ledger of ledgers) {
    const ledgerCollection = collection (gdb, "ledgers")
   
    const q = query (ledgerCollection, where ("name", "==", ledger.name))
    const ledgerExists = (await getDocs (q)).size > 0

    if (ledgerExists) {
      console.log (`Ledger ${ledger.name} already exists in the database. Skipping.`)
      continue
    }

    const ledgerData = { 
      name: ledger.name,
      currency: ledger.currency,
      permissions: "public"
    }
    const ledgerDocument = await addDoc (ledgerCollection, ledgerData)
    
    const memberCollection = collection (ledgerDocument, "members")
    const members = await db ("members").where ("ledger", ledger.name).select ()

    for (const member of members) {
      const memberId = member.id
      const memberData = {
        name: member.name,
        isActive: member.is_active,
        userId: null,
      }

      const memberDocument = await setDoc (doc (memberCollection, memberId), memberData)
    }

    const transactionCollection = collection (ledgerDocument, "transactions")
    const transactions = await db ("transactions").where ("ledger", ledger.name).select ()

    for (const transaction of transactions) {
      const transactionId = transaction.id
    
      const createdAtString = transaction.created_at

      const [datePart, timePart] = createdAtString.split (" ");
      const [year, month, day] = datePart.split ("-").map (Number);
      const [hour, minute, second] = timePart.split (":").map (Number);

      const createdAtDate = new Date (year, month - 1, day, hour, minute, second)

      const transactionData = {
        name: transaction.name,
        currency: transaction.currency,
        category: transaction.category,
        expenseType: transaction.expense_type,
        createdAt: Timestamp.fromDate (createdAtDate),
        date: transaction.date,
        exchangeRate: transaction.exchange_rate,
      }

      const transactionDocument = await setDoc (doc (transactionCollection, transactionId), transactionData)
    }

    // // Create Firestore ledger document with public permissions
    // const ledgerRef = collection(firestore, "ledgers").doc(ledger.name)

    // await ledgerRef.set({
    //   ...pick(ledger, ["name", "currency"]),
    //   permissions: "public", // Set all ledgers to public
    //   createdAt: admin.firestore.Timestamp.fromDate(new Date())
    // })

    // // Migrate members
    // const members = await db("members").where("ledger", ledger.name).select("*")
    // const membersBatch = firestore.batch()

    // members.forEach((member) => {
    //   const memberRef = ledgerRef.collection("members").doc(member.id)
    //   membersBatch.set(memberRef, {
    //     ...pick(member, ["name", "is_active"]),
    //     userId: null // Initialize with no user association
    //   })
    // })

    // await membersBatch.commit()

    // // Migrate transactions
    // const transactions = await db("transactions").where("ledger", ledger.name).select("*")

    // const transactionsBatch = firestore.batch()

    // for (const transaction of transactions) {
    //   const transactionRef = ledgerRef.collection("transactions").doc(transaction.id)

    //   // Get transaction member relationships
    //   const memberJunctions = await db("transactions_member_junction")
    //     .where("transaction_id", transaction.id)
    //     .select("*")

    //   const contributions = await Promise.all(
    //     memberJunctions.map(async (junction) => {
    //       const member = await db("members").where("id", junction.member_id).first()

    //       return {
    //         memberId: junction.member_id,
    //         memberName: member.name,
    //         paid: junction.amount,
    //         weight: junction.weight
    //       }
    //     })
    //   )

    //   transactionsBatch.set(transactionRef, {
    //     ...omit(transaction, ["id", "is_template", "is_deleted"]),
    //     contributions,
    //     createdAt: admin.firestore.Timestamp.fromDate(new Date(transaction.created_at))
    //   })
    // }

    // await transactionsBatch.commit()
    console.log (`Migrated ledger: ${ledger.name}`)
  }

  console.log ("Migration completed successfully!")
  process.exit (0)
}

migrateData ().catch ((error) => {
  console.error ("Migration failed:", error)
  process.exit (1)
})
