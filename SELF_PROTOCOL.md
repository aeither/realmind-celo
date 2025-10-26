# Self Protocol Integration Guide

> ⚠️ **Important**: The Self SDK is currently undergoing significant changes. This guide reflects the latest implementation. If you encounter issues, please check the [SDK repository](https://github.com/selfxyz/self) for updates.

## Table of Contents
- [Overview](#overview)
- [Before You Start](#before-you-start)
- [Installation](#installation)
- [Frontend Integration](#frontend-integration)
- [Backend Integration](#backend-integration)
- [Configuration](#configuration)
- [Environment Variables](#environment-variables)
- [Testing](#testing)

## Overview

Self Protocol enables privacy-preserving identity verification for the Realmind Celo platform. This integration allows users to:
- Verify their identity without sharing sensitive personal information
- Prove age requirements for quiz participation
- Earn verifiable credentials for quiz achievements
- Build reputation with privacy-preserving proofs

The integration uses two SDKs:
* **Frontend SDK**: Generates and displays QR codes for users to scan with the Self app
* **Backend SDK**: Verifies zero-knowledge proofs on your Node.js server or directly onchain

## Before You Start

**New to Self Protocol?** We highly recommend watching the [ETHGlobal New Delhi Workshop](https://www.youtube.com/watch?v=2g0F5dWrUKk) first. This essential workshop walks through the core concepts and provides a hands-on introduction to building with Self.

## Installation

### Frontend Packages

Install the required frontend packages:

```bash
# Using pnpm (recommended for this project)
pnpm add @selfxyz/qrcode @selfxyz/core ethers

# Or using npm
npm install @selfxyz/qrcode @selfxyz/core ethers

# Or using yarn
yarn add @selfxyz/qrcode @selfxyz/core ethers
```

**Package purposes:**
* `@selfxyz/qrcode`: QR code generation and display components
* `@selfxyz/core`: Core utilities including `getUniversalLink` for deeplinks
* `ethers`: Ethereum utilities for address handling

### Backend Packages

Navigate to the backend directory and install:

```bash
cd backend
pnpm add @selfxyz/core
```

## Frontend Integration

### Basic Usage Example

Create a new component for identity verification in your Vite + React app:

**File**: `src/components/SelfVerification.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { getUniversalLink } from "@selfxyz/core";
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
} from "@selfxyz/qrcode";
import { ethers } from "ethers";

interface SelfVerificationProps {
  onVerificationSuccess?: () => void;
  userId?: string;
}

export function SelfVerification({
  onVerificationSuccess,
  userId
}: SelfVerificationProps) {
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");
  const [currentUserId] = useState(userId || ethers.ZeroAddress);

  useEffect(() => {
    try {
      const app = new SelfAppBuilder({
        version: 2,
        appName: import.meta.env.VITE_SELF_APP_NAME || "Realmind Celo",
        scope: import.meta.env.VITE_SELF_SCOPE || "realmind-celo",
        endpoint: `${import.meta.env.VITE_SELF_ENDPOINT}`,
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png", // Replace with Realmind logo
        userId: currentUserId,
        endpointType: "staging_https", // Change to "mainnet_https" for production
        userIdType: "hex",
        userDefinedData: "Realmind Quiz Platform",
        disclosures: {
          // Verify user is at least 18 years old
          minimumAge: 18,
          nationality: true,
          gender: true,
        }
      }).build();

      setSelfApp(app);
      setUniversalLink(getUniversalLink(app));
    } catch (error) {
      console.error("Failed to initialize Self app:", error);
    }
  }, [currentUserId]);

  const handleSuccessfulVerification = () => {
    console.log("Verification successful!");
    if (onVerificationSuccess) {
      onVerificationSuccess();
    }
  };

  return (
    <div className="verification-container">
      <h2>Verify Your Identity</h2>
      <p>Scan this QR code with the Self app to participate in quizzes</p>

      {selfApp ? (
        <SelfQRcodeWrapper
          selfApp={selfApp}
          onSuccess={handleSuccessfulVerification}
          onError={(error) => {
            console.error("Verification error:", error);
          }}
        />
      ) : (
        <div>Loading QR Code...</div>
      )}

      {/* Mobile deeplink option */}
      {universalLink && (
        <div className="mobile-link">
          <p>Or open directly:</p>
          <a href={universalLink} target="_blank" rel="noopener noreferrer">
            Open in Self App
          </a>
        </div>
      )}
    </div>
  );
}
```

### Integration with Quiz Flow

Update your quiz component to require verification:

**File**: `src/routes/quiz-game.tsx`

```typescript
import { SelfVerification } from '../components/SelfVerification';

// In your quiz component:
const [isVerified, setIsVerified] = useState(false);

if (!isVerified) {
  return (
    <SelfVerification
      onVerificationSuccess={() => setIsVerified(true)}
      userId={walletAddress}
    />
  );
}

// Rest of quiz UI
```

### Verification Flow

The QR code component displays the current verification status with an LED indicator and changes its appearance based on the verification state:

1. **QR Code Display**: Component shows QR code for users to scan
2. **User Scans**: User scans with Self app and provides proof
3. **Backend Verification**: Your API endpoint receives and verifies the proof
4. **Success Callback**: `onSuccess` callback is triggered when verification completes

## Backend Integration

### Requirements

* Node v16+
* Running Hono server (already set up in `/backend`)

### Set Up SelfBackendVerifier

Create a new API route for verification:

**File**: `backend/src/services/selfVerifier.ts`

```typescript
import { SelfBackendVerifier, AllIds, DefaultConfigStore } from "@selfxyz/core";

// Configuration matching frontend
const VERIFICATION_CONFIG = {
  minimumAge: 18,
  excludedCountries: ["IRN", "PRK", "RUS", "SYR"], // Example: sanctioned countries
  ofac: true, // Enable OFAC sanctions screening
};

// Create a singleton verifier instance
export const selfBackendVerifier = new SelfBackendVerifier(
  process.env.SELF_SCOPE || "realmind-celo",
  process.env.SELF_ENDPOINT || "https://your-domain.com/api/self/verify",
  false, // mockPassport: false = mainnet, true = staging/testnet
  AllIds,
  new DefaultConfigStore(VERIFICATION_CONFIG),
  "uuid" // userIdentifierType - can be "uuid" or "hex"
);

export interface VerificationResult {
  isValid: boolean;
  discloseOutput?: any;
  details?: any;
  error?: string;
}

export async function verifySelfProof(
  attestationId: number,
  proof: any,
  publicSignals: any[],
  userContextData: string
): Promise<VerificationResult> {
  try {
    const result = await selfBackendVerifier.verify(
      attestationId,    // Document type (1 = passport, 2 = EU ID card, 3 = Aadhaar)
      proof,            // The zero-knowledge proof
      publicSignals,    // Public signals array
      userContextData   // User context data (hex string)
    );

    if (result.isValidDetails.isValid) {
      return {
        isValid: true,
        discloseOutput: result.discloseOutput,
      };
    } else {
      return {
        isValid: false,
        details: result.isValidDetails,
        error: "Verification failed",
      };
    }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Unknown verification error",
    };
  }
}
```

### Add Verification Endpoint

**File**: `backend/src/index.ts`

```typescript
import { verifySelfProof } from './services/selfVerifier';

// Add this route to your Hono app
app.post('/api/self/verify', async (c) => {
  try {
    const { attestationId, proof, publicSignals, userContextData } = await c.req.json();

    // Validate required fields
    if (!proof || !publicSignals || !attestationId || !userContextData) {
      return c.json({
        status: "error",
        result: false,
        message: "Missing required fields: attestationId, proof, publicSignals, userContextData",
        error_code: "MISSING_FIELDS"
      }, 400);
    }

    // Verify the proof
    const verificationResult = await verifySelfProof(
      attestationId,
      proof,
      publicSignals,
      userContextData
    );

    if (verificationResult.isValid) {
      // Store verification result in Redis for later use
      if (c.env?.REDIS) {
        await c.env.REDIS.set(
          `self_verified:${userContextData}`,
          JSON.stringify(verificationResult.discloseOutput),
          { ex: 86400 } // 24 hour expiry
        );
      }

      return c.json({
        status: "success",
        result: true,
        credentialSubject: verificationResult.discloseOutput,
      });
    } else {
      return c.json({
        status: "error",
        result: false,
        reason: verificationResult.error || "Verification failed",
        error_code: "VERIFICATION_FAILED",
        details: verificationResult.details,
      }, 200); // Return 200 but with error status
    }
  } catch (error) {
    console.error("Self verification error:", error);
    return c.json({
      status: "error",
      result: false,
      reason: error instanceof Error ? error.message : "Unknown error",
      error_code: "INTERNAL_ERROR"
    }, 500);
  }
});
```

## Configuration

### Key Points: Configuration Matching

**CRITICAL**: Your frontend and backend configurations must match exactly:

```typescript
// Backend configuration (backend/src/services/selfVerifier.ts)
const VERIFICATION_CONFIG = {
  excludedCountries: ["IRN", "PRK", "RUS", "SYR"],
  ofac: true,
  minimumAge: 18,
};

// Frontend configuration (src/components/SelfVerification.tsx) - MUST MATCH
disclosures: {
  minimumAge: 18,                              // ✅ Same as backend
  excludedCountries: ["IRN", "PRK", "RUS", "SYR"], // ✅ Same as backend
  ofac: true,                                  // ✅ Same as backend
  // Plus any additional disclosure fields you want
  nationality: true,
  gender: true,
}
```

If these don't match, verification will fail even with valid proofs.

## Environment Variables

Add these to your `.env` files:

### Frontend (`.env`)

```bash
# Self Protocol Frontend Configuration
VITE_SELF_APP_NAME="Realmind Celo"
VITE_SELF_SCOPE="realmind-celo"
VITE_SELF_ENDPOINT="https://your-domain.com/api/self/verify"

# Use staging for development, remove for production
# VITE_SELF_ENDPOINT_TYPE="staging_https"
```

### Backend (`backend/.env`)

```bash
# Self Protocol Backend Configuration
SELF_SCOPE="realmind-celo"
SELF_ENDPOINT="https://your-domain.com/api/self/verify"

# Set to true for development/testing with mock passports
SELF_MOCK_PASSPORT=false
```

### Deployment (Vercel)

Add these to your Vercel project environment variables:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable with appropriate values for Production/Preview/Development

## Testing

### Local Development

⚠️ **Important**: The endpoint must be publicly accessible (not localhost). For local development, use [ngrok](https://ngrok.com/) to tunnel your localhost endpoint:

```bash
# Terminal 1: Start your backend
cd backend
pnpm dev

# Terminal 2: Create ngrok tunnel
ngrok http 3000

# Update your .env with the ngrok URL
VITE_SELF_ENDPOINT="https://your-ngrok-id.ngrok.io/api/self/verify"
```

### Testing Flow

1. **Start Backend**: Ensure your Hono server is running
2. **Start Frontend**: Run `pnpm dev` in the root directory
3. **Open App**: Navigate to your verification page
4. **Scan QR**: Use Self app (on testnet mode) to scan and provide proof
5. **Check Logs**: Monitor both frontend and backend console for verification flow

### Debugging

Enable verbose logging in development:

```typescript
// In your SelfVerification component
useEffect(() => {
  console.log("Self App Config:", {
    appName: import.meta.env.VITE_SELF_APP_NAME,
    scope: import.meta.env.VITE_SELF_SCOPE,
    endpoint: import.meta.env.VITE_SELF_ENDPOINT,
  });
}, []);
```

```typescript
// In your backend verifier
export async function verifySelfProof(...) {
  console.log("Verifying proof with config:", {
    attestationId,
    hasProof: !!proof,
    publicSignalsCount: publicSignals?.length,
  });
  // ... rest of verification
}
```

## Integration with Realmind Features

### Quiz Achievement Credentials

After a user completes a quiz, issue a verifiable credential:

```typescript
// In your quiz completion handler
async function handleQuizComplete(score: number, userAddress: string) {
  // 1. Record score onchain (existing flow)
  await recordScore(score);

  // 2. Issue Self credential for achievement
  // (This requires additional Self Protocol credential issuance SDK)

  // 3. Update leaderboard with verified status
  await updateLeaderboard(userAddress, score, { selfVerified: true });
}
```

### Verified Leaderboard

Display verified users differently in the leaderboard:

```typescript
// backend/src/services/leaderboard.ts
export async function getLeaderboard(redis: any) {
  const leaderboard = await redis.zrevrange('leaderboard', 0, 99, 'WITHSCORES');

  // Enrich with verification status
  const enriched = await Promise.all(
    leaderboard.map(async (entry) => {
      const verificationData = await redis.get(`self_verified:${entry.address}`);
      return {
        ...entry,
        verified: !!verificationData,
      };
    })
  );

  return enriched;
}
```

## Additional Resources

- [Self Protocol Documentation](https://docs.self.xyz/)
- [Self SDK Repository](https://github.com/selfxyz/self)
- [ETHGlobal Workshop Video](https://www.youtube.com/watch?v=2g0F5dWrUKk)
- [Example Implementation](https://github.com/selfxyz/self-examples)

## Support

For issues specific to Self Protocol integration:
1. Check the [Self Protocol GitHub Issues](https://github.com/selfxyz/self/issues)
2. Join the [Self Protocol Discord](https://discord.gg/self)
3. Review the workshop video for common pitfalls

For Realmind-specific integration questions:
- Open an issue in this repository
- Contact the development team
