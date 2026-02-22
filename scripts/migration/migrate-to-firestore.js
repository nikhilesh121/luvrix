const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';

if (!fs.existsSync(serviceAccountPath)) {
  console.error('ERROR: Service account key file not found at:', serviceAccountPath);
  console.error('Please download serviceAccountKey.json from Firebase Console:');
  console.error('1. Go to Firebase Console > Project Settings > Service Accounts');
  console.error('2. Click "Generate new private key"');
  console.error('3. Save as serviceAccountKey.json in project root');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'singlestore-14943',
});

const db = admin.firestore();

// Batch write limit
const BATCH_SIZE = 500;

// Convert MongoDB document to Firestore-compatible format
function convertDocument(doc) {
  const converted = {};
  
  for (const [key, value] of Object.entries(doc)) {
    if (key === '_id') {
      // Convert MongoDB ObjectId to string
      if (value && value.$oid) {
        converted['id'] = value.$oid;
      } else if (typeof value === 'object' && value !== null) {
        converted['id'] = JSON.stringify(value);
      } else {
        converted['id'] = String(value);
      }
    } else if (value && typeof value === 'object') {
      if (value.$date) {
        // Convert MongoDB date to Firestore Timestamp
        converted[key] = admin.firestore.Timestamp.fromDate(new Date(value.$date));
      } else if (value.$oid) {
        // Convert ObjectId reference to string
        converted[key] = value.$oid;
      } else if (Array.isArray(value)) {
        // Handle arrays recursively
        converted[key] = value.map(item => {
          if (item && typeof item === 'object') {
            if (item.$oid) return item.$oid;
            if (item.$date) return admin.firestore.Timestamp.fromDate(new Date(item.$date));
            return convertDocument(item);
          }
          return item;
        });
      } else {
        // Handle nested objects
        converted[key] = convertDocument(value);
      }
    } else {
      converted[key] = value;
    }
  }
  
  return converted;
}

// Import a collection with batch writes
async function importCollection(collectionName, dataPath) {
  console.log(`\n📦 Importing collection: ${collectionName}`);
  
  if (!fs.existsSync(dataPath)) {
    console.log(`   ⚠️  File not found: ${dataPath}, skipping...`);
    return { imported: 0, skipped: true };
  }
  
  const rawData = fs.readFileSync(dataPath, 'utf8');
  let documents;
  
  try {
    documents = JSON.parse(rawData);
  } catch (error) {
    console.log(`   ⚠️  Invalid JSON in ${dataPath}, skipping...`);
    return { imported: 0, skipped: true };
  }
  
  if (!Array.isArray(documents) || documents.length === 0) {
    console.log(`   ⚠️  No documents in ${collectionName}, skipping...`);
    return { imported: 0, skipped: true };
  }
  
  console.log(`   📄 Found ${documents.length} documents`);
  
  let importedCount = 0;
  let batchCount = 0;
  let batch = db.batch();
  
  for (const doc of documents) {
    const converted = convertDocument(doc);
    const docId = converted.id || admin.firestore().collection(collectionName).doc().id;
    
    // Remove id from the document data (it's the document ID, not a field)
    delete converted.id;
    
    const docRef = db.collection(collectionName).doc(docId);
    batch.set(docRef, converted);
    
    batchCount++;
    importedCount++;
    
    // Commit batch when reaching limit
    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      console.log(`   ✅ Committed batch of ${batchCount} documents (${importedCount}/${documents.length})`);
      batch = db.batch();
      batchCount = 0;
    }
  }
  
  // Commit remaining documents
  if (batchCount > 0) {
    await batch.commit();
    console.log(`   ✅ Committed final batch of ${batchCount} documents`);
  }
  
  console.log(`   ✅ Imported ${importedCount} documents to ${collectionName}`);
  return { imported: importedCount, skipped: false };
}

// Verify document counts
async function verifyCollection(collectionName, expectedCount) {
  const snapshot = await db.collection(collectionName).count().get();
  const actualCount = snapshot.data().count;
  const match = actualCount === expectedCount;
  
  console.log(`   ${match ? '✅' : '❌'} ${collectionName}: ${actualCount}/${expectedCount} documents`);
  return match;
}

// Main migration function
async function migrate() {
  console.log('🚀 Starting MongoDB to Firestore Migration');
  console.log('==========================================\n');
  
  const dataDir = path.join(__dirname, 'data');
  const collections = [
    'users',
    'manga',
    'blogs',
    'comments',
    'giveaways',
    'settings',
    'notifications',
    'subscribers',
    'payments',
    'favorites',
    'follows',
    'blogLikes',
    'blogViews',
    'libraries',
    'giveaway_invites',
    'giveaway_tasks',
    'giveaway_participants',
    'giveaway_supports',
    'giveaway_task_starts',
    'pageviews',
    'watchtime',
    'visitors',
    'daily_views',
    'site_stats',
  ];
  
  const results = {};
  
  // Import all collections
  for (const collection of collections) {
    const dataPath = path.join(dataDir, `${collection}.json`);
    try {
      results[collection] = await importCollection(collection, dataPath);
    } catch (error) {
      console.error(`   ❌ Error importing ${collection}:`, error.message);
      results[collection] = { imported: 0, error: error.message };
    }
  }
  
  // Verification
  console.log('\n==========================================');
  console.log('🔍 Verifying document counts...\n');
  
  let allVerified = true;
  for (const [collection, result] of Object.entries(results)) {
    if (!result.skipped && result.imported > 0) {
      const verified = await verifyCollection(collection, result.imported);
      if (!verified) allVerified = false;
    }
  }
  
  // Summary
  console.log('\n==========================================');
  console.log('📊 Migration Summary\n');
  
  let totalImported = 0;
  for (const [collection, result] of Object.entries(results)) {
    if (result.imported > 0) {
      console.log(`   ${collection}: ${result.imported} documents`);
      totalImported += result.imported;
    }
  }
  
  console.log(`\n   Total: ${totalImported} documents imported`);
  console.log(`   Verification: ${allVerified ? '✅ All counts match' : '❌ Some counts mismatch'}`);
  console.log('\n🎉 Migration complete!');
}

// Run migration
migrate().catch(console.error);
