// start setting up firebase
// npx firebase login
// get your FIREBASE_API_KEY and have it

// start the emulator
// npx firebase emulators:start

// run the migration
// export FIREBASE_API_KEY=...
// FIREBASE_API_KEY=... node scripts/firebase-migration.js

// set the FIRESTORE_EMULATOR_HOST environment variable (default localhost:8080)
// run this test

// api? run FIRESTORE_EMULATOR_HOST=localhost:8080 PORT=8001 npm run firepi

// Import the firebase-admin package
import admin from "firebase-admin"

// --- Configuration ---
// !!! Replace 'Your Ledger Name Here' with the actual name of a ledger
// that you expect to exist in your emulated Firestore data. !!!
const ledgerNameToFind = "trap2"

// ---------------------

async function testFirestoreConnection() {
  try {
    console.log("Initializing Firebase Admin SDK...")
    // Initialize the SDK. Since FIRESTORE_EMULATOR_HOST is set,
    // it will automatically connect to the emulator using default credentials.
    // No specific service account is needed for emulator testing usually.
    admin.initializeApp({
      // Using a dummy projectId for emulator testing is common
      projectId: "xpnz-b7857"
    })

    console.log("SDK Initialized.")

    // Get a Firestore instance
    const db = admin.firestore()
    console.log(
      `Attempting to connect to Firestore Emulator at: ${process.env.FIRESTORE_EMULATOR_HOST || "Not Set (SDK will try default)"}`
    )
    console.log("Connected to Firestore Emulator.")

    console.log(`\nSearching for ledger with name: "${ledgerNameToFind}"...`)

    // Create a reference to the 'ledgers' collection
    const ledgersRef = db.collection("ledgers")

    const query = ledgersRef.where("name", "==", ledgerNameToFind).limit(1)

    // Execute the query
    const snapshot = await query.get()

    // Check if any documents were found
    if (snapshot.empty) {
      console.log(`\nRESULT: No ledger found with the name "${ledgerNameToFind}".`)
      console.log("Please ensure the ledger exists in your emulator data and the name matches exactly.")
    } else {
      console.log("\nRESULT: Found ledger(s):")
      snapshot.forEach((doc) => {
        console.log(`  Document ID: ${doc.id}`)
        console.log("  Data:", JSON.stringify(doc.data(), null, 2)) // Pretty print the data
      })
    }
  } catch (error) {
    console.error("\n--- An Error Occurred ---")
    console.error("Error connecting to Firestore or querying data:", error)
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
      console.error(
        '\nHint: Make sure the FIRESTORE_EMULATOR_HOST environment variable is set (e.g., "127.0.0.1:8080").'
      )
    }
  } finally {
    // Optional: You might want to explicitly exit or clean up resources if needed,
    // but for a simple test script, it might not be necessary.
    // await admin.app().delete(); // Example cleanup if needed
    console.log("\nTest script finished.")
  }
}

// Run the test function
testFirestoreConnection()
