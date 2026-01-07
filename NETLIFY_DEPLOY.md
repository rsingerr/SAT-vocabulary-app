# Deploying to Netlify

## ⚠️ Important: Database Setup Required

**SQLite won't work on Netlify** because it's file-based and Netlify uses serverless functions. You need a cloud database.

### Recommended: Use Supabase (Free PostgreSQL)

1. **Create a Supabase account**: https://supabase.com
2. **Create a new project**
3. **Get your database URL** from Project Settings > Database
4. **Update your Prisma schema** to use PostgreSQL instead of SQLite

## Quick Deploy Steps

### Option 1: Deploy via Netlify UI (Easiest)

1. **Push your code to GitHub**:
   - Create a GitHub repository
   - Push your code to it

2. **Go to Netlify**: https://app.netlify.com
   - Sign up/login (free)
   - Click "Add new site" > "Import an existing project"
   - Connect your GitHub repository
   - Netlify will auto-detect Next.js settings
   - Click "Deploy site"

3. **Add Environment Variables**:
   - Go to Site settings > Environment variables
   - Add: `DATABASE_URL` with your cloud database URL
   - Add: `JWT_SECRET` with a random secret string

4. **Redeploy** after adding environment variables

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Initialize and deploy**:
   ```bash
   cd "/Users/rebeccasinger/SAT vocabulary"
   netlify init
   netlify deploy --prod
   ```

## Database Migration

After deploying, you'll need to:
1. Run migrations on your cloud database
2. Import the vocabulary data

You can do this by:
- Creating a one-time script that runs on first deploy
- Or manually running migrations after deployment

## Notes

- The app will be available at `your-site-name.netlify.app`
- Free tier includes 100GB bandwidth/month
- Builds are free for personal projects
- Custom domains available

