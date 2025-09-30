# Deployment Guide

## Cloudflare Pages Deployment

### Prerequisites
1. [Cloudflare account](https://dash.cloudflare.com/)
2. [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed
3. Your Turso database credentials

### Method 1: Automatic Deployment (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "feat: add pagination and filters"
   git push origin main
   ```

2. **Connect Repository**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to "Pages" → "Create a project" 
   - Connect your GitHub repository
   - Select this TimeNote repository

3. **Configure Build Settings**:
   ```
   Framework preset: None (Custom)
   Build command: bun run build
   Build output directory: dist
   Node.js version: 18 or later
   ```

4. **Set Environment Variables**:
   In Cloudflare Pages settings → Environment variables:
   ```
   VITE_TURSO_DATABASE_URL=libsql://your-database.turso.io
   VITE_TURSO_AUTH_TOKEN=your-auth-token
   NODE_ENV=production
   ```

5. **Deploy**: Cloudflare will automatically build and deploy on every push to main branch.

### Method 2: Manual Deployment with Wrangler

1. **Install Wrangler**:
   ```bash
   npm install -g wrangler
   # or
   bun add -g wrangler
   ```

2. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

3. **Build the project**:
   ```bash
   bun run build
   ```

4. **Deploy to Pages**:
   ```bash
   wrangler pages deploy dist --project-name timenote
   ```

5. **Set environment variables**:
   ```bash
   wrangler pages secret put VITE_TURSO_DATABASE_URL --project-name timenote
   wrangler pages secret put VITE_TURSO_AUTH_TOKEN --project-name timenote
   ```

### Method 3: Other Static Hosting Providers

#### Vercel
1. Connect your GitHub repository
2. Set framework preset to "Vite"
3. Set build command: `bun run build`
4. Set output directory: `dist`
5. Add environment variables in Vercel dashboard

#### Netlify
1. Connect your GitHub repository  
2. Set build command: `bun run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Add `_redirects` file (already included) for SPA routing

#### GitHub Pages
1. Build locally: `bun run build`
2. Deploy `dist` folder to `gh-pages` branch
3. Enable GitHub Pages in repository settings
4. **Note**: GitHub Pages doesn't support environment variables, so you'd need to build with hardcoded values (not recommended for production)

### Environment Configuration

For production deployment, make sure to set these environment variables:

```bash
# Required - Turso Database
VITE_TURSO_DATABASE_URL=libsql://your-database-name.turso.io
VITE_TURSO_AUTH_TOKEN=your-auth-token-here

# Optional - Build environment
NODE_ENV=production
```

### Custom Domain Setup (Cloudflare Pages)

1. **Add Domain**:
   - Go to Pages → Your project → Custom domains
   - Add your domain (e.g., `timenote.com`)

2. **DNS Configuration**:
   - Add CNAME record pointing to your pages.dev subdomain
   - Or use Cloudflare as your DNS provider for automatic setup

3. **SSL Certificate**:
   - Cloudflare automatically provisions SSL certificates
   - Enable "Always Use HTTPS" in SSL/TLS settings

### Post-Deployment Checklist

- ✅ App loads without errors
- ✅ User registration works
- ✅ Login functionality works
- ✅ Database operations (CRUD) work
- ✅ All routes are accessible (SPA routing)
- ✅ Environment variables are set correctly
- ✅ SSL certificate is active
- ✅ Performance is acceptable

### Troubleshooting

**Build Fails**:
- Check Node.js version (use 18+)
- Verify all dependencies are installed
- Check for TypeScript errors

**App Shows "Turso configuration missing"**:
- Verify environment variables are set correctly
- Check variable names start with `VITE_`
- Redeploy after setting variables

**SPA Routes Return 404**:
- Ensure `_redirects` file exists in `public/` directory
- Verify hosting provider supports SPA redirects

**Database Connection Issues**:
- Test Turso credentials locally first
- Check Turso database is accessible
- Verify auth token hasn't expired

### Monitoring & Analytics

Consider adding:
- **Cloudflare Analytics**: Built-in with Cloudflare Pages
- **Sentry**: Error monitoring
- **Google Analytics**: User analytics
- **Uptime monitoring**: To track availability

### Performance Optimization

- ✅ Static assets are cached (via `_headers` file)
- ✅ Gzip compression enabled
- ✅ Bundle size optimized (~950KB, ~294KB gzipped)
- 🔄 Consider code splitting for larger bundles in future

Your TimeNote app is now ready for production deployment! 🚀
