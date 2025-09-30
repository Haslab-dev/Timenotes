# TimeNote with Turso Cloud Database

TimeNote uses **Turso** as its cloud database backend, providing seamless sync across all your devices with global performance.

## 🏗️ Architecture Overview

TimeNote is built with a clean, cloud-first architecture:
- **Turso SQLite**: Cloud database with edge distribution
- **React Query**: Intelligent caching and offline support
- **Repository Pattern**: Clean data access layer

### Database Schema
All data is properly normalized with foreign key relationships:
- **Users** → **Projects** → **Time Entries** / **Notes**
- **Many-to-Many Tags** for both Time Entries and Notes
- **Cascade Deletes** maintain data integrity

## 🚀 Setup Guide

### 1. Install Turso CLI
```bash
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login
```

### 2. Create Database
```bash
# Create database
turso db create timenote

# Get database URL and create auth token
turso db show timenote
turso db tokens create timenote
```

### 3. Initialize Schema
```bash
# Apply the schema
turso db shell timenote < database/schema.sql

# Verify tables were created
turso db shell timenote
.tables
```

### 4. Configure Environment
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Turso credentials:
VITE_TURSO_DATABASE_URL=libsql://timenote-[your-username].turso.io
VITE_TURSO_AUTH_TOKEN=your-actual-auth-token-here
```

### 5. Test Connection
```bash
# Start the app
bun dev

# If configured correctly:
# ✅ App loads without errors
# ✅ You can sign up and use all features

# If misconfigured:
# ❌ Clear error message explaining what to fix
```

## 🎯 Ready to Use!

That's it! Your TimeNote app is now powered by Turso cloud database. You'll have:

- 🌍 **Global sync** across all your devices
- ⚡ **Fast performance** with edge distribution  
- 🔒 **Secure data** with proper authentication
- 📱 **Offline support** via React Query caching

## 🏷️ Database Schema Details

### Core Tables
```sql
users (id, email, name, password_hash, created_at, updated_at)
projects (id, user_id, name, description, color, created_at, updated_at)
time_entries (id, user_id, project_id, description, start_time, end_time, duration, created_at, updated_at)
notes (id, user_id, project_id, title, content, created_at, updated_at)
```

### Tag Relationships
```sql
tags (id, user_id, name, color, created_at)
time_entry_tags (time_entry_id, tag_name, user_id)
note_tags (note_id, tag_name, user_id)
```

### Key Features
- **Foreign Key Constraints**: Data integrity maintained
- **Cascade Deletes**: Deleting user removes all their data
- **Optimized Indexes**: Fast queries on common patterns
- **Auto Timestamps**: `updated_at` maintained via triggers

## 🔧 Configuration Options

### Environment Variables
```bash
# Database provider selection
VITE_DATABASE_PROVIDER=turso          # or 'indexeddb'

# Turso configuration
VITE_TURSO_DATABASE_URL=libsql://your-db.turso.io
VITE_TURSO_AUTH_TOKEN=your-token-here
```

### Runtime Configuration
```typescript
import { getDatabaseInfo, getActiveProvider } from '@/lib/config/database-config'

// Check current configuration
console.log(getDatabaseInfo())

// Get active repositories
const authRepo = getAuthRepository()        // Returns Turso or IndexedDB repo
const projectRepo = getProjectRepository()  // Based on configuration
```

## 🏎️ Performance Considerations

### Turso Benefits
- **Global Edge Distribution**: Low latency worldwide
- **Automatic Scaling**: No infrastructure management
- **ACID Transactions**: Data consistency guaranteed
- **Real-time Sync**: Changes appear across devices instantly

### Turso Limitations
- **Network Dependency**: Requires internet connection
- **API Rate Limits**: Respect Turso's usage limits
- **Latency**: Slightly higher than local IndexedDB

### Hybrid Approach (Future)
Consider implementing:
1. **Write-through cache**: Update Turso, cache in IndexedDB
2. **Background sync**: Queue changes offline, sync when online
3. **Conflict resolution**: Handle concurrent edits across devices

## 🧪 Testing & Validation

### Local Testing
```bash
# Test with IndexedDB (default)
VITE_DATABASE_PROVIDER=indexeddb bun dev

# Test with Turso
VITE_DATABASE_PROVIDER=turso bun dev
```

### Connection Testing
```typescript
// Test Turso connection
import { tursoClient } from '@/lib/turso/turso-client'

try {
  const result = await tursoClient.query('SELECT 1 as test')
  console.log('Turso connected:', result)
} catch (error) {
  console.error('Turso connection failed:', error)
}
```

### Schema Validation
```sql
-- Verify all tables exist
SELECT name FROM sqlite_master WHERE type='table';

-- Check foreign key constraints
PRAGMA foreign_key_check;

-- Test triggers
INSERT INTO users (id, email, name, password_hash) 
VALUES ('test', 'test@example.com', 'Test', 'hash');
UPDATE users SET name = 'Updated' WHERE id = 'test';
SELECT updated_at FROM users WHERE id = 'test'; -- Should be recent
```

## 🚨 Troubleshooting

### Common Issues

**"Turso requested but not configured"**
- Check `.env.local` has correct `VITE_TURSO_*` values
- Ensure variables start with `VITE_` for client access
- Restart dev server after env changes

**"Turso API error: unauthorized"**
- Verify auth token is correct and not expired
- Check token has proper database permissions
- Regenerate token: `turso db tokens create timenote`

**"Connection failed"**
- Check database URL format: `libsql://db-name.turso.io`
- Verify database exists: `turso db list`
- Test CLI connection: `turso db shell timenote`

**Migration errors**
- Ensure target Turso database is empty or has compatible schema
- Check user permissions for source IndexedDB data
- Run migration in batches for large datasets

### Debugging Tips
```typescript
// Check configuration at runtime
console.log(getDatabaseInfo())

// Enable verbose logging
localStorage.setItem('debug', 'turso:*')

// Test individual components
import { tursoClient } from '@/lib/turso/turso-client'
const result = await tursoClient.query('SELECT COUNT(*) FROM users')
```

## 📊 Monitoring & Analytics

### Database Stats
```sql
-- User activity
SELECT COUNT(*) as active_users FROM users 
WHERE updated_at > datetime('now', '-7 days');

-- Data volume per user
SELECT u.name, 
  COUNT(p.id) as projects,
  COUNT(te.id) as time_entries,
  COUNT(n.id) as notes
FROM users u
LEFT JOIN projects p ON u.id = p.user_id
LEFT JOIN time_entries te ON u.id = te.user_id  
LEFT JOIN notes n ON u.id = n.user_id
GROUP BY u.id;
```

### Performance Monitoring
- Monitor Turso dashboard for usage metrics
- Track API response times in production
- Set up alerts for error rates

---

## 🎯 Next Steps

1. **Test the integration** with your Turso database
2. **Migrate your existing data** if needed  
3. **Deploy to production** with proper environment variables
4. **Monitor usage** and optimize queries as needed

For questions or issues, check the [Turso documentation](https://docs.turso.tech/) or create an issue in the repository.
