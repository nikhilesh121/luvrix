# Firebase Migration Guide

## Project Configuration

- **Firebase Project Name:** SingleStore
- **Project ID:** singlestore-14943
- **Project Number:** 857564156095
- **Web App ID:** 1:857564156095:web:343d21da7cd1b73cfd360a
- **Android App ID:** 1:857564156095:android:573605df6eb9b7dbfd360a
- **Package Name:** com.singlestore

---

## Migration Status

| Step | Status | Description |
|------|--------|-------------|
| 1. Install Firebase packages | ✅ Done | `firebase`, `firebase-admin`, `mongodb` |
| 2. Create Firebase client config | ✅ Done | `lib/firebase.js` |
| 3. Create Firebase admin config | ✅ Done | `lib/firebase-admin.js` |
| 4. Create Firestore helper library | ✅ Done | `lib/firestore.js` |
| 5. Export MongoDB collections | ✅ Done | `scripts/migration/data/*.json` |
| 6. Create migration script | ✅ Done | `scripts/migration/migrate-to-firestore.js` |
| 7. Update Firestore security rules | ✅ Done | `firestore.rules` |
| 8. Add Firebase env variables | ✅ Done | `.env.local` |
| 9. Run migration script | ✅ Done | 1800 documents migrated |
| 10. Update application code | ✅ Done | `lib/db-firestore.js` replaces MongoDB |
| 11. Remove MongoDB dependency | ⏳ Pending | Keep for rollback capability |

---

## Migration Results (Feb 22, 2026)

| Collection | Documents | Status |
|------------|-----------|--------|
| users | 5 | ✅ |
| manga | 32 | ✅ |
| blogs | 14 | ✅ |
| comments | 0 | ⚠️ Empty |
| giveaways | 1 | ✅ |
| settings | 3 | ✅ |
| notifications | 9 | ✅ |
| subscribers | 1 | ✅ |
| payments | 17 | ✅ |
| favorites | 2 | ✅ |
| follows | 3 | ✅ |
| blogLikes | 7 | ✅ |
| blogViews | 0 | ⚠️ Empty |
| libraries | 0 | ⚠️ Empty |
| giveaway_invites | 1 | ✅ |
| giveaway_tasks | 5 | ✅ |
| giveaway_participants | 3 | ✅ |
| giveaway_supports | 6 | ✅ |
| giveaway_task_starts | 6 | ✅ |
| pageviews | 1482 | ✅ |
| watchtime | 1 | ✅ |
| visitors | 193 | ✅ |
| daily_views | 8 | ✅ |
| site_stats | 1 | ✅ |
| **TOTAL** | **1800** | ✅ |

---

## Files Created

```
lib/
├── firebase.js          # Firebase client SDK (frontend)
├── firebase-admin.js    # Firebase Admin SDK (server-side)
├── firestore.js         # Firestore CRUD helper functions
├── db-firestore.js      # Complete Firestore database layer (replaces MongoDB)
├── db-mongodb.js        # Original MongoDB implementation (backup)
└── db.js                # Re-exports from db-firestore.js

scripts/migration/
├── migrate-to-firestore.js    # Migration script
└── data/
    ├── users.json
    ├── manga.json
    ├── blogs.json
    ├── comments.json
    ├── giveaways.json
    ├── settings.json
    ├── notifications.json
    ├── subscribers.json
    ├── payments.json
    ├── favorites.json
    ├── follows.json
    ├── blogLikes.json
    ├── blogViews.json
    ├── libraries.json
    ├── giveaway_invites.json
    ├── giveaway_tasks.json
    ├── giveaway_participants.json
    ├── giveaway_supports.json
    ├── giveaway_task_starts.json
    ├── pageviews.json
    ├── watchtime.json
    ├── visitors.json
    ├── daily_views.json
    └── site_stats.json

firestore.rules          # Security rules for production
```

---

## Environment Variables

Add to `.env.local`:

```env
# Firebase Client SDK (Frontend - NEXT_PUBLIC_ prefix for client access)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCqzZPTwkZIdOfpdWm1q6bV-EtRSTBvRGw
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=singlestore-14943.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=singlestore-14943
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=singlestore-14943.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=857564156095
NEXT_PUBLIC_FIREBASE_APP_ID=1:857564156095:web:343d21da7cd1b73cfd360a
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-4Q1ER4SF02
```

---

## Running the Migration

### Step 1: Get Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/project/singlestore-14943/settings/serviceaccounts/adminsdk)
2. Click **"Generate new private key"**
3. Save the file as `serviceAccountKey.json` in the project root
4. **IMPORTANT:** Add to `.gitignore` to prevent committing credentials

### Step 2: Run Migration Script

```bash
cd /var/www/luvrix
node scripts/migration/migrate-to-firestore.js
```

### Step 3: Verify in Firebase Console

1. Go to [Firestore Database](https://console.firebase.google.com/project/singlestore-14943/firestore)
2. Verify all collections are created with correct document counts

---

## Security Rules

The `firestore.rules` file includes rules for all collections:

- **Public read:** manga, blogs, giveaways, settings
- **Authenticated write:** comments, favorites, follows, notifications
- **Admin only:** admin logs, site stats, user management
- **Analytics:** pageviews, visitors (public write for tracking)

### Deploy Security Rules

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy rules only
firebase deploy --only firestore:rules
```

---

## Using Firestore in Application

### Import the client SDK

```javascript
import { db } from '../lib/firebase';
import { 
  createDocument, 
  getDocument, 
  queryDocuments, 
  updateDocument, 
  deleteDocument 
} from '../lib/firestore';
```

### Example Usage

```javascript
// Create a document
const docId = await createDocument('blogs', {
  title: 'My Blog Post',
  content: 'Hello world',
  authorId: userId,
});

// Get a document
const blog = await getDocument('blogs', docId);

// Query documents
const blogs = await queryDocuments('blogs', [
  { field: 'authorId', operator: '==', value: userId }
], { field: 'createdAt', direction: 'desc' }, 10);

// Update a document
await updateDocument('blogs', docId, { title: 'Updated Title' });

// Delete a document
await deleteDocument('blogs', docId);
```

---

## Migration Script Features

- ✅ Converts MongoDB `_id` (ObjectId) to string document IDs
- ✅ Converts MongoDB `$date` to Firestore Timestamp
- ✅ Preserves nested objects and arrays
- ✅ Uses batch writes (max 500 per batch)
- ✅ Verifies document counts after migration
- ✅ Handles missing/empty collections gracefully

---

## Post-Migration Checklist

- [ ] Run migration script with service account key
- [ ] Verify all collections in Firebase Console
- [ ] Deploy Firestore security rules
- [ ] Update API routes to use Firestore instead of MongoDB
- [ ] Test all CRUD operations
- [ ] Remove MongoDB connection code
- [ ] Remove `mongoose` dependency from `package.json`
- [ ] Update environment variables on production server
- [ ] Build and deploy to Hostinger

---

## Notes

- **Frontend deployment:** Manual upload to Hostinger (not using Firebase Hosting)
- **No Firebase Hosting:** As requested, hosting is handled separately
- **Service Account Key:** Never commit to git, always use environment variables in production
- **Modular SDK:** Using Firebase v9+ modular imports for tree-shaking

---

## Date: February 22, 2026

Migration configuration completed. Awaiting service account key to run data migration.
