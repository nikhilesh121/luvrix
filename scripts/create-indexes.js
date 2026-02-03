/**
 * MongoDB Index Migration Script
 * Sprint 2 - Critical Database Performance Fix
 * 
 * Run with: node scripts/create-indexes.js
 * 
 * This script creates all 11 required indexes for optimal query performance.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  console.error('Please ensure .env.local contains MONGODB_URI');
  process.exit(1);
}

async function createIndexes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔄 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db();
    console.log(`✅ Connected to database: ${db.databaseName}\n`);
    
    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    // ============================================
    // 1. USERS COLLECTION INDEXES
    // ============================================
    console.log('📦 Creating indexes for USERS collection...');
    
    try {
      await db.collection('users').createIndex(
        { email: 1 }, 
        { unique: true, name: 'idx_users_email_unique' }
      );
      results.success.push('users.email (unique)');
      console.log('  ✅ users.email (unique)');
    } catch (e) {
      if (e.code === 85 || e.code === 86) {
        results.skipped.push('users.email - already exists');
        console.log('  ⏭️  users.email - already exists');
      } else {
        results.failed.push(`users.email: ${e.message}`);
        console.log(`  ❌ users.email: ${e.message}`);
      }
    }

    try {
      await db.collection('users').createIndex(
        { uid: 1 }, 
        { unique: true, name: 'idx_users_uid_unique' }
      );
      results.success.push('users.uid (unique)');
      console.log('  ✅ users.uid (unique)');
    } catch (e) {
      if (e.code === 85 || e.code === 86) {
        results.skipped.push('users.uid - already exists');
        console.log('  ⏭️  users.uid - already exists');
      } else {
        results.failed.push(`users.uid: ${e.message}`);
        console.log(`  ❌ users.uid: ${e.message}`);
      }
    }

    // ============================================
    // 2. BLOGS COLLECTION INDEXES
    // ============================================
    console.log('\n📦 Creating indexes for BLOGS collection...');
    
    try {
      await db.collection('blogs').createIndex(
        { slug: 1 }, 
        { unique: true, name: 'idx_blogs_slug_unique' }
      );
      results.success.push('blogs.slug (unique)');
      console.log('  ✅ blogs.slug (unique)');
    } catch (e) {
      if (e.code === 85 || e.code === 86) {
        results.skipped.push('blogs.slug - already exists');
        console.log('  ⏭️  blogs.slug - already exists');
      } else {
        results.failed.push(`blogs.slug: ${e.message}`);
        console.log(`  ❌ blogs.slug: ${e.message}`);
      }
    }

    try {
      await db.collection('blogs').createIndex(
        { status: 1, createdAt: -1 }, 
        { name: 'idx_blogs_status_createdAt' }
      );
      results.success.push('blogs.status_createdAt (compound)');
      console.log('  ✅ blogs.status_createdAt (compound)');
    } catch (e) {
      if (e.code === 85 || e.code === 86) {
        results.skipped.push('blogs.status_createdAt - already exists');
        console.log('  ⏭️  blogs.status_createdAt - already exists');
      } else {
        results.failed.push(`blogs.status_createdAt: ${e.message}`);
        console.log(`  ❌ blogs.status_createdAt: ${e.message}`);
      }
    }

    try {
      await db.collection('blogs').createIndex(
        { authorId: 1, status: 1 }, 
        { name: 'idx_blogs_authorId_status' }
      );
      results.success.push('blogs.authorId_status (compound)');
      console.log('  ✅ blogs.authorId_status (compound)');
    } catch (e) {
      if (e.code === 85 || e.code === 86) {
        results.skipped.push('blogs.authorId_status - already exists');
        console.log('  ⏭️  blogs.authorId_status - already exists');
      } else {
        results.failed.push(`blogs.authorId_status: ${e.message}`);
        console.log(`  ❌ blogs.authorId_status: ${e.message}`);
      }
    }

    try {
      await db.collection('blogs').createIndex(
        { title: 'text', content: 'text' }, 
        { name: 'idx_blogs_fulltext_search' }
      );
      results.success.push('blogs.title_content (text search)');
      console.log('  ✅ blogs.title_content (text search)');
    } catch (e) {
      if (e.code === 85 || e.code === 86) {
        results.skipped.push('blogs.fulltext - already exists');
        console.log('  ⏭️  blogs.fulltext - already exists');
      } else {
        results.failed.push(`blogs.fulltext: ${e.message}`);
        console.log(`  ❌ blogs.fulltext: ${e.message}`);
      }
    }

    // ============================================
    // 3. MANGA COLLECTION INDEXES
    // ============================================
    console.log('\n📦 Creating indexes for MANGA collection...');
    
    try {
      await db.collection('manga').createIndex(
        { slug: 1 }, 
        { unique: true, name: 'idx_manga_slug_unique' }
      );
      results.success.push('manga.slug (unique)');
      console.log('  ✅ manga.slug (unique)');
    } catch (e) {
      if (e.code === 85 || e.code === 86) {
        results.skipped.push('manga.slug - already exists');
        console.log('  ⏭️  manga.slug - already exists');
      } else {
        results.failed.push(`manga.slug: ${e.message}`);
        console.log(`  ❌ manga.slug: ${e.message}`);
      }
    }

    try {
      await db.collection('manga').createIndex(
        { status: 1, views: -1 }, 
        { name: 'idx_manga_status_views' }
      );
      results.success.push('manga.status_views (compound)');
      console.log('  ✅ manga.status_views (compound)');
    } catch (e) {
      if (e.code === 85 || e.code === 86) {
        results.skipped.push('manga.status_views - already exists');
        console.log('  ⏭️  manga.status_views - already exists');
      } else {
        results.failed.push(`manga.status_views: ${e.message}`);
        console.log(`  ❌ manga.status_views: ${e.message}`);
      }
    }

    // ============================================
    // 4. COMMENTS COLLECTION INDEXES
    // ============================================
    console.log('\n📦 Creating indexes for COMMENTS collection...');
    
    try {
      await db.collection('comments').createIndex(
        { targetId: 1, targetType: 1 }, 
        { name: 'idx_comments_target' }
      );
      results.success.push('comments.targetId_targetType (compound)');
      console.log('  ✅ comments.targetId_targetType (compound)');
    } catch (e) {
      if (e.code === 85 || e.code === 86) {
        results.skipped.push('comments.target - already exists');
        console.log('  ⏭️  comments.target - already exists');
      } else {
        results.failed.push(`comments.target: ${e.message}`);
        console.log(`  ❌ comments.target: ${e.message}`);
      }
    }

    try {
      await db.collection('comments').createIndex(
        { authorId: 1 }, 
        { name: 'idx_comments_authorId' }
      );
      results.success.push('comments.authorId');
      console.log('  ✅ comments.authorId');
    } catch (e) {
      if (e.code === 85 || e.code === 86) {
        results.skipped.push('comments.authorId - already exists');
        console.log('  ⏭️  comments.authorId - already exists');
      } else {
        results.failed.push(`comments.authorId: ${e.message}`);
        console.log(`  ❌ comments.authorId: ${e.message}`);
      }
    }

    // ============================================
    // 5. ERROR_LOGS COLLECTION INDEXES (with TTL)
    // ============================================
    console.log('\n📦 Creating indexes for ERROR_LOGS collection...');
    
    try {
      await db.collection('error_logs').createIndex(
        { serverTimestamp: 1 }, 
        { 
          expireAfterSeconds: 2592000, // 30 days
          name: 'idx_error_logs_ttl' 
        }
      );
      results.success.push('error_logs.serverTimestamp (TTL 30 days)');
      console.log('  ✅ error_logs.serverTimestamp (TTL 30 days)');
    } catch (e) {
      if (e.code === 85 || e.code === 86) {
        results.skipped.push('error_logs.ttl - already exists');
        console.log('  ⏭️  error_logs.ttl - already exists');
      } else {
        results.failed.push(`error_logs.ttl: ${e.message}`);
        console.log(`  ❌ error_logs.ttl: ${e.message}`);
      }
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(50));
    console.log('📊 INDEX CREATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Success: ${results.success.length}`);
    console.log(`⏭️  Skipped: ${results.skipped.length}`);
    console.log(`❌ Failed:  ${results.failed.length}`);
    console.log('='.repeat(50));

    if (results.success.length > 0) {
      console.log('\n✅ Successfully created:');
      results.success.forEach(idx => console.log(`   - ${idx}`));
    }

    if (results.skipped.length > 0) {
      console.log('\n⏭️  Skipped (already exist):');
      results.skipped.forEach(idx => console.log(`   - ${idx}`));
    }

    if (results.failed.length > 0) {
      console.log('\n❌ Failed:');
      results.failed.forEach(idx => console.log(`   - ${idx}`));
    }

    // ============================================
    // VERIFY INDEXES
    // ============================================
    console.log('\n' + '='.repeat(50));
    console.log('🔍 VERIFYING INDEXES');
    console.log('='.repeat(50));

    const collections = ['users', 'blogs', 'manga', 'comments', 'error_logs'];
    
    for (const collName of collections) {
      try {
        const indexes = await db.collection(collName).indexes();
        console.log(`\n${collName}: ${indexes.length} indexes`);
        indexes.forEach(idx => {
          const keys = Object.keys(idx.key).join(', ');
          const props = [];
          if (idx.unique) props.push('unique');
          if (idx.expireAfterSeconds) props.push(`TTL:${idx.expireAfterSeconds}s`);
          const propsStr = props.length ? ` (${props.join(', ')})` : '';
          console.log(`   - ${idx.name}: {${keys}}${propsStr}`);
        });
      } catch (e) {
        console.log(`\n${collName}: Could not list indexes - ${e.message}`);
      }
    }

    console.log('\n✅ Index migration completed!');
    console.log('📈 Query performance should now be significantly improved.\n');

    return results;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Database connection closed.');
  }
}

// Run the migration
createIndexes()
  .then(results => {
    if (results.failed.length > 0) {
      process.exit(1);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration error:', error);
    process.exit(1);
  });
