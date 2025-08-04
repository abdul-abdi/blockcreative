# BlockCreative

BlockCreative is a platform that connects scriptwriters with producers, leveraging blockchain technology for secure transactions and AI for script analysis.

## Features

- **Authentication**: Connect with blockchain wallet or email/social login via Reown
- **User Roles**: Writer and Producer roles with different permissions and workflows
- **Project Management**: Producers can create, fund, and manage script acquisition projects
- **Script Submissions**: Writers can submit scripts to projects with AI-powered analysis
- **Blockchain Integration**: NFT minting for script ownership, escrow for secure payments
- **AI Analysis**: Gemini AI integration for script quality and marketability analysis

## Tech Stack

- **Frontend**: Next.js with React components
- **Backend**: Next.js API routes
- **Database**: MongoDB
- **Authentication**: Reown AppKit
- **Blockchain**: Lisk Sepolia Testnet
- **AI**: Google Gemini Pro API
- **Smart Contracts**: Custom NFT and escrow contracts

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB instance (Atlas or local)
- Wallet with Lisk Sepolia Testnet tokens
- Google Gemini API key
- Reown Project ID (for wallet authentication)
- Pinata account (for IPFS storage)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/blockcreative.git
   cd blockcreative
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   npm run setup-env
   ```
   This will create a `.env` file from the template if it doesn't exist.
   
   Then edit `.env` with your own values:

   ```
   # MongoDB Configuration
   MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster0.example.mongodb.net/blockcreative?retryWrites=true&w=majority
   MONGODB_DB=blockcreative

   # Authentication - Reown
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Blockchain - Lisk Sepolia Testnet
   LISK_RPC_URL=https://sepolia.rpc.example.com
   LISK_PRIVATE_KEY=your_private_key_for_platform_wallet
   LISK_CHAIN_ID=11155111

   # Smart Contract Addresses
   SCRIPT_NFT_ADDRESS=0x0000000000000000000000000000000000000000
   PROJECT_REGISTRY_ADDRESS=0x0000000000000000000000000000000000000000
   ESCROW_MANAGER_ADDRESS=0x0000000000000000000000000000000000000000
   PLATFORM_FEE_MANAGER_ADDRESS=0x0000000000000000000000000000000000000000

   # Public environment variables
   NEXT_PUBLIC_LISK_RPC_URL=https://sepolia.rpc.example.com
   NEXT_PUBLIC_SCRIPT_NFT_ADDRESS=0x0000000000000000000000000000000000000000
   NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS=0x0000000000000000000000000000000000000000
   NEXT_PUBLIC_ESCROW_MANAGER_ADDRESS=0x0000000000000000000000000000000000000000
   NEXT_PUBLIC_PLATFORM_FEE_MANAGER_ADDRESS=0x0000000000000000000000000000000000000000
   NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE=3
   
   # IPFS Storage (Pinata)
   PINATA_JWT=your_pinata_jwt_token
   NEXT_PUBLIC_GATEWAY_URL=https://gateway.pinata.cloud
   
   # AI Integration
   GEMINI_API_KEY=your_gemini_api_key

   # Platform Configuration
   PLATFORM_FEE_PERCENTAGE=3
   
   # Debugging (optional)
   DEBUG_AUTH=false
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Validation

To ensure your environment is properly configured, you can validate your setup:

```bash
npm run validate-env
```

This will check that all required environment variables are set and provide feedback on any missing values.

### Moving to a New Computer

When setting up the project on a new computer:

1. Clone the repository
2. Run the setup script:
   ```bash
   npm run setup-env
   ```
3. Update the `.env` file with your actual values
4. Validate your configuration:
   ```bash
   npm run validate-env
   ```

This approach ensures that your environment configuration remains consistent across different machines without having to manually recreate the .env file each time.

### Verification Steps

To verify your setup is working correctly:

1. **Check MongoDB Connection**:
   - Look for successful connection logs in your terminal
   - The application will fall back to mock data if connection fails

