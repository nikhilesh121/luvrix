import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

// Collection references
export const collections = {
  users: 'users',
  manga: 'manga',
  blogs: 'blogs',
  comments: 'comments',
  giveaways: 'giveaways',
  settings: 'settings',
  notifications: 'notifications',
  subscribers: 'subscribers',
  payments: 'payments',
  favorites: 'favorites',
  follows: 'follows',
  blogLikes: 'blogLikes',
  blogViews: 'blogViews',
  libraries: 'libraries',
  pageviews: 'pageviews',
  visitors: 'visitors',
  dailyViews: 'daily_views',
  siteStats: 'site_stats',
};

// Helper to get collection reference
export const getCollectionRef = (collectionName) => collection(db, collectionName);

// Helper to get document reference
export const getDocRef = (collectionName, docId) => doc(db, collectionName, docId);

// CRUD Operations

// Create document with auto-generated ID
export const createDocument = async (collectionName, data) => {
  const colRef = getCollectionRef(collectionName);
  const docRef = await addDoc(colRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

// Create document with specific ID
export const setDocument = async (collectionName, docId, data, merge = true) => {
  const docRef = getDocRef(collectionName, docId);
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge });
  return docId;
};

// Read single document
export const getDocument = async (collectionName, docId) => {
  const docRef = getDocRef(collectionName, docId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

// Read multiple documents with query
export const queryDocuments = async (collectionName, conditions = [], sortBy = null, limitCount = null) => {
  let q = collection(db, collectionName);
  
  // Build query constraints
  const constraints = [];
  
  for (const condition of conditions) {
    constraints.push(where(condition.field, condition.operator, condition.value));
  }
  
  if (sortBy) {
    constraints.push(orderBy(sortBy.field, sortBy.direction || 'asc'));
  }
  
  if (limitCount) {
    constraints.push(limit(limitCount));
  }
  
  q = query(q, ...constraints);
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Update document
export const updateDocument = async (collectionName, docId, data) => {
  const docRef = getDocRef(collectionName, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  return docId;
};

// Delete document
export const deleteDocument = async (collectionName, docId) => {
  const docRef = getDocRef(collectionName, docId);
  await deleteDoc(docRef);
  return docId;
};

// Batch write operations
export const batchWrite = async (operations) => {
  const batch = writeBatch(db);
  
  for (const op of operations) {
    const docRef = getDocRef(op.collection, op.docId);
    
    switch (op.type) {
      case 'set':
        batch.set(docRef, { ...op.data, updatedAt: serverTimestamp() }, { merge: op.merge ?? true });
        break;
      case 'update':
        batch.update(docRef, { ...op.data, updatedAt: serverTimestamp() });
        break;
      case 'delete':
        batch.delete(docRef);
        break;
    }
  }
  
  await batch.commit();
};

// Real-time listener
export const subscribeToDocument = (collectionName, docId, callback) => {
  const docRef = getDocRef(collectionName, docId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    } else {
      callback(null);
    }
  });
};

// Real-time collection listener
export const subscribeToCollection = (collectionName, conditions = [], callback) => {
  let q = collection(db, collectionName);
  
  if (conditions.length > 0) {
    const constraints = conditions.map(c => where(c.field, c.operator, c.value));
    q = query(q, ...constraints);
  }
  
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(docs);
  });
};

// Utility exports
export { 
  serverTimestamp, 
  increment, 
  arrayUnion, 
  arrayRemove,
  where,
  orderBy,
  limit,
  startAfter,
  query as firestoreQuery
};

export default db;
