# Self Protocol Debugging Guide

## Understanding the Flow

**IMPORTANT**: The proof NEVER goes through your frontend! Here's the actual flow:

```
┌─────────────┐     1. Show QR    ┌──────────┐
│  Frontend   │ ────────────────→ │   User   │
│  (Browser)  │                    │ (Mobile) │
└─────────────┘                    └──────────┘
       │                                 │
       │                                 │ 2. Scan QR
       │                                 │    with Self app
       │                           ┌─────▼─────┐
       │                           │ Self App  │
       │                           │ (Mobile)  │
       │                           └─────┬─────┘
       │                                 │
       │                                 │ 3. Generate ZK proof
       │                                 │
       │                                 │ 4. Send proof directly
       │                                 │    to YOUR backend
       │                           ┌─────▼──────────┐
       │      5. WebSocket signal  │  Your Backend  │
       │ ◄────────────────────────│  /api/self/    │
       │      "verification done"  │     verify     │
       │                           └────────────────┘
       │                                 │
       │                                 │ 6. Verify proof
       │                                 │    on-chain
       │                                 │
   ┌───▼────┐                      ┌─────▼──────┐
   │onSuccess│ ◄──── 7. Return ────│   Celo     │
   │callback│       result         │Blockchain  │
   └────────┘                      └────────────┘
```

## Key Points

1. **Frontend** only displays QR code and receives success/failure signal
2. **Self mobile app** generates proof and sends **directly** to your backend
3. **Backend** receives proof, verifies it, returns result to mobile app
4. **Mobile app** signals frontend via WebSocket that verification completed
5. **Frontend `onSuccess` callback** fires but receives NO proof data

## Current Status

✅ **Fixed Issues:**
- Frontend component properly renders (no more "Element type invalid" error)
- Backend accepts multiple field name variations
- Backend has comprehensive debug logging
- TypeScript errors resolved

## Debugging Steps

### Step 1: Check Backend Logs

The backend now logs EVERYTHING. Check your Vercel logs or local console:

```bash
# If testing locally
cd backend && pnpm dev

# Check Vercel logs
vercel logs --follow
```

Look for these log lines:
```
[Self Verify] ==================== NEW REQUEST ====================
[Self Verify] Request body keys: [...]
[Self Verify] Full request body: {...}
[Self Verify] Extracted fields: {...}
```

### Step 2: Verify Endpoint URL

**Your current frontend .env:**
```env
VITE_SELF_ENDPOINT=https://realmind-mini-backend.vercel.app/api/self/verify
```

**Test the endpoint manually:**
```bash
curl https://realmind-mini-backend.vercel.app/health/self
```

Should return:
```json
{
  "status": "healthy",
  "service": "self_protocol",
  "timestamp": "2025-10-27T..."
}
```

### Step 3: Check What Mobile App Sends

When you scan the QR code, the backend will log the EXACT payload. Check logs for:

```
[Self Verify] Request body keys: ['proof', 'pubSignals', 'attestationId', ...]
```

The backend now handles these variations:
- `proof` OR `vcAndDiscloseProof` ✅
- `pubSignals` OR `publicSignals` ✅
- `userId` OR `userIdentifier` ✅
- `userDefinedData` OR `userContextData` ✅

### Step 4: Common Error Messages

#### "Proof is required"

**Cause**: Mobile app didn't send proof field

**Debug**:
```bash
# Check backend logs for:
[Self Verify] Available fields: [list of fields]
```

**Solution**: Check if mobile app sent data with different field name. The backend now logs the hint:
```json
{
  "hint": "Expected field: vcAndDiscloseProof or proof"
}
```

#### "Public signals are required"

**Cause**: `pubSignals` is missing or not an array

**Debug**: Check logs for:
```
[Self Verify] publicSignals type: undefined
[Self Verify] publicSignals value: null
```

**Solution**: Verify the mobile app completed proof generation. The hint will say:
```json
{
  "hint": "Expected field: pubSignals or publicSignals (array)"
}
```

### Step 5: Test with Sample Request

Test your backend manually (bypass mobile app):

```bash
curl -X POST https://realmind-mini-backend.vercel.app/api/self/verify \
  -H "Content-Type: application/json" \
  -d '{
    "proof": {"a": ["1", "2"], "b": [["3", "4"], ["5", "6"]], "c": ["7", "8"]},
    "pubSignals": ["signal1", "signal2"],
    "attestationId": 1,
    "userIdentifier": "0x1234567890abcdef1234567890abcdef12345678",
    "scope": "realmind-celo"
  }'
```

This will show if your backend is reachable and working.

## Environment Configuration Checklist

### Frontend `.env`
```env
# ✅ Make sure this points to your DEPLOYED backend
VITE_SELF_ENDPOINT=https://realmind-mini-backend.vercel.app/api/self/verify

# ✅ These must match backend
VITE_SELF_APP_NAME=Realmind Celo
VITE_SELF_SCOPE=realmind-celo
```

### Backend `.env` (Vercel Environment Variables)
```env
# ✅ Must match frontend
SELF_APP_NAME=Realmind Celo
SELF_SCOPE=realmind-celo

# ✅ For Celo mainnet
SELF_RPC_ENDPOINT=https://forno.celo.org
```

## Common Mistakes

### ❌ Mistake 1: Expecting proof in frontend `onSuccess`
```typescript
// WRONG! onSuccess doesn't receive proof data
const handleSuccess = (data) => {
  fetch('/api/verify', { body: data.proof }); // ❌ data.proof doesn't exist!
}
```

```typescript
// CORRECT! onSuccess is just a signal
const handleSuccess = () => {
  toast.success('Verified!'); // ✅ Just update UI
}
```

### ❌ Mistake 2: Backend not deployed
```env
# WRONG!
VITE_SELF_ENDPOINT=http://localhost:3000/api/self/verify  # ❌ Mobile app can't reach localhost!
```

```env
# CORRECT!
VITE_SELF_ENDPOINT=https://your-backend.vercel.app/api/self/verify  # ✅ Public HTTPS URL
```

### ❌ Mistake 3: Scope mismatch
```env
# Frontend .env
VITE_SELF_SCOPE=realmind-celo  # ⚠️

# Backend .env
SELF_SCOPE=realmind  # ❌ MISMATCH! Must be exactly the same
```

## Testing Checklist

- [ ] Backend deployed to Vercel with HTTPS
- [ ] All environment variables set on Vercel
- [ ] Frontend `.env` has correct backend URL
- [ ] `SELF_SCOPE` matches exactly between frontend and backend
- [ ] Backend health endpoint returns "healthy"
- [ ] Vercel logs are accessible (`vercel logs --follow`)
- [ ] Mobile device has Self app installed
- [ ] Mobile device has internet connection
- [ ] QR code displays properly in browser

## Next Steps

1. **Deploy backend to Vercel** (if not already):
   ```bash
   cd backend
   vercel --prod
   ```

2. **Set environment variables** on Vercel dashboard

3. **Update frontend `.env`** with deployed backend URL

4. **Rebuild frontend**:
   ```bash
   pnpm run build
   ```

5. **Test the flow**:
   - Open `/profile` page
   - Click "Start Verification"
   - Scan QR code with Self mobile app
   - Watch backend logs for debug output

6. **If it fails**:
   - Check Vercel logs immediately
   - Look for the debug output showing what was received
   - Share the logs to get help

## Self Protocol Documentation

- Official Docs: https://docs.selfprotocol.xyz
- Discord: https://discord.gg/selfprotocol
- Example App: https://github.com/selfxyz/self-protocol-example

## Still Not Working?

If after all these steps it still fails:

1. **Share your Vercel logs** - Copy the full `[Self Verify]` log section
2. **Share the error message** from the Self mobile app
3. **Verify your backend is accessible**: Test with `curl` as shown in Step 5
4. **Check CORS**: The backend already has CORS enabled for all origins

The comprehensive logging will show EXACTLY what the mobile app sent, making it easy to debug!
