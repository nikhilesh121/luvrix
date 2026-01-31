const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, query, where } = require("firebase/firestore");
const fs = require("fs");
const path = require("path");

// Firebase config - same as in firebase/config.js
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fetchDataForBuild() {
  const dataDir = path.join(__dirname, "..", "data");
  
  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  try {
    // Fetch manga
    console.log("Fetching manga...");
    const mangaSnap = await getDocs(collection(db, "manga"));
    const mangaList = mangaSnap.docs.map(doc => ({
      id: doc.id,
      slug: doc.data().slug,
      title: doc.data().title,
      totalChapters: doc.data().totalChapters || 1,
    }));
    fs.writeFileSync(
      path.join(dataDir, "manga-list.json"),
      JSON.stringify(mangaList, null, 2)
    );
    console.log(`✓ Saved ${mangaList.length} manga`);

    // Fetch approved blogs
    console.log("Fetching blogs...");
    const blogsQuery = query(collection(db, "blogs"), where("status", "==", "approved"));
    const blogsSnap = await getDocs(blogsQuery);
    const blogsList = blogsSnap.docs.map(doc => ({
      id: doc.id,
      slug: doc.data().slug,
      title: doc.data().title,
    }));
    fs.writeFileSync(
      path.join(dataDir, "blogs-list.json"),
      JSON.stringify(blogsList, null, 2)
    );
    console.log(`✓ Saved ${blogsList.length} blogs`);

    console.log("✓ Data fetch complete!");
  } catch (error) {
    console.error("Error fetching data:", error);
    // Create empty files to prevent build errors
    fs.writeFileSync(path.join(dataDir, "manga-list.json"), "[]");
    fs.writeFileSync(path.join(dataDir, "blogs-list.json"), "[]");
  }

  process.exit(0);
}

fetchDataForBuild();
