import { createFileRoute } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '../components/ui/Button';
import GlobalHeader from '../components/GlobalHeader';

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

type SelfVerificationStatus = {
  verified: boolean;
  attributes?: {
    age?: number;
    nationality?: string;
    gender?: string;
  };
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
  const [selfVerificationStatus, setSelfVerificationStatus] = useState<SelfVerificationStatus>({
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

  const handleSelfVerificationSuccess = () => {
    setSelfVerificationStatus({
      verified: true,
      attributes: {
        age: 18,
        nationality: 'US',
        gender: 'Not specified',
      },
    });
    setShowSelfVerification(false);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <GlobalHeader />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-bold text-white mb-4">Profile</h1>
            <p className="text-gray-400 mb-8">
              Connect your wallet to view your profile and verify your identity
            </p>
            <Button
              onClick={handleConnect}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold"
            >
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <GlobalHeader />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <GlobalHeader />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 mb-6">
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
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {profile.displayName}
                  </h1>
                  <p className="text-purple-400 text-lg mb-3">@{profile.username}</p>
                  {profile.bio && (
                    <p className="text-gray-300 mb-4">{profile.bio}</p>
                  )}
                  <div className="flex gap-6 justify-center md:justify-start text-sm">
                    {profile.followerCount !== undefined && (
                      <div>
                        <span className="font-semibold text-white">{profile.followerCount}</span>
                        <span className="text-gray-400"> followers</span>
                      </div>
                    )}
                    {profile.followingCount !== undefined && (
                      <div>
                        <span className="font-semibold text-white">{profile.followingCount}</span>
                        <span className="text-gray-400"> following</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </h1>
                  <p className="text-gray-400 mb-4">
                    {error || 'No Farcaster profile found for this address'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Wallet Info */}
          <div className="border-t border-gray-700 pt-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Wallet Address</h2>
            <div className="bg-gray-900 rounded-lg p-4 flex items-center justify-between">
              <code className="text-purple-400 text-sm break-all">{address}</code>
              <button
                onClick={() => navigator.clipboard.writeText(address || '')}
                className="ml-4 text-gray-400 hover:text-white transition-colors"
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
          <div className="border-t border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">Identity Verification</h2>
                <p className="text-gray-400 text-sm">
                  Verify your identity with Self Protocol to unlock premium features
                </p>
              </div>
              {selfVerificationStatus.verified && (
                <div className="flex items-center gap-2 bg-green-900/30 px-4 py-2 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-green-400 font-semibold">Verified</span>
                </div>
              )}
            </div>

            {!selfVerificationStatus.verified && (
              <Button
                onClick={() => setShowSelfVerification(!showSelfVerification)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold"
              >
                {showSelfVerification ? 'Hide Verification' : 'Start Verification'}
              </Button>
            )}

            {showSelfVerification && (
              <div className="mt-6 bg-gray-900 rounded-lg p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Self Protocol Verification
                  </h3>
                  <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-4">
                    <p className="text-yellow-400 text-sm">
                      ⚠️ Self Protocol integration requires additional packages to be installed.
                    </p>
                    <p className="text-yellow-400 text-sm mt-2">
                      Run: <code className="bg-gray-800 px-2 py-1 rounded">npm install @selfxyz/qrcode @selfxyz/core ethers</code>
                    </p>
                  </div>
                  <p className="text-gray-400 mb-4">
                    Once installed, scan the QR code with the Self app to verify your identity
                  </p>
                  {/* This will be replaced with actual SelfQRcodeWrapper component once packages are installed */}
                  <div className="bg-gray-800 rounded-lg p-8 inline-block">
                    <div className="w-64 h-64 bg-gray-700 flex items-center justify-center rounded-lg">
                      <p className="text-gray-500">QR Code will appear here</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleSelfVerificationSuccess}
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold"
                  >
                    Simulate Verification (Demo)
                  </Button>
                </div>
              </div>
            )}

            {selfVerificationStatus.verified && selfVerificationStatus.attributes && (
              <div className="mt-4 bg-gray-900 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">Verified Attributes</h3>
                <div className="space-y-2 text-sm">
                  {selfVerificationStatus.attributes.age && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Age:</span>
                      <span className="text-white">18+</span>
                    </div>
                  )}
                  {selfVerificationStatus.attributes.nationality && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Nationality:</span>
                      <span className="text-white">{selfVerificationStatus.attributes.nationality}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Disconnect Button */}
          <div className="border-t border-gray-700 pt-6 mt-6">
            <Button
              onClick={() => disconnect()}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold w-full md:w-auto"
            >
              Disconnect Wallet
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
