import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '../components/ui/Button';
import GlobalHeader from '../components/GlobalHeader';
import BottomNavigation from '../components/BottomNavigation';
import { useFarcaster } from '../contexts/FarcasterContext';

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
  fid?: number;
};

const getFarcasterProfile = async (address: string): Promise<FarcasterProfile | null> => {
  try {
    // Use backend endpoint to fetch Farcaster profile (keeps API key secure)
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    const response = await fetch(`${backendUrl}/farcaster/profile/${address}`);

    if (!response.ok) {
      console.error(`Backend API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.success || !data.profile) {
      console.log('[Profile] No Farcaster profile found');
      return null;
    }

    console.log('[Profile] Farcaster data received:', {
      username: data.profile.username,
      pfpUrl: data.profile.pfpUrl,
      hasPfp: !!data.profile.pfpUrl
    });

    return {
      displayName: data.profile.displayName,
      username: data.profile.username,
      pfpUrl: data.profile.pfpUrl || '',
      bio: data.profile.bio || '',
      followerCount: data.profile.followerCount,
      followingCount: data.profile.followingCount,
      fid: data.profile.fid,
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
  const { 
    isMiniApp, 
    isAdded, 
    addMiniApp, 
    composeCast, 
    neynarScore, 
    fetchNeynarScore, 
    isLoadingScore 
  } = useFarcaster();

  const [profile, setProfile] = useState<FarcasterProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddPrompt, setShowAddPrompt] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      setLoading(true);
      setError(null);
      getFarcasterProfile(address)
        .then((data) => {
          setProfile(data);
          setLoading(false);
          // Fetch Neynar score if we have a profile with FID
          if (data?.fid) {
            fetchNeynarScore();
          }
        })
        .catch(() => {
          setError('Failed to load profile');
          setProfile(null);
          setLoading(false);
        });
    } else {
      setProfile(null);
      setError(null);
    }
  }, [address, isConnected, fetchNeynarScore]);

  // Show add mini app prompt after a delay if not added
  useEffect(() => {
    if (isMiniApp && !isAdded && profile) {
      const timer = setTimeout(() => setShowAddPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isMiniApp, isAdded, profile]);

  const handleAddMiniApp = async () => {
    const success = await addMiniApp();
    if (success) {
      setShowAddPrompt(false);
    }
  };

  const handleShareScore = () => {
    const score = neynarScore?.neynarUserScore || 0;
    const username = profile?.username || 'learner';
    const scorePercent = Math.round(score * 100);
    
    const shareText = `🧠 My Neynar Score: ${scorePercent}%\n\n@${username} on Realmind - Test your knowledge and earn rewards!\n\nPlay now:`;
    const embedUrl = 'https://realmind-celo.dailywiser.xyz';
    
    composeCast(shareText, embedUrl);
  };

  const handleConnect = () => {
    const farcasterConnector = connectors.find((c) => c.name.toLowerCase().includes('farcaster'));
    if (farcasterConnector) {
      connect({ connector: farcasterConnector });
    } else if (connectors[0]) {
      connect({ connector: connectors[0] });
    }
  };

  if (!isConnected) {
    return (
      <div style={{ minHeight: '100vh', paddingBottom: '80px', background: 'hsl(var(--background))' }}>
        <GlobalHeader />
        <div className="flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 160px)', padding: '2rem 1rem' }}>
          <div className="text-center max-w-md">
            <div className="color-block-purple" style={{
              padding: '2rem 3rem',
              marginBottom: '2rem',
              border: '3px solid hsl(var(--celo-black))',
              display: 'inline-block'
            }}>
              <h1 className="text-headline-thin" style={{ 
                fontSize: 'clamp(2.5rem, 6vw, 4rem)',
                color: 'hsl(var(--celo-white))',
                textTransform: 'uppercase',
                margin: '0'
              }}>Profile</h1>
            </div>
            <p className="text-body-heavy" style={{ 
              marginBottom: '2rem',
              color: 'hsl(var(--celo-brown))',
              textTransform: 'uppercase',
              fontSize: '1rem',
              letterSpacing: '0.02em'
            }}>
              Connect your wallet to view your profile and verify your identity
            </p>
            <Button
              onClick={handleConnect}
              className="btn-primary-industrial"
              style={{
                fontSize: '1rem',
                padding: '1rem 2.5rem',
                textTransform: 'uppercase'
              }}
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
        <GlobalHeader />
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 160px)' }}>
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
    <div style={{ minHeight: '100vh', paddingBottom: '70px', background: 'hsl(var(--background))' }}>
      <GlobalHeader />
      <div className="container mx-auto px-4 max-w-4xl" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
        <div className="color-block" style={{
          background: 'hsl(var(--celo-white))',
          border: '3px solid hsl(var(--celo-black))',
          padding: 'clamp(1.5rem, 4vw, 2rem)',
          marginBottom: '1rem',
          boxShadow: '6px 6px 0px hsl(var(--celo-black))'
        }}>
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {profile?.pfpUrl && profile.pfpUrl.trim() !== '' ? (
                <>
                  <img
                    src={profile.pfpUrl}
                    alt="Profile"
                    style={{
                      width: '150px',
                      height: '150px',
                      border: '4px solid hsl(var(--celo-black))',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      display: 'block'
                    }}
                    onError={(e) => {
                      console.error('[Profile] Failed to load image:', profile.pfpUrl);
                      // Hide image and show fallback
                      const img = e.currentTarget;
                      const container = img.parentElement;
                      if (container) {
                        img.style.display = 'none';
                        // Create and show fallback
                        const fallback = document.createElement('div');
                        fallback.style.cssText = `
                          width: 150px;
                          height: 150px;
                          background: linear-gradient(135deg, hsl(var(--celo-purple)), hsl(var(--celo-pink)));
                          border: 4px solid hsl(var(--celo-black));
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          color: hsl(var(--celo-white));
                          font-size: 3rem;
                          font-weight: var(--font-weight-body-black);
                          border-radius: 8px;
                        `;
                        fallback.textContent = address?.slice(2, 4).toUpperCase() || '??';
                        container.insertBefore(fallback, img);
                      }
                    }}
                  />
                </>
              ) : (
                <div style={{
                  width: '150px',
                  height: '150px',
                  background: 'linear-gradient(135deg, hsl(var(--celo-purple)), hsl(var(--celo-pink)))',
                  border: '4px solid hsl(var(--celo-black))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'hsl(var(--celo-white))',
                  fontSize: '3rem',
                  fontWeight: 'var(--font-weight-body-black)',
                  borderRadius: '8px'
                }}>
                  {address?.slice(2, 4).toUpperCase()}
                </div>
              )}
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                width: '30px',
                height: '8px',
                background: 'hsl(var(--celo-yellow))',
                border: '2px solid hsl(var(--celo-black))'
              }}></div>
            </div>

            <div className="flex-1 text-center md:text-left">
              {profile ? (
                <>
                  <h1 className="text-headline-thin" style={{ 
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    color: 'hsl(var(--celo-black))',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase'
                  }}>
                    {profile.displayName}
                  </h1>
                  <p className="text-body-heavy" style={{ 
                    fontSize: '1.2rem',
                    marginBottom: '1rem',
                    color: 'hsl(var(--celo-purple))',
                    textTransform: 'uppercase'
                  }}>@{profile.username}</p>
                  {profile.bio && (
                    <p className="text-body-heavy" style={{ 
                      marginBottom: '1.5rem',
                      color: 'hsl(var(--celo-brown))',
                      fontSize: '1rem',
                      lineHeight: '1.5'
                    }}>{profile.bio}</p>
                  )}
                  <div className="flex gap-6 justify-center md:justify-start text-sm">
                    {profile.followerCount !== undefined && (
                      <div className="color-block" style={{
                        background: 'hsl(var(--celo-tan-2))',
                        padding: '0.5rem 1rem',
                        border: '2px solid hsl(var(--celo-black))'
                      }}>
                        <span className="text-body-black" style={{ 
                          color: 'hsl(var(--celo-black))',
                          fontSize: '1.2rem'
                        }}>{profile.followerCount}</span>
                        <span className="text-body-heavy" style={{ 
                          color: 'hsl(var(--celo-brown))',
                          textTransform: 'uppercase',
                          fontSize: '0.7rem',
                          marginLeft: '0.3rem'
                        }}> followers</span>
                      </div>
                    )}
                    {profile.followingCount !== undefined && (
                      <div className="color-block" style={{
                        background: 'hsl(var(--celo-tan-2))',
                        padding: '0.5rem 1rem',
                        border: '2px solid hsl(var(--celo-black))'
                      }}>
                        <span className="text-body-black" style={{ 
                          color: 'hsl(var(--celo-black))',
                          fontSize: '1.2rem'
                        }}>{profile.followingCount}</span>
                        <span className="text-body-heavy" style={{ 
                          color: 'hsl(var(--celo-brown))',
                          textTransform: 'uppercase',
                          fontSize: '0.7rem',
                          marginLeft: '0.3rem'
                        }}> following</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <h1 className="text-headline-thin" style={{ 
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    color: 'hsl(var(--celo-black))',
                    marginBottom: '1rem',
                    textTransform: 'uppercase'
                  }}>
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </h1>
                  <p className="text-body-heavy" style={{ 
                    marginBottom: '1rem',
                    color: 'hsl(var(--celo-brown))',
                    textTransform: 'uppercase'
                  }}>
                    {error || 'No Farcaster profile found for this address'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Neynar Score Section */}
          {profile && (
            <div style={{ borderTop: '3px solid hsl(var(--celo-black))', paddingTop: '2rem', marginTop: '2rem' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-body-black" style={{ 
                  color: 'hsl(var(--celo-black))',
                  fontSize: '1.5rem',
                  textTransform: 'uppercase'
                }}>Reputation Score</h2>
                <Button
                  onClick={handleShareScore}
                  className="btn-industrial"
                  style={{
                    background: 'hsl(var(--celo-purple))',
                    color: 'hsl(var(--celo-white))',
                    fontSize: '0.85rem',
                    padding: '0.5rem 1rem',
                    textTransform: 'uppercase',
                    border: '2px solid hsl(var(--celo-black))',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"/>
                    <circle cx="6" cy="12" r="3"/>
                    <circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                  Share Score
                </Button>
              </div>
              
              {isLoadingScore ? (
                <div className="color-block p-4" style={{
                  background: 'hsl(var(--celo-tan-2))',
                  border: '3px solid hsl(var(--celo-black))',
                  textAlign: 'center'
                }}>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto" style={{ borderColor: 'hsl(var(--celo-purple))' }}></div>
                  <p style={{ color: 'hsl(var(--celo-brown))', marginTop: '0.5rem', fontSize: '0.9rem' }}>Loading score...</p>
                </div>
              ) : neynarScore ? (
                <div className="color-block p-4" style={{
                  background: 'linear-gradient(135deg, hsl(var(--celo-tan-2)), hsl(var(--celo-white)))',
                  border: '3px solid hsl(var(--celo-black))',
                  padding: '1.5rem'
                }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-body-heavy" style={{ 
                        color: 'hsl(var(--celo-brown))',
                        textTransform: 'uppercase',
                        fontSize: '0.8rem',
                        marginBottom: '0.5rem'
                      }}>Neynar User Score</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-body-black" style={{ 
                          color: 'hsl(var(--celo-purple))',
                          fontSize: '2.5rem'
                        }}>{Math.round(neynarScore.neynarUserScore * 100)}%</span>
                      </div>
                    </div>
                    <div style={{
                      width: '80px',
                      height: '80px',
                      background: `conic-gradient(hsl(var(--celo-purple)) ${neynarScore.neynarUserScore * 360}deg, hsl(var(--celo-tan-2)) 0deg)`,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '3px solid hsl(var(--celo-black))'
                    }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'hsl(var(--celo-white))',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span style={{ fontSize: '1.5rem' }}>🧠</span>
                      </div>
                    </div>
                  </div>
                  <p style={{ 
                    color: 'hsl(var(--celo-brown))',
                    fontSize: '0.85rem',
                    marginTop: '1rem'
                  }}>
                    Your reputation score on Farcaster. Higher scores unlock exclusive features!
                  </p>
                </div>
              ) : (
                <div className="color-block p-4" style={{
                  background: 'hsl(var(--celo-tan-2))',
                  border: '3px solid hsl(var(--celo-black))',
                  padding: '1.5rem',
                  textAlign: 'center'
                }}>
                  <p style={{ color: 'hsl(var(--celo-brown))' }}>Score not available</p>
                  <Button
                    onClick={() => fetchNeynarScore()}
                    className="btn-industrial mt-2"
                    style={{
                      background: 'hsl(var(--celo-black))',
                      color: 'hsl(var(--celo-white))',
                      fontSize: '0.85rem',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    Refresh Score
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Add Mini App Prompt */}
          {showAddPrompt && isMiniApp && !isAdded && (
            <div style={{ 
              borderTop: '3px solid hsl(var(--celo-black))', 
              paddingTop: '2rem', 
              marginTop: '2rem'
            }}>
              <div className="color-block" style={{
                background: 'linear-gradient(135deg, hsl(var(--celo-yellow)), hsl(var(--celo-pink)))',
                border: '3px solid hsl(var(--celo-black))',
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                <h3 className="text-body-black" style={{ 
                  color: 'hsl(var(--celo-black))',
                  fontSize: '1.2rem',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase'
                }}>🔔 Enable Notifications</h3>
                <p style={{ 
                  color: 'hsl(var(--celo-black))',
                  fontSize: '0.9rem',
                  marginBottom: '1rem',
                  opacity: 0.8
                }}>
                  Add Realmind to get daily quiz reminders and leaderboard updates!
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={handleAddMiniApp}
                    className="btn-primary-industrial"
                    style={{
                      fontSize: '0.9rem',
                      padding: '0.75rem 1.5rem'
                    }}
                  >
                    Add Realmind
                  </Button>
                  <Button
                    onClick={() => setShowAddPrompt(false)}
                    style={{
                      background: 'transparent',
                      color: 'hsl(var(--celo-black))',
                      fontSize: '0.9rem',
                      padding: '0.75rem 1rem',
                      border: '2px solid hsl(var(--celo-black))'
                    }}
                  >
                    Later
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Wallet Info */}
          <div style={{ borderTop: '3px solid hsl(var(--celo-black))', paddingTop: '2rem', marginBottom: '2rem', marginTop: '2rem' }}>
            <h2 className="text-body-black" style={{ 
              color: 'hsl(var(--celo-black))',
              fontSize: '1.5rem',
              marginBottom: '1rem',
              textTransform: 'uppercase'
            }}>Wallet Address</h2>
            <div className="color-block p-4 flex items-center justify-between" style={{
              background: 'hsl(var(--celo-tan-2))',
              border: '3px solid hsl(var(--celo-black))',
              padding: '1.5rem'
            }}>
              <code className="text-sm break-all" style={{ color: 'hsl(var(--celo-purple))' }}>{address}</code>
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
          {/* <div style={{ borderTop: '3px solid hsl(var(--celo-black))', paddingTop: '2rem', marginTop: '2rem' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-body-black" style={{ 
                  color: 'hsl(var(--celo-black))',
                  fontSize: '1.5rem',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase'
                }}>Identity Verification</h2>
                <p className="text-body-heavy" style={{ 
                  color: 'hsl(var(--celo-brown))',
                  fontSize: '0.9rem',
                  textTransform: 'uppercase'
                }}>
                  Verify your identity with Self Protocol
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2" style={{
                background: 'hsl(var(--celo-tan-2))',
                border: 'var(--outline-thin)'
              }}>
                <span className="font-semibold" style={{ color: 'hsl(var(--celo-brown))' }}>COMING SOON</span>
              </div>
            </div>
          </div> */}

          {/* Disconnect Button */}
          <div style={{ borderTop: '3px solid hsl(var(--celo-black))', paddingTop: '2rem', marginTop: '2rem' }}>
            <Button
              onClick={() => disconnect()}
              className="btn-industrial"
              style={{
                background: 'hsl(var(--celo-black))',
                color: 'hsl(var(--celo-white))',
                width: '100%',
                fontSize: '1rem',
                padding: '1rem',
                textTransform: 'uppercase',
                border: '3px solid hsl(var(--celo-black))'
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
