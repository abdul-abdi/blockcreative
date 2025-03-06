import { cookieStorage, createStorage, http } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, lisk, liskSepolia } from '@reown/appkit/networks'

// Get projectId from https://cloud.reown.com
export const projectId = 'cb15623527378bac5dce1ac3f79bbac1'

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks = [mainnet, arbitrum, liskSepolia, lisk]

// Domain for SIWX functionality
export const domain = 'blockcreative.vercel.app'

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig