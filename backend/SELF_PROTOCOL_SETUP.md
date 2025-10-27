# Self Protocol Integration Guide

## Overview

This backend includes full Self Protocol integration for zero-knowledge identity verification. Users can verify their identity using government-issued IDs (passport, biometric ID cards) without revealing sensitive information.

## How It Works

1. **Frontend** generates a QR code using `@selfxyz/qrcode` with your backend endpoint
2. **User** scans QR code with Self mobile app
3. **Self mobile app** generates zero-knowledge proof and sends to your backend
4. **Backend** verifies proof using `@selfxyz/core` and blockchain verification
5. **Backend** returns verification result to Self app
6. **Self app** signals frontend success/failure
7. **Frontend** updates UI with verification status

## Setup

### Environment Variables

Add these to your `.env` file:

```env
# Self Protocol Configuration
SELF_APP_NAME=Realmind Celo
SELF_SCOPE=realmind-celo
SELF_RPC_ENDPOINT=https://forno.celo.org
```

**Important Notes:**
- `SELF_APP_NAME`: Display name shown in Self mobile app
- `SELF_SCOPE`: Unique identifier for your app (must match frontend)
- `SELF_RPC_ENDPOINT`: Blockchain RPC for verification
  - **Staging/Testing**: Keep as `https://forno.celo.org` (works with Self Protocol staging)
  - **Production**: Use `https://forno.celo.org` for Celo mainnet

### Deployment to Vercel

1. **Deploy the backend:**
   ```bash
   cd backend
   vercel --prod
   ```

2. **Set environment variables on Vercel:**
   - Go to your Vercel dashboard
   - Navigate to Settings > Environment Variables
   - Add the variables above
   - Redeploy to apply changes

3. **Update frontend .env:**
   ```env
   VITE_SELF_ENDPOINT=https://your-backend.vercel.app/api/self/verify
   ```

## API Endpoint

### POST `/api/self/verify`

Verifies a Self Protocol zero-knowledge proof.

**Request Format** (sent by Self mobile app):
```json
{
  "vcAndDiscloseProof": {
    "a": ["...", "..."],
    "b": [["...", "..."], ["...", "..."]],
    "c": ["...", "..."]
  },
  "pubSignals": ["...", "...", "..."],
  "attestationId": 1,
  "scope": "realmind-celo",
  "userIdentifier": "0x1234...",
  "userDefinedData": "Realmind Profile Verification"
}
```

**Response Format:**
```json
{
  "success": true,
  "verified": true,
  "data": {
    "userId": "0x1234...",
    "verified": true,
    "timestamp": "2025-10-27T...",
    "disclosures": {
      "minimumAge": 18,
      "nationality": "USA",
      "gender": "M",
      "dateOfBirth": "1990-01-01",
      "name": "John Doe",
      "issuingState": "USA"
    }
  },
  "timestamp": "2025-10-27T..."
}
```

## Testing

### Local Development

1. **Start the backend:**
   ```bash
   cd backend
   pnpm dev
   ```
   Backend runs on `http://localhost:3000`

2. **Test the health endpoint:**
   ```bash
   curl http://localhost:3000/health/self
   ```

3. **For full testing with Self mobile app:**
   - You need a publicly accessible URL (use ngrok or deploy to Vercel)
   - The Self mobile app cannot reach `localhost`

### Using ngrok for Local Testing

```bash
# Install ngrok (if not installed)
brew install ngrok  # macOS
# or download from https://ngrok.com

# Start your backend
cd backend && pnpm dev

# In another terminal, expose it
ngrok http 3000

# Use the ngrok HTTPS URL in your frontend .env
VITE_SELF_ENDPOINT=https://your-ngrok-url.ngrok.io/api/self/verify
```

## Verification Configuration

The backend is configured to verify:

- ✅ **Minimum Age**: 18 years old
- ✅ **OFAC Check**: Enabled (sanctions screening)
- ✅ **Allowed ID Types**:
  - Passport
  - Biometric ID Card
- ✅ **Disclosed Data**:
  - Nationality
  - Gender
  - Date of Birth
  - Name
  - Issuing State

You can modify these requirements in `/backend/src/services/self.ts`:

```typescript
const configStore = new DefaultConfigStore({
  minimumAge: 18,           // Change minimum age
  excludedCountries: [],    // Add country codes to exclude
  ofac: true,              // Enable/disable OFAC check
});
```

## Troubleshooting

### "Public signals are required" Error

**Cause**: Self mobile app sent data but backend expected different format.

**Solution**:
- Backend now accepts correct format: `vcAndDiscloseProof`, `pubSignals`, `userIdentifier`
- Make sure backend is updated and redeployed

### "Element type is invalid" Error

**Cause**: React component import issue with `SelfQRcodeWrapper`.

**Solution**:
- Removed `Suspense` wrapper (not needed)
- Import order fixed in `SelfVerification.tsx`

### QR Code Shows But Verification Fails

**Causes**:
1. Backend not deployed or URL incorrect
2. CORS issues
3. Environment variables not set on Vercel
4. Self Protocol staging vs production mismatch

**Debug Steps**:
1. Check Vercel logs: `vercel logs`
2. Test endpoint manually: `curl https://your-backend.vercel.app/health/self`
3. Verify environment variables are set on Vercel
4. Check CORS is enabled (already configured in backend)

### Logs Not Showing

**Solution**: Check Vercel function logs:
```bash
vercel logs --follow
```

Or use Vercel dashboard > Deployments > Your Deployment > Runtime Logs

## Frontend Integration

The frontend `SelfVerification.tsx` component:
1. Creates a `SelfApp` instance with your backend endpoint
2. Displays QR code (desktop) or deeplink button (mobile)
3. Monitors verification status via WebSocket
4. Calls `onVerificationSuccess` when complete

**Frontend .env:**
```env
VITE_SELF_APP_NAME=Realmind Celo
VITE_SELF_SCOPE=realmind-celo
VITE_SELF_ENDPOINT=https://your-backend.vercel.app/api/self/verify
```

## Security Notes

- ✅ All verification happens on-chain via Celo blockchain
- ✅ Zero-knowledge proofs ensure no sensitive data is exposed
- ✅ Backend validates proofs cryptographically
- ✅ User data is only disclosed according to configured rules
- ⚠️ Make sure HTTPS is enabled (Vercel does this automatically)
- ⚠️ Keep your `SELF_SCOPE` consistent between frontend and backend

## Production Checklist

- [ ] Backend deployed to Vercel
- [ ] Environment variables set on Vercel
- [ ] Frontend `.env` updated with production backend URL
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Test complete verification flow
- [ ] Monitor Vercel logs for errors
- [ ] Set up error tracking (Sentry, etc.)

## Support

For Self Protocol issues:
- Documentation: https://docs.selfprotocol.xyz
- Discord: https://discord.gg/selfprotocol
- GitHub: https://github.com/selfxyz

For backend issues:
- Check Vercel logs
- Review this guide
- Test endpoints manually with curl
