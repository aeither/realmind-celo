import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export interface FarcasterUser {
  fid: number;
  username: string;
  displayName?: string;
  pfpUrl?: string;
}

export interface NeynarScore {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  neynarUserScore: number;
  followerCount: number;
  followingCount: number;
  activeStatus: string;
}

interface FarcasterContextType {
  isMiniApp: boolean;
  user: FarcasterUser | null;
  isLoading: boolean;
  isAdded: boolean;
  hasNotifications: boolean;
  addMiniApp: () => Promise<boolean>;
  composeCast: (text: string, embedUrl?: string) => Promise<boolean>;
  neynarScore: NeynarScore | null;
  fetchNeynarScore: () => Promise<NeynarScore | null>;
  isLoadingScore: boolean;
}

const FarcasterContext = createContext<FarcasterContextType>({
  isMiniApp: false,
  user: null,
  isLoading: true,
  isAdded: false,
  hasNotifications: false,
  addMiniApp: async () => false,
  composeCast: async () => false,
  neynarScore: null,
  fetchNeynarScore: async () => null,
  isLoadingScore: false,
});

export function useFarcaster() {
  return useContext(FarcasterContext);
}

interface FarcasterProviderProps {
  children: ReactNode;
}

export function FarcasterProvider({ children }: FarcasterProviderProps) {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdded, setIsAdded] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [neynarScore, setNeynarScore] = useState<NeynarScore | null>(null);
  const [isLoadingScore, setIsLoadingScore] = useState(false);

  useEffect(() => {
    const detectFarcaster = async () => {
      try {
        const isInMiniApp = await sdk.isInMiniApp();
        setIsMiniApp(isInMiniApp);

        if (isInMiniApp) {
          // sdk.context is a Promise, so we need to await it
          const context = await sdk.context;
          if (context?.user) {
            setUser({
              fid: context.user.fid,
              username: context.user.username || '',
              displayName: context.user.displayName,
              pfpUrl: context.user.pfpUrl,
            });
            console.log('Farcaster user detected:', context.user.username);
          }
          
          // Check if app is already added
          if (context?.client?.added) {
            setIsAdded(true);
            if (context.client.notificationDetails) {
              setHasNotifications(true);
            }
          }
        }
      } catch (error) {
        console.error('Error detecting Farcaster environment:', error);
        setIsMiniApp(false);
      } finally {
        setIsLoading(false);
      }
    };

    detectFarcaster();
  }, []);

  // Function to prompt user to add the mini app
  const addMiniApp = useCallback(async (): Promise<boolean> => {
    if (!isMiniApp) {
      console.log('Not in mini app environment');
      return false;
    }

    try {
      const result = await sdk.actions.addFrame();
      
      if (result.added) {
        setIsAdded(true);
        if (result.notificationDetails) {
          setHasNotifications(true);
          console.log('Mini app added with notifications enabled');
        } else {
          console.log('Mini app added without notifications');
        }
        return true;
      } else {
        console.log('User rejected adding mini app:', result.reason);
        return false;
      }
    } catch (error) {
      console.error('Error adding mini app:', error);
      return false;
    }
  }, [isMiniApp]);

  // Function to compose a cast with optional embed
  const composeCast = useCallback(async (text: string, embedUrl?: string): Promise<boolean> => {
    if (!isMiniApp) {
      // Fallback to Warpcast compose URL for non-mini app environment
      const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}${embedUrl ? `&embeds[]=${encodeURIComponent(embedUrl)}` : ''}`;
      window.open(composeUrl, '_blank');
      return true;
    }

    try {
      const result = await sdk.actions.composeCast({
        text,
        embeds: embedUrl ? [embedUrl] : undefined,
      });
      
      return !!result;
    } catch (error) {
      console.error('Error composing cast:', error);
      // Fallback to Warpcast compose URL
      const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}${embedUrl ? `&embeds[]=${encodeURIComponent(embedUrl)}` : ''}`;
      window.open(composeUrl, '_blank');
      return false;
    }
  }, [isMiniApp]);

  // Function to fetch Neynar score
  const fetchNeynarScore = useCallback(async (): Promise<NeynarScore | null> => {
    if (!user?.fid) {
      console.log('No FID available to fetch score');
      return null;
    }

    setIsLoadingScore(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/farcaster/score/${user.fid}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch score: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.score) {
        setNeynarScore(data.score);
        return data.score;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching Neynar score:', error);
      return null;
    } finally {
      setIsLoadingScore(false);
    }
  }, [user?.fid]);

  return (
    <FarcasterContext.Provider value={{ 
      isMiniApp, 
      user, 
      isLoading,
      isAdded,
      hasNotifications,
      addMiniApp,
      composeCast,
      neynarScore,
      fetchNeynarScore,
      isLoadingScore
    }}>
      {children}
    </FarcasterContext.Provider>
  );
}