2. **Test Authentication**:
   - Navigate to http://localhost:3000/signin
   - Connect your wallet using Reown AppKit
   - Check browser console for authentication flow logs

3. **Verify API Endpoints**:
   - After authentication, test API with: http://localhost:3000/api/users/me
   - Should return your user information if authentication is working

4. **Test Blockchain Integration**:
   - Navigate to writer/producer dashboard
   - Look for wallet connection info and blockchain status

5. **Verify AI Integration**:
   - Submit a test script via the writer workflow
   - Check for Gemini API analysis response

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Clean build files
npm run clean

# Clean and rebuild
npm run clean:build
```

## Troubleshooting

### Authentication Issues

If you experience authentication problems:

1. **Check Reown AppKit Configuration**:
   - Verify your project ID in `src/context/index.tsx`
   - Check the domain configuration matches your deployment

2. **Debug Authentication Flow**:
   - Set `DEBUG_AUTH=true` in your `.env.local`
   - Check browser console and server logs for detailed auth flow

3. **Clear Authentication State**:
   - Clear localStorage and cookies in your browser
   - Use the `/signout` route to properly disconnect

### MongoDB Connection Issues

If you have issues connecting to MongoDB:

1. **Check Database URI**:
   - Verify your MongoDB URI in `.env.local` is correct
   - Ensure your IP address is whitelisted in MongoDB Atlas

2. **Connection Fallback**:
   - The application falls back to mock data in development 
   - Check the connection status in the console logs

3. **Database Models**:
   - Models are defined in `src/models/` directory
   - Ensure your MongoDB cluster has appropriate permissions

### Blockchain Integration Issues

1. **Wallet Connection**:
   - Make sure your wallet has Lisk Sepolia testnet configured
   - Check browser console for wallet connection errors

2. **Contract Interactions**:
   - Verify contract addresses in your `.env.local`
   - Check you have sufficient testnet tokens for transactions

3. **Network Configuration**:
   - Confirm the RPC URL is accessible
   - Verify chain ID matches Lisk Sepolia (11155111)

### CSS and UI Issues

If you experience issues with CSS not loading properly:

1. **Clear Next.js Cache**:
   ```bash
   npm run clean
   npm run dev
   ```

2. **Check Tailwind Configuration**:
   - Review `tailwind.config.ts` settings
   - Ensure all required CSS files are imported

3. **Disable CSS Optimization**:
   - Make sure `optimizeCss: false` is set in `next.config.js`

## Key Files and Directories

- **Authentication**: `src/lib/auth-helpers.ts`, `src/middleware.ts`
- **API Routes**: `src/app/api/`
- **Database**: `src/lib/mongodb.ts`, `src/models/`
- **Blockchain**: `src/lib/blockchain.ts`
- **Components**: `src/components/`
- **Pages**: `src/app/`

## Smart Contracts

The platform utilizes the following smart contracts:

- **ScriptNFT**: ERC-721 contract for NFT representation of script ownership
- **ProjectRegistry**: Manages project creation and lifecycle
- **EscrowManager**: Handles fund escrow and payment processing
- **PlatformFeeManager**: Manages platform fees (3%)

## API Documentation

For detailed API endpoints documentation, see [API-DOCUMENTATION.md](./api-documentation.md).

## Architecture Documentation

For architectural overview, see [BlockCreativeArchitecture.md](./BlockCreativeArchitecture.md).

## User Workflows

### Writer Journey:

1. Connect wallet and complete writer onboarding
2. Browse available projects
3. Submit scripts to projects
4. Receive AI analysis of script
5. Update submissions based on feedback
6. Receive payment when scripts are purchased
7. Transfer NFT ownership to producer

### Producer Journey:

1. Connect wallet and complete producer onboarding
2. Create projects with requirements and budget
3. Fund projects through blockchain escrow
4. Review and provide feedback on submissions
5. Purchase scripts and receive NFT ownership
6. Mint NFTs for purchased scripts

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
