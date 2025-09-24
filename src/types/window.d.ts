// Global window type extensions for blockchain integrations

declare global {
  interface Window {
    ethereum?: {
      request: (args: {
        method: string
        params?: any[]
      }) => Promise<any>
      isMetaMask?: boolean
      selectedAddress?: string
      chainId?: string
      networkVersion?: string
      on?: (event: string, callback: (...args: any[]) => void) => void
      removeListener?: (event: string, callback: (...args: any[]) => void) => void
    }
  }
}

export {}