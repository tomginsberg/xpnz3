const Knex = require("knex");
const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

// Set emulator host for Firestore
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const gdb = admin.firestore();

const db = Knex({
  client: "sqlite3",
  connection: { filename: "data.db" },
  useNullAsDefault: true
})

async function migrateData() {
  // Create users collection (empty for now)
  console.log("Creating users collection structure...");
  const usersCollection = gdb.collection("users");
  
  // Create a sample user document as a template
  // This is just to establish the collection and structure
  // In a real scenario, you'd pull actual user data
  const sampleUserId = "sample-user-template";
  const sampleUserExists = (await usersCollection.doc(sampleUserId).get()).exists;
  
  if (!sampleUserExists) {
    await usersCollection.doc(sampleUserId).set({
      name: "Sample User",
      userId: sampleUserId,
      transfer_info: {}, // Empty object to be filled with payment methods
      settings: {
        theme: "system",
        notifications: true
      },
      linkedLedgers: [], // Array of ledger IDs user is linked to
      linkedMemberProfiles: {}, // Map of ledgerId -> memberId that this user is linked to
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log("Created sample user template structure");
  } else {
    console.log("Sample user template already exists");
  }

  // Continue with ledger migration
  const ledgers = await db("ledgers").select()

  for (const ledger of ledgers) {
    const ledgerCollection = gdb.collection("ledgers")
    const ledgerExistsSnap = await ledgerCollection.where("name", "==", ledger.name).get()
    const ledgerExists = !ledgerExistsSnap.empty

    if (ledgerExists) {
      console.log(`Ledger ${ledger.name} already exists in the database. Skipping.`)
      continue
    }

    const ledgerData = {
      name: ledger.name,
      currency: ledger.currency,
      permissions: "public",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
    const ledgerDocument = await ledgerCollection.add(ledgerData)
    const ledgerId = ledgerDocument.id

    const memberCollection = ledgerDocument.collection("members")
    const members = await db("members").where("ledger", ledger.name).select()

    for (const member of members) {
      const memberId = member.id
      const memberData = {
        name: member.name,
        isActive: member.is_active,
        userId: null, // Will be linked to user in future version
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
      await memberCollection.doc(memberId).set(memberData)
    }

    const transactionCollection = ledgerDocument.collection("transactions")
    const transactions = await db("transactions").where("ledger", ledger.name).select()

    for (const transaction of transactions) {
      const transactionId = transaction.id
      const createdAtString = transaction.created_at
      const [datePart, timePart] = createdAtString.split(" ")
      const [year, month, day] = datePart.split("-").map(Number)
      const [hour, minute, second] = timePart.split(":").map(Number)
      const createdAtDate = new Date(year, month - 1, day, hour, minute, second)
      const contributions = await db("transactions_member_junction").select().where("transaction_id", transaction.id)
      const transactionData = {
        name: transaction.name,
        currency: transaction.currency,
        category: transaction.category,
        expenseType: transaction.expense_type,
        createdAt: admin.firestore.Timestamp.fromDate(createdAtDate),
        date: transaction.date,
        exchangeRate: transaction.exchange_rate,
        contributions: contributions.reduce((acc, c) => {
          acc[c.member_id] = { amount: c.amount, weight: c.weight }
          return acc
        }, {}),
        isTemplate: false,
        isDeleted: false
      }
      await transactionCollection.doc(transactionId).set(transactionData)
    }

    console.log(`Migrated ledger: ${ledger.name}`)
  }

  console.log("Migration completed successfully!")
  process.exit(0)
}

migrateData().catch((error) => {
  console.error("Migration failed:", error)
  process.exit(1)
})
