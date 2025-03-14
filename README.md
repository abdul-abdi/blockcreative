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
- **Authentication**: NextAuth.js with Reown
- **Blockchain**: Lisk Sepolia Testnet
- **AI**: Google Gemini Pro API
- **Smart Contracts**: Custom NFT and escrow contracts

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB instance
- Lisk Sepolia Testnet connection
- Google Gemini API key

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
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your own values.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

6. Check the test page to verify everything is working:
   ```
   http://localhost:3000/test
   ```

## Troubleshooting

### MongoDB Connection Issues

If you have issues connecting to MongoDB, the application is designed to fall back to mock data for development purposes. You can see the connection status on the test page at `/test`.

To ensure the MongoDB connection works:
1. Make sure your MongoDB URI in `.env.local` is correct
2. Check that your IP address is whitelisted in your MongoDB Atlas settings
3. Verify your database username and password

### CSS Loading Issues

If you experience issues with CSS not loading or seeing many 404 errors for CSS files in the console:

1. Disable the experimental `optimizeCss` feature in `next.config.js`:
   ```js
   experimental: {
     optimizeCss: false,
     // other settings...
   }
   ```

2. Clean the `.next` build directory:
   ```bash
   rm -rf .next
   ```

3. Restart the development server:
   ```bash
   npm run dev
   ```

## Smart Contracts

The platform utilizes the following smart contracts:

- **ScriptNFT**: ERC-721 contract for NFT representation of script ownership
- **ProjectRegistry**: Manages project creation and lifecycle
- **EscrowManager**: Handles fund escrow and payment processing
- **PlatformFeeManager**: Manages platform fees (3%)

## API Documentation

See [API-DOCUMENTATION.md](./API-DOCUMENTATION.md) for detailed API endpoints.

## Architecture

See [BlockCreativeArchitecture.md](./BlockCreativeArchitecture.md) for detailed architecture documentation.

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
