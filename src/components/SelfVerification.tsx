import { useState, useEffect } from 'react';
import { SelfQRcodeWrapper, SelfAppBuilder } from "@selfxyz/qrcode";
import type { SelfApp } from "@selfxyz/qrcode";
import { getUniversalLink } from "@selfxyz/core";
import { Button } from './ui/Button';
import { toast } from 'sonner';

interface SelfVerificationProps {
  onVerificationSuccess?: (data: any) => void;
  userId: string;
}

export function SelfVerification({
  onVerificationSuccess,
  userId
}: SelfVerificationProps) {
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect if mobile
    const checkMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(checkMobile);

    const initializeSelfApp = async () => {
      try {
        const endpoint = import.meta.env.VITE_SELF_ENDPOINT;

        if (!endpoint || endpoint.includes('your-backend-url')) {
          console.warn('Self Protocol endpoint not configured. Please set VITE_SELF_ENDPOINT in .env');
          return;
        }

        const app = new SelfAppBuilder({
          version: 2,
          appName: import.meta.env.VITE_SELF_APP_NAME || "Realmind Celo",
          scope: import.meta.env.VITE_SELF_SCOPE || "realmind-celo",
          endpoint: endpoint,
          logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
          userId: userId,
          endpointType: "staging_https", // Change to "mainnet_https" for production
          userIdType: "hex", // 'hex' for EVM address
          userDefinedData: "Realmind Profile Verification",
          disclosures: {
            // Verification rules - must match backend exactly
            minimumAge: 18,

            // Data disclosures - what to reveal
            nationality: true,
            gender: true,
          }
        }).build();

        setSelfApp(app);
        setUniversalLink(getUniversalLink(app));
      } catch (error) {
        console.error("Failed to initialize Self app:", error);
      }
    };

    initializeSelfApp();
  }, [userId]);

  const handleSuccessfulVerification = () => {
    console.log("Self Protocol verification successful!");
    if (onVerificationSuccess) {
      onVerificationSuccess({
        verified: true,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const openSelfApp = () => {
    if (!universalLink) return;
    window.open(universalLink, "_blank");
  };

  return (
    <div className="verification-container">
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--celo-black))' }}>
        Self Protocol Verification
      </h3>
      <p className="mb-4" style={{ color: 'hsl(var(--celo-brown))', fontSize: '0.9rem' }}>
        Verify your identity to unlock premium features
      </p>

      {selfApp ? (
        <div>
          {isMobile ? (
            // Mobile: Show button to open Self App
            <div className="text-center">
              <Button
                onClick={openSelfApp}
                disabled={!universalLink}
                className="btn-industrial"
                style={{
                  background: 'hsl(var(--primary))',
                  color: 'hsl(var(--celo-white))',
                  padding: '0.75rem 1.5rem',
                  width: '100%'
                }}
              >
                Open Self App
              </Button>
              <p className="text-xs mt-2" style={{ color: 'hsl(var(--celo-brown))' }}>
                Opens the Self app for identity verification
              </p>
            </div>
          ) : (
            // Desktop: Show QR Code
            <div className="flex flex-col items-center">
              <SelfQRcodeWrapper
                selfApp={selfApp}
                onSuccess={handleSuccessfulVerification}
                onError={(error) => {
                  console.error("Verification error:", error);
                  const errorMsg = error?.reason || 'Verification failed. Please try again.';
                  toast.error(errorMsg);
                }}
              />
              <p className="text-xs mt-4 text-center" style={{ color: 'hsl(var(--celo-brown))' }}>
                Scan with the Self mobile app
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'hsl(var(--primary))' }}></div>
          <span className="ml-3" style={{ color: 'hsl(var(--celo-brown))' }}>Loading verification...</span>
        </div>
      )}

      {/* Info box */}
      <div className="mt-6 p-4" style={{
        background: 'hsl(var(--celo-yellow))',
        border: 'var(--outline-thin)',
      }}>
        <p style={{
          fontSize: '0.8rem',
          fontFamily: 'var(--font-body)',
          fontWeight: 'var(--font-weight-body-heavy)',
          color: 'hsl(var(--celo-black))',
          textTransform: 'uppercase',
          letterSpacing: '0.01em',
          lineHeight: '1.4'
        }}>
          ✓ Age verification (18+)<br />
          ✓ Nationality disclosure<br />
          ✓ Gender disclosure<br />
          🔒 Your data is cryptographically secured
        </p>
      </div>
    </div>
  );
}
