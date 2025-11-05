import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export interface FarcasterUser {
  fid: number;
  username: string;
  displayName?: string;
  pfpUrl?: string;
}

interface FarcasterContextType {
  isMiniApp: boolean;
  user: FarcasterUser | null;
  isLoading: boolean;
}

const FarcasterContext = createContext<FarcasterContextType>({
  isMiniApp: false,
  user: null,
  isLoading: true,
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

  return (
    <FarcasterContext.Provider value={{ isMiniApp, user, isLoading }}>
      {children}
    </FarcasterContext.Provider>
  );
}
