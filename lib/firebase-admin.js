import admin from 'firebase-admin';

// Initialize Firebase Admin SDK (server-side only)
// Service account key should be stored securely and never exposed to frontend

let adminApp;

function getAdminApp() {
  if (adminApp) {
    return adminApp;
  }

  // Check if already initialized
  if (admin.apps.length > 0) {
    adminApp = admin.apps[0];
    return adminApp;
  }

  // Initialize with service account from environment variable
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : null;

  if (serviceAccount) {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'singlestore-14943',
    });
  } else {
    // Try to load from file (for local development/migration)
    try {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';
      const fs = require('fs');
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccountFile = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        adminApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccountFile),
          projectId: 'singlestore-14943',
        });
      } else {
        // Initialize with application default credentials
        adminApp = admin.initializeApp({
          projectId: 'singlestore-14943',
        });
      }
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error);
      adminApp = admin.initializeApp({
        projectId: 'singlestore-14943',
      });
    }
  }

  return adminApp;
}

// Get Firestore instance
function getAdminFirestore() {
  const app = getAdminApp();
  return admin.firestore(app);
}

// Get Auth instance
function getAdminAuth() {
  const app = getAdminApp();
  return admin.auth(app);
}

export { getAdminApp, getAdminFirestore, getAdminAuth };
export default admin;
