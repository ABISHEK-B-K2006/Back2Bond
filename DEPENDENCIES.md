# AlumniConnect - Project Dependencies

## 📦 Main Dependencies (Runtime)

### Core Framework
- **React 18.3.1** - Frontend UI library
- **React DOM 18.3.1** - React DOM renderer
- **TypeScript 5.5.3** - Type-safe JavaScript

### Routing & Navigation
- **React Router DOM 7.9.1** - Client-side routing

### Backend & Database
- **Supabase JS 2.57.4** - Backend-as-a-Service client

### UI & Styling
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **Lucide React 0.344.0** - Icon library
- **clsx 2.1.1** - Utility for constructing className strings

### Data Visualization
- **Recharts 3.2.1** - Chart library for React

### Utilities
- **date-fns 4.1.0** - Date utility library

## 🛠️ Development Dependencies

### Build Tools
- **Vite 5.4.2** - Build tool and dev server
- **@vitejs/plugin-react 4.3.1** - Vite React plugin

### Code Quality
- **ESLint 9.9.1** - JavaScript/TypeScript linter
- **TypeScript ESLint 8.3.0** - TypeScript-specific ESLint rules

### CSS Processing
- **PostCSS 8.4.35** - CSS processor
- **Autoprefixer 10.4.18** - CSS vendor prefixing

### Type Definitions
- **@types/react 18.3.24** - React type definitions
- **@types/react-dom 18.3.7** - React DOM type definitions
- **@types/node 24.5.2** - Node.js type definitions

## 🚀 Installation Commands

```bash
# Install all dependencies
npm install

# Install only production dependencies
npm install --production

# Install specific dependency
npm install <package-name>

# Install dev dependency
npm install --save-dev <package-name>
```

## 📋 Build Requirements

### Node.js Version
- **Minimum**: Node.js 16.x
- **Recommended**: Node.js 18.x or higher

### Package Manager
- **npm** (comes with Node.js)
- **yarn** (alternative, optional)

## 🌐 Deployment Dependencies

The app is configured for deployment on:
- **Vercel** (vercel.json included)
- **Netlify** (works out of the box)
- **Firebase Hosting** (firebase.json included)
- **GitHub Pages** (deployment script ready)

## 📱 PWA Features

- **Service Worker** - For offline functionality
- **Web App Manifest** - For app installation
- **Mobile Responsive** - Touch-friendly design