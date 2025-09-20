# AlumniConnect Deployment Guide

## 🚀 Deploy to Vercel (Easiest)

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Build and Deploy
```bash
cd project
npm run build
vercel --prod
```

### Step 3: Set Environment Variables in Vercel Dashboard
- `VITE_SUPABASE_URL=your_supabase_url`
- `VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`

## 🌐 Alternative Hosting Options

### Netlify
1. Build: `npm run build`
2. Drag & drop `dist` folder to Netlify
3. Add environment variables in site settings

### GitHub Pages
1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to package.json scripts: `"deploy": "gh-pages -d dist"`
3. Run: `npm run build && npm run deploy`

### Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize: `firebase init`
3. Deploy: `firebase deploy`

## 📱 Mobile Configuration

The app is already mobile-responsive with:
- Touch-friendly navigation
- Responsive grid layouts
- Mobile-first design
- Bottom navigation for mobile

## 🔗 PWA Setup (Progressive Web App)

To make it installable on mobile devices, we've added PWA support with:
- Service worker for offline functionality
- Web app manifest for installation
- Mobile app-like experience