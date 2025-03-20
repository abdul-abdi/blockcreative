# BlockCreative Smart Contracts

This directory contains the smart contracts for the BlockCreative platform, built with Solidity and Foundry.

## Project Structure

```
blockchain/
├── contracts/           # Smart contract source files
│   ├── ScriptNFT.sol   # NFT contract for script ownership
│   ├── ProjectRegistry.sol  # Project management contract
│   ├── EscrowManager.sol    # Payment and escrow management
│   └── PlatformFeeManager.sol  # Platform fee handling
├── script/             # Deployment and utility scripts
│   ├── Deploy.s.sol    # Main deployment script
│   ├── VerifyOnly.js   # Contract verification script
│   └── ExtractABI.js   # ABI extraction script
├── test/              # Contract test files
├── lib/               # External dependencies
└── out/              # Compiled contracts and artifacts
```

## Prerequisites

- Node.js (v16 or later)
- Foundry (latest version)
- Git

## Setup

1. Install dependencies:
   ```bash
   npm install
   forge install
   ```

2. Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

3. Set up your environment variables in `.env`:
   ```
   PRIVATE_KEY=your_private_key
   PLATFORM_ADDRESS=your_platform_address
   LISK_SEPOLIA_RPC=your_rpc_url
   ```

## Deployment

### Deploy to Testnet (Lisk Sepolia)

```bash
npm run deploy:testnet
```

This will:
1. Deploy all contracts
2. Verify contracts on Blockscout
3. Extract contract ABIs
4. Update environment files

### Deploy to Mainnet (Lisk)

```bash
npm run deploy:mainnet
```

## Contract Verification

To verify contracts on Blockscout:

```bash
npm run verify:testnet  # For testnet
npm run verify:mainnet  # For mainnet
```

## Development

### Compile Contracts

```bash
forge build
```

### Run Tests

```bash
forge test
```

### Extract ABIs

```bash
npm run extract:abi
```

## Contract Addresses

After deployment, contract addresses will be automatically updated in:
- `blockchain/.env`
- `src/contracts/.env.local`

## Security

- All contracts use OpenZeppelin's security patterns
- ReentrancyGuard implemented where needed
- Ownable pattern for admin functions
- Proper access control and validation

## License

MIT 