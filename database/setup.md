# Turso Database Setup Guide

TimeNote now uses **Turso** as its cloud database. Follow these steps to get started:

## 🚀 Quick Setup

### 1. Install Turso CLI
```bash
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login
```

### 2. Create Your Database
```bash
# Create database
turso db create timenote

# Get database URL
turso db show timenote
# Copy the URL that looks like: libsql://timenote-[username].turso.io

# Create auth token
turso db tokens create timenote
# Copy the token (starts with "eyJ...")
```

### 3. Initialize Schema
```bash
# Apply the schema to your database
turso db shell timenote < database/schema.sql

# Verify tables were created
turso db shell timenote
.tables
# Should show: users, projects, time_entries, notes, tags, time_entry_tags, note_tags
```

### 4. Configure Environment
```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your actual credentials:
VITE_TURSO_DATABASE_URL=libsql://timenote-[your-username].turso.io
VITE_TURSO_AUTH_TOKEN=eyJ[your-actual-token-here]
```

### 5. Test Your Setup
```bash
# Start the development server
bun dev

# If configured correctly, you'll see:
# ✅ "Database Configuration" log shows Turso is connected
# ✅ App loads without database errors
# ✅ You can sign up and create your first user

# If misconfigured, you'll see:
# ❌ Clear error message explaining what to fix
```

## 🔧 Verification Steps

### Test Database Connection
```bash
# Test CLI connection
turso db shell timenote

# Run a test query
SELECT COUNT(*) FROM sqlite_master WHERE type='table';
# Should return 7 (the number of tables)
```

### Test Application
1. **Start the app**: `bun dev`
2. **Sign up**: Create a new account
3. **Create data**: Add a project, time entry, and note
4. **Verify sync**: Check data persists after page refresh

## 🛠️ Troubleshooting

### "Turso configuration missing"
- Check `.env.local` exists and has correct variables
- Ensure variables start with `VITE_` (required for client access)
- Restart dev server after changing environment variables

### "unauthorized" or 401 errors
- Verify auth token is correct and hasn't expired
- Regenerate token: `turso db tokens create timenote`
- Check token has proper permissions for your database

### "Connection failed" or "cannot read properties of undefined"
- Verify database URL format: `libsql://database-name.turso.io`
- Ensure database exists: `turso db list`
- Test CLI connection: `turso db shell timenote`
- Check that schema was applied correctly: `turso db shell timenote` then `.tables`

### "Table doesn't exist"
- Re-run schema: `turso db shell timenote < database/schema.sql`
- Check tables exist: `turso db shell timenote` then `.tables`

## 📊 Production Deployment

### Environment Variables
Set these in your hosting platform:
```bash
VITE_TURSO_DATABASE_URL=libsql://your-production-db.turso.io
VITE_TURSO_AUTH_TOKEN=your-production-token
NODE_ENV=production
```

### Separate Databases
Consider using separate databases for dev/staging/production:
```bash
# Development
turso db create timenote-dev

# Production  
turso db create timenote-prod
```

### Monitoring
- Monitor usage in [Turso console](https://turso.tech/app)
- Set up alerts for API limits
- Monitor database size and performance

## 🎯 Next Steps

1. ✅ Complete setup above
2. 🔐 Create your first user account
3. 📊 Add some projects and time entries
4. 🌍 Access your data from multiple devices
5. 📈 Monitor usage in Turso dashboard

Need help? Check the [Turso docs](https://docs.turso.tech/) or create an issue in this repository.
