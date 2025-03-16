import admin from "firebase-admin"
import Knex from "knex"
import { pick, omit } from "lodash-es"

// Initialize Firebase Admin
// let serviceAccount =

import serviceAccount from "../serviceAccountKey.json"

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})
const firestore = admin.firestore()

// Connect to existing SQLite database
const db = Knex({
  client: "sqlite3",
  connection: { filename: "data.db" },
  useNullAsDefault: true
})

async function migrateData() {
  // Get all existing ledgers
  const ledgers = await db("ledgers").select("*")

  for (const ledger of ledgers) {
    // Create Firestore ledger document with public permissions
    const ledgerRef = firestore.collection("ledgers").doc(ledger.name)

    await ledgerRef.set({
      ...pick(ledger, ["name", "currency"]),
      permissions: "public", // Set all ledgers to public
      createdAt: admin.firestore.Timestamp.fromDate(new Date())
    })

    // Migrate members
    const members = await db("members").where("ledger", ledger.name).select("*")
    const membersBatch = firestore.batch()

    members.forEach((member) => {
      const memberRef = ledgerRef.collection("members").doc(member.id)
      membersBatch.set(memberRef, {
        ...pick(member, ["name", "is_active"]),
        userId: null // Initialize with no user association
      })
    })

    await membersBatch.commit()

    // Migrate transactions
    const transactions = await db("transactions").where("ledger", ledger.name).select("*")

    const transactionsBatch = firestore.batch()

    for (const transaction of transactions) {
      const transactionRef = ledgerRef.collection("transactions").doc(transaction.id)

      // Get transaction member relationships
      const memberJunctions = await db("transactions_member_junction")
        .where("transaction_id", transaction.id)
        .select("*")

      const contributions = await Promise.all(
        memberJunctions.map(async (junction) => {
          const member = await db("members").where("id", junction.member_id).first()

          return {
            memberId: junction.member_id,
            memberName: member.name,
            paid: junction.amount,
            weight: junction.weight
          }
        })
      )

      transactionsBatch.set(transactionRef, {
        ...omit(transaction, ["id", "is_template", "is_deleted"]),
        contributions,
        createdAt: admin.firestore.Timestamp.fromDate(new Date(transaction.created_at))
      })
    }

    await transactionsBatch.commit()
    console.log(`Migrated ledger: ${ledger.name}`)
  }

  console.log("Migration completed successfully!")
  process.exit(0)
}

migrateData().catch((error) => {
  console.error("Migration failed:", error)
  process.exit(1)
})
