# Environment Variables Management

This project includes tools to help manage environment variables consistently across different development environments.

## Files

- `.env.example` - Template file with all required environment variables
- `.env` - Your local environment configuration (not committed to git)
- `scripts/setup-env.js` - Script to create .env from template
- `scripts/validate-env.js` - Script to validate environment configuration

## Setup Process

1. **Initial Setup**
   Run the setup script to create your .env file from the template:
   ```bash
   npm run setup-env
   ```

2. **Configure Variables**
   Edit the `.env` file with your actual values:
   ```bash
   nano .env
   ```

3. **Validate Configuration**
   Check that all required variables are properly set:
   ```bash
   npm run validate-env
   ```

## Required Environment Variables

The following variables must be configured for the application to work correctly:

- `MONGODB_URI` - MongoDB connection string
- `RPC_URL` - Blockchain RPC endpoint
- `PRIVATE_KEY` - Wallet private key for blockchain transactions
- `CONTRACT_ADDRESS` - Smart contract address
- `GEMINI_API_KEY` - API key for Gemini AI services
- `IPFS_API_KEY` - API key for IPFS storage
- `JWT_SECRET` - Secret key for JWT token generation

## Moving to a New Computer

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
