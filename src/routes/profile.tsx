import { createFileRoute } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '../components/ui/Button';
import GlobalHeader from '../components/GlobalHeader';
import BottomNavigation from '../components/BottomNavigation';
import { SelfVerification } from '../components/SelfVerification';

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
});

type FarcasterProfile = {
  displayName: string;
  username: string;
  pfpUrl: string;
  bio: string;
  followerCount?: number;
  followingCount?: number;
};

const getFarcasterProfile = async (address: string): Promise<FarcasterProfile | null> => {
  try {
    const apiKey = import.meta.env.VITE_NEYNAR_API_KEY;
    if (!apiKey) {
      console.error('VITE_NEYNAR_API_KEY not found in environment');
      return null;
    }

    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`,
      {
        headers: {
          'api_key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status}`);
    }

    const data = await response.json();

    // Neynar returns an object with addresses as keys
    const userData = data[address.toLowerCase()]?.[0];

    if (!userData) {
      return null;
    }

    return {
      displayName: userData.display_name || userData.username,
      username: userData.username,
      pfpUrl: userData.pfp_url || '',
      bio: userData.profile?.bio?.text || '',
      followerCount: userData.follower_count,
      followingCount: userData.following_count,
    };
  } catch (err) {
    console.error('Error fetching Farcaster profile:', err);
    return null;
  }
};

function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const [profile, setProfile] = useState<FarcasterProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSelfVerification, setShowSelfVerification] = useState(false);
  const [selfVerificationStatus, setSelfVerificationStatus] = useState<{
    verified: boolean;
    data?: any;
  }>({
    verified: false,
  });

  useEffect(() => {
    if (isConnected && address) {
      setLoading(true);
      setError(null);
      getFarcasterProfile(address)
        .then((data) => {
          setProfile(data);
          setLoading(false);
        })
        .catch((err) => {
          setError('Failed to load profile');
          setProfile(null);
          setLoading(false);
        });
    } else {
      setProfile(null);
      setError(null);
    }
  }, [address, isConnected]);

  const handleConnect = () => {
    const farcasterConnector = connectors.find((c) => c.name.toLowerCase().includes('farcaster'));
    if (farcasterConnector) {
      connect({ connector: farcasterConnector });
    } else if (connectors[0]) {
      connect({ connector: connectors[0] });
    }
  };

  const handleSelfVerificationSuccess = (data: any) => {
    console.log('Verification successful:', data);
    setSelfVerificationStatus({
      verified: true,
      data: data,
    });
    setShowSelfVerification(false);
  };

  if (!isConnected) {
    return (
      <div style={{ minHeight: '100vh', paddingBottom: '80px', background: 'hsl(var(--background))' }}>
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-bold mb-4" style={{ color: 'hsl(var(--primary))' }}>Profile</h1>
            <p className="mb-8" style={{ color: 'hsl(var(--celo-brown))' }}>
              Connect your wallet to view your profile and verify your identity
            </p>
            <Button
              onClick={handleConnect}
              className="btn-primary-industrial"
            >
              Connect Wallet
            </Button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', paddingBottom: '80px', background: 'hsl(var(--background))' }}>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'hsl(var(--primary))' }}></div>
            <p style={{ color: 'hsl(var(--celo-brown))' }}>Loading profile...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '80px', background: 'hsl(var(--background))' }}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="color-block" style={{
          background: 'hsl(var(--celo-white))',
          border: 'var(--outline-thick)',
          padding: '2rem',
          marginBottom: '1.5rem'
        }}>
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
            {profile?.pfpUrl ? (
              <img
                src={profile.pfpUrl}
                alt="Profile"
                className="w-32 h-32 rounded-full border-4 border-purple-500 shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-bold">
                {address?.slice(2, 4).toUpperCase()}
              </div>
            )}

            <div className="flex-1 text-center md:text-left">
              {profile ? (
                <>
                  <h1 className="text-3xl font-bold mb-2" style={{ color: 'hsl(var(--celo-black))' }}>
                    {profile.displayName}
                  </h1>
                  <p className="text-lg mb-3" style={{ color: 'hsl(var(--primary))' }}>@{profile.username}</p>
                  {profile.bio && (
                    <p className="mb-4" style={{ color: 'hsl(var(--celo-brown))' }}>{profile.bio}</p>
                  )}
                  <div className="flex gap-6 justify-center md:justify-start text-sm">
                    {profile.followerCount !== undefined && (
                      <div>
                        <span className="font-semibold" style={{ color: 'hsl(var(--celo-black))' }}>{profile.followerCount}</span>
                        <span style={{ color: 'hsl(var(--celo-brown))' }}> followers</span>
                      </div>
                    )}
                    {profile.followingCount !== undefined && (
                      <div>
                        <span className="font-semibold" style={{ color: 'hsl(var(--celo-black))' }}>{profile.followingCount}</span>
                        <span style={{ color: 'hsl(var(--celo-brown))' }}> following</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <h1 className="text-3xl font-bold mb-2" style={{ color: 'hsl(var(--celo-black))' }}>
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </h1>
                  <p className="mb-4" style={{ color: 'hsl(var(--celo-brown))' }}>
                    {error || 'No Farcaster profile found for this address'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Wallet Info */}
          <div style={{ borderTop: 'var(--outline-thin)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'hsl(var(--celo-black))' }}>Wallet Address</h2>
            <div className="color-block p-4 flex items-center justify-between" style={{
              background: 'hsl(var(--celo-tan-2))',
              border: 'var(--outline-medium)'
            }}>
              <code className="text-sm break-all" style={{ color: 'hsl(var(--primary))' }}>{address}</code>
              <button
                onClick={() => navigator.clipboard.writeText(address || '')}
                className="ml-4 transition-colors"
                style={{ color: 'hsl(var(--celo-brown))' }}
                title="Copy address"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Self Protocol Verification Section */}
          <div style={{ borderTop: 'var(--outline-thin)', paddingTop: '1.5rem' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-2" style={{ color: 'hsl(var(--celo-black))' }}>Identity Verification</h2>
                <p className="text-sm" style={{ color: 'hsl(var(--celo-brown))' }}>
                  Verify your identity with Self Protocol
                </p>
              </div>
              {selfVerificationStatus.verified && (
                <div className="flex items-center gap-2 px-4 py-2" style={{
                  background: 'hsl(var(--celo-green) / 0.2)',
                  border: 'var(--outline-thin)'
                }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    style={{ color: 'hsl(var(--celo-green))' }}
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-semibold" style={{ color: 'hsl(var(--celo-green))' }}>Verified</span>
                </div>
              )}
            </div>

            {!selfVerificationStatus.verified && !showSelfVerification && (
              <Button
                onClick={() => setShowSelfVerification(true)}
                className="btn-industrial"
                style={{
                  background: 'hsl(var(--primary))',
                  color: 'hsl(var(--celo-white))',
                }}
              >
                Start Verification
              </Button>
            )}

            {showSelfVerification && !selfVerificationStatus.verified && address && (
              <div className="mt-6 p-6" style={{
                background: 'hsl(var(--celo-tan-2))',
                border: 'var(--outline-medium)'
              }}>
                <SelfVerification
                  userId={address}
                  onVerificationSuccess={handleSelfVerificationSuccess}
                />
                <Button
                  onClick={() => setShowSelfVerification(false)}
                  className="btn-industrial mt-4"
                  style={{
                    background: 'hsl(var(--celo-white))',
                    color: 'hsl(var(--celo-black))',
                    width: '100%'
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}

            {selfVerificationStatus.verified && (
              <div className="mt-4 p-4" style={{
                background: 'hsl(var(--celo-green) / 0.1)',
                border: 'var(--outline-thin)'
              }}>
                <h3 className="font-semibold mb-2" style={{ color: 'hsl(var(--celo-black))' }}>Verification Complete!</h3>
                <p className="text-sm" style={{ color: 'hsl(var(--celo-brown))' }}>
                  Your identity has been verified with Self Protocol.
                  Verified on: {new Date(selfVerificationStatus.data?.timestamp || Date.now()).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Disconnect Button */}
          <div style={{ borderTop: 'var(--outline-thin)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
            <Button
              onClick={() => disconnect()}
              className="btn-industrial"
              style={{
                background: 'hsl(var(--celo-black))',
                color: 'hsl(var(--celo-white))',
                width: '100%'
              }}
            >
              Disconnect Wallet
            </Button>
          </div>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
}
