// Import necessary functions from the Firebase SDK
import { initializeApp } from "firebase/app";
import { 
    getFirestore, 
    connectFirestoreEmulator, 
    collection, // Import collection function
    query,      // Import query function
    limit,      // Import limit function
    getDocs     // Import getDocs function
} from "firebase/firestore";

// Your web app's Firebase configuration
// Using environment variables for sensitive data
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to emulator in development
if (window.location.hostname === "localhost") {
   console.log(`Connecting to Firestore Emulator on localhost:8080`);
  // Using "localhost" is often preferred for consistency, but "127.0.0.1" also works
  connectFirestoreEmulator(db, "localhost", 8080); 
}

// --- Test Query (v9+ Syntax) ---
// Wrap the query logic in an async function to use await
async function testFirestoreQuery() {
    const ledgerNameToFind = "trap2"; // The ledger name you are searching for

    try {
        // 1. Get a reference to the 'ledgers' collection
        const ledgersColRef = collection(db, "ledgers");

        // 2. Create a query against the collection
        const q = query(
            ledgersColRef,                             // Target the collection
            limit(5)                                   // Limit results to 1 document
        );

        // 3. Execute the query asynchronously
        const querySnapshot = await getDocs(q);

        // 4. Process the results
        if (querySnapshot.empty) {
            console.log(`\nRESULT: No ledger found with the name "${ledgerNameToFind}".`);
            console.log("Please ensure the ledger exists in your emulator data and the name matches exactly.");
        } else {
            console.log("\nRESULT: Found ledger(s):");
            querySnapshot.forEach((doc) => {
                // doc.id is the document ID
                // doc.data() is the document data (an object)
                console.log(`  Document ID: ${doc.id}`);
                console.log("  Data:", JSON.stringify(doc.data(), null, 2)); // Pretty print the data
            });
        }
    } catch (error) {
        console.error("Error executing Firestore query: ", error);
    }
}

// --- End Test Query ---


// Call the test function (e.g., when your app loads or component mounts)
// console.log("Testing Firestore connection and query...");
// testFirestoreQuery(); 


// Export the Firestore database instance for use in other parts of your app
export { db };
