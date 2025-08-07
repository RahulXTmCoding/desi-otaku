# Environment Variables Setup Guide

## Overview

The application now uses environment variables for the backend API URL configuration, following security best practices and improving deployment flexibility.

## Client-Side Environment Variables

### Setup Instructions

1. **Copy the example file:**
   ```bash
   cd client
   cp .env.example .env.local
   ```

2. **Update the values in `.env.local`:**
   ```bash
   # Local development
   VITE_API_URL=http://localhost:8000/api
   
   # Production (update with your domain)
   # VITE_API_URL=https://your-domain.com/api
   ```

### Environment Files Structure

```
client/
├── .env.example          # Template file (committed to git)
├── .env.local           # Local development config (ignored by git)
└── src/
    ├── backend.tsx      # Uses environment variables
    └── vite-env.d.ts    # TypeScript definitions
```

### File Descriptions

- **`.env.example`**: Template file showing required environment variables
- **`.env.local`**: Your local configuration (automatically ignored by git)
- **`vite-env.d.ts`**: TypeScript definitions for environment variables

## Usage in Code

The backend URL is now dynamically configured:

```typescript
// client/src/backend.tsx
export const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
```

### Benefits

1. **Security**: Sensitive URLs not hardcoded in source code
2. **Flexibility**: Easy to switch between development/production
3. **Team Collaboration**: Each developer can have their own config
4. **Deployment**: Environment-specific configuration

## Different Environments

### Development
```bash
VITE_API_URL=http://localhost:8000/api
```

### Production
```bash
VITE_API_URL=https://api.yourdomain.com/api
```

### Staging
```bash
VITE_API_URL=https://staging-api.yourdomain.com/api
```

## Security Notes

⚠️ **Important**: 
- Never commit `.env.local` files to git
- Only `VITE_` prefixed variables are exposed to the client
- Environment files are already ignored in `.gitignore`

## Troubleshooting

### TypeScript Errors
If you get TypeScript errors about `import.meta.env`, ensure `client/src/vite-env.d.ts` exists with proper definitions.

### Build Issues
Make sure your environment variables are set correctly in your hosting platform (Vercel, Netlify, etc.).

### Local Development
If the API URL is not working, check:
1. `.env.local` file exists in the `client/` directory
2. Variable name starts with `VITE_`
3. Server is running on the specified port

## Migration from Hardcoded URL

✅ **Before (hardcoded):**
```typescript
export const API = "http://localhost:8000/api";
```

✅ **After (environment variable):**
```typescript
export const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
```

This change provides better security and deployment flexibility while maintaining backward compatibility.
