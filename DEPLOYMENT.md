# 🚀 Vercel Deployment Guide

## 🔧 **Required Environment Variables**

In your Vercel dashboard (Settings > Environment Variables), add these:

### **Required Variables:**
```bash
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
VITE_CDP_CLIENT_API_KEY=your_cdp_api_key_here
```

### **Optional Variables:**
```bash
VITE_BACKEND_URL=https://your-backend-url.com
```

## 📋 **Where to Get API Keys**

### 1. **WalletConnect Project ID**
- Go to [https://cloud.walletconnect.com/](https://cloud.walletconnect.com/)
- Create a new project
- Copy the Project ID

### 2. **Coinbase Developer Platform (CDP) API Key**
- Go to [https://portal.cdp.coinbase.com/](https://portal.cdp.coinbase.com/)
- Create a new project
- Generate an API key
- Copy the API key

## 🛠️ **Deployment Steps**

1. **Fork/Clone the Repository**
2. **Connect to Vercel**
   - Import your GitHub repository to Vercel
   - Select "Vite" as the framework (should be auto-detected)

3. **Set Environment Variables**
   - Go to Project Settings > Environment Variables
   - Add all required variables listed above

4. **Deploy**
   - Vercel will auto-deploy on git push
   - Or manually trigger deployment from dashboard

## 🐛 **Troubleshooting Common Issues**

### **White Screen / Cannot read properties of undefined**
- **Cause**: Missing environment variables
- **Fix**: Ensure all `VITE_` prefixed variables are set in Vercel dashboard

### **404 Errors on Refresh**
- **Cause**: SPA routing not configured
- **Fix**: Already configured in `vercel.json` - should work automatically

### **Invalid Path Errors**
- **Cause**: TanStack Router build issues
- **Fix**: Clear Vercel build cache and redeploy

### **Build Fails**
- **Cause**: Dependencies or Node version mismatch
- **Fix**: Using Node 20.x (specified in package.json)

## 🔍 **Local Development**

1. **Create `.env.local`**:
```bash
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here
VITE_CDP_CLIENT_API_KEY=your_cdp_api_key_here
VITE_BACKEND_URL=http://localhost:3000
```

2. **Install Dependencies**:
```bash
pnpm install
```

3. **Run Development Server**:
```bash
pnpm run dev
```

## ✅ **Verification Checklist**

After deployment, verify:
- [ ] Homepage loads without white screen
- [ ] Navigation works (no 404s on refresh)
- [ ] Wallet connection works
- [ ] Quiz games load properly
- [ ] No console errors

## 🆘 **Getting Help**

If issues persist:
1. Check Vercel Function Logs in dashboard
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Try clearing Vercel build cache and redeploying
