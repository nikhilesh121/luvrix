/**
 * Firebase to MongoDB Migration Script
 * 
 * This script exports all data from Firebase Firestore and imports it into MongoDB.
 * Run with: node scripts/migrate-firebase-to-mongodb.js
 */

require('dotenv').config({ path: '.env.local' });
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { MongoClient } = require('mongodb');

// Firebase Admin SDK initialization
// You need to download your Firebase service account key and save it
const path = require('path');
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, '..', 'firebase-service-account.json');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'luvrix';

// Collections to migrate
const COLLECTIONS = [
  'users',
  'blogs',
  'manga',
  'comments',
  'payments',
  'settings',
  'sitemap',
  'subscribers',
  'follows',
  'blogLikes',
  'libraries',
  'rewards',
  'logs',
  'blogViews',
  'blogDrafts',
];

async function migrateCollection(firestoreDb, mongoDb, collectionName) {
  console.log(`\n📦 Migrating collection: ${collectionName}`);
  
  try {
    const snapshot = await firestoreDb.collection(collectionName).get();
    
    if (snapshot.empty) {
      console.log(`   ⚠️  Collection ${collectionName} is empty, skipping...`);
      return 0;
    }

    const documents = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Convert Firestore timestamps to JS Dates
      const convertedData = convertTimestamps(data);
      documents.push({
        _id: doc.id,
        ...convertedData,
      });
    });

    // Also migrate subcollections (like user favorites)
    if (collectionName === 'users') {
      for (const doc of snapshot.docs) {
        const favoritesSnapshot = await firestoreDb
          .collection('users')
          .doc(doc.id)
          .collection('favorites')
          .get();
        
        if (!favoritesSnapshot.empty) {
          const favorites = [];
          favoritesSnapshot.forEach(favDoc => {
            favorites.push({
              _id: favDoc.id,
              ...convertTimestamps(favDoc.data()),
            });
          });
          // Find the user document and add favorites
          const userDoc = documents.find(d => d._id === doc.id);
          if (userDoc) {
            userDoc.favorites = favorites;
          }
        }
      }
    }

    // Insert into MongoDB
    const collection = mongoDb.collection(collectionName);
    
    // Drop existing collection if exists
    try {
      await collection.drop();
    } catch (e) {
      // Collection doesn't exist, that's fine
    }

    if (documents.length > 0) {
      await collection.insertMany(documents);
      console.log(`   ✅ Migrated ${documents.length} documents`);
    }

    return documents.length;
  } catch (error) {
    console.error(`   ❌ Error migrating ${collectionName}:`, error.message);
    return 0;
  }
}

function convertTimestamps(obj) {
  if (obj === null || obj === undefined) return obj;
  
  if (obj.toDate && typeof obj.toDate === 'function') {
    return obj.toDate();
  }
  
  if (obj._seconds !== undefined && obj._nanoseconds !== undefined) {
    return new Date(obj._seconds * 1000 + obj._nanoseconds / 1000000);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertTimestamps(item));
  }
  
  if (typeof obj === 'object') {
    const converted = {};
    for (const key in obj) {
      converted[key] = convertTimestamps(obj[key]);
    }
    return converted;
  }
  
  return obj;
}

async function createIndexes(mongoDb) {
  console.log('\n📇 Creating MongoDB indexes...');
  
  // Users indexes
  await mongoDb.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
  await mongoDb.collection('users').createIndex({ uniqueId: 1 }, { unique: true, sparse: true });
  await mongoDb.collection('users').createIndex({ username: 1 }, { sparse: true });
  
  // Blogs indexes
  await mongoDb.collection('blogs').createIndex({ slug: 1 }, { unique: true, sparse: true });
  await mongoDb.collection('blogs').createIndex({ authorId: 1 });
  await mongoDb.collection('blogs').createIndex({ status: 1 });
  await mongoDb.collection('blogs').createIndex({ createdAt: -1 });
  await mongoDb.collection('blogs').createIndex({ category: 1 });
  
  // Manga indexes
  await mongoDb.collection('manga').createIndex({ slug: 1 }, { unique: true, sparse: true });
  await mongoDb.collection('manga').createIndex({ createdAt: -1 });
  
  // Comments indexes
  await mongoDb.collection('comments').createIndex({ targetId: 1, targetType: 1 });
  await mongoDb.collection('comments').createIndex({ createdAt: -1 });
  
  // Payments indexes
  await mongoDb.collection('payments').createIndex({ userId: 1 });
  await mongoDb.collection('payments').createIndex({ txnId: 1 }, { unique: true, sparse: true });
  await mongoDb.collection('payments').createIndex({ createdAt: -1 });
  
  // Follows indexes
  await mongoDb.collection('follows').createIndex({ followerId: 1 });
  await mongoDb.collection('follows').createIndex({ followingId: 1 });
  
  // Blog likes indexes
  await mongoDb.collection('blogLikes').createIndex({ userId: 1, blogId: 1 }, { unique: true });
  await mongoDb.collection('blogLikes').createIndex({ blogId: 1 });
  
  // Libraries indexes
  await mongoDb.collection('libraries').createIndex({ userId: 1 });
  await mongoDb.collection('libraries').createIndex({ isPublic: 1 });
  
  // Sitemap indexes
  await mongoDb.collection('sitemap').createIndex({ url: 1 }, { unique: true });
  await mongoDb.collection('sitemap').createIndex({ type: 1 });
  await mongoDb.collection('sitemap').createIndex({ parentSlug: 1 });
  
  // Subscribers indexes
  await mongoDb.collection('subscribers').createIndex({ email: 1 }, { unique: true });
  
  // Blog views indexes
  await mongoDb.collection('blogViews').createIndex({ viewKey: 1, date: 1 }, { unique: true });
  await mongoDb.collection('blogViews').createIndex({ blogId: 1 });
  
  console.log('   ✅ Indexes created successfully');
}

async function main() {
  console.log('🚀 Starting Firebase to MongoDB Migration\n');
  console.log('=' .repeat(50));
  
  let firebaseApp;
  let mongoClient;
  
  try {
    // Check if service account exists
    const fs = require('fs');
    if (!fs.existsSync(serviceAccountPath)) {
      console.log('\n⚠️  Firebase service account file not found!');
      console.log('   Please download your service account key from Firebase Console:');
      console.log('   1. Go to Firebase Console > Project Settings > Service Accounts');
      console.log('   2. Click "Generate New Private Key"');
      console.log('   3. Save as "firebase-service-account.json" in project root');
      console.log('\n   Or set FIREBASE_SERVICE_ACCOUNT_PATH in .env.local');
      process.exit(1);
    }

    // Initialize Firebase Admin
    const serviceAccount = require(serviceAccountPath);
    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
    });
    const firestoreDb = getFirestore(firebaseApp);
    console.log('✅ Connected to Firebase');

    // Connect to MongoDB
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    const mongoDb = mongoClient.db(MONGODB_DB);
    console.log('✅ Connected to MongoDB');

    // Migrate each collection
    let totalDocs = 0;
    for (const collectionName of COLLECTIONS) {
      const count = await migrateCollection(firestoreDb, mongoDb, collectionName);
      totalDocs += count;
    }

    // Create indexes
    await createIndexes(mongoDb);

    console.log('\n' + '='.repeat(50));
    console.log(`🎉 Migration complete! Total documents migrated: ${totalDocs}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (mongoClient) {
      await mongoClient.close();
    }
    process.exit(0);
  }
}

main();
