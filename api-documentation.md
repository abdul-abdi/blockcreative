# BlockCreative API Documentation

This document provides a comprehensive overview of all API endpoints in the BlockCreative application.

## 1. User Management APIs

### `/api/users`
- **GET**: Lists users with optional role filtering
- **POST**: Creates or updates users with wallet addresses, handles conflicts for existing addresses
  - Validates wallet address and normalizes to lowercase
  - Checks for existing users to prevent duplicates
  - Sets up default profile data based on user role
  - Returns appropriate status codes for conflicts

### `/api/users/me`
- **GET**: Fetches the current authenticated user's profile
- **PUT**: Updates the current user's account information

### `/api/users/me/profile`
- **GET**: Retrieves the current user's profile data
- **PUT**: Updates the current user's profile data
- Handles profile updates for both writer and producer roles

### `/api/users/[id]`
- **GET**: Fetches a specific user profile by ID
- **PUT**: Updates a specific user's profile
- **DELETE**: Removes a user account
- Enforces authorization rules based on the requestor's role

## 2. Authentication & Onboarding

### `/api/onboarding/writer`
- **POST**: Handles writer onboarding process (201 lines)
- Collects and validates writer-specific profile information

### `/api/onboarding/producer`
- **POST**: Handles producer onboarding process (150 lines)
- Collects and validates producer-specific profile information

### `/api/onboarding/complete`
- **POST**: Completes user onboarding (62 lines)
- Marks onboarding as complete and updates user record

## 3. Project Management

### `/api/projects`
- **GET**: Lists projects with optional filtering by status or producer
- **POST**: Creates new projects, including:
  - Generating a project hash for blockchain verification
  - Registering the project on the blockchain
  - Creating appropriate database records
  - Starting tracking of blockchain transaction

### `/api/projects/[id]`
- **GET**: Retrieves individual project details
- **PUT**: Updates a specific project's details
- **DELETE**: Removes a project (if permitted)
- Handles CRUD operations for a specific project

### `/api/projects/[id]/fund`
- **POST**: Initiates funding for a specific project's escrow

### `/api/projects/[id]/submissions`
- **GET**: Fetches submissions related to a specific project
- **POST**: Creates a new submission for a project
- Handles filtering and pagination of submissions

### `/api/projects/[id]/submissions/[submissionId]`
- **GET**: Retrieves details for a specific submission
- **PUT**: Updates a specific submission
- **DELETE**: Removes a submission
- Manages specific submission details and status

### `/api/projects/[id]/submissions/[submissionId]/purchase`
- **POST**: Initiates the purchase of a specific submission
- Handles the financial transaction and NFT transfer

## 4. Submission Management

### `/api/submissions`
- **GET**: Fetches submissions with role-based filtering:
  - Writers see only their own submissions
  - Producers see submissions to their projects
- **POST**: Creates new script submissions:
  - Validates project status
  - Performs AI analysis on content
  - Ensures writers don't submit multiple scripts to same project

### `/api/submissions/[id]/accept`
- **POST**: Processes a producer's acceptance of a writer's submission
- Process includes:
  - Verifying producer ownership of the project
  - Checking that project escrow is funded
  - Minting an NFT for the script if not already minted
  - Processing payment to the writer with a 3% platform fee
  - Creating transaction records
  - Updating submission and script statuses

## 5. Script Management

### `/api/scripts`
- **GET**: Retrieves scripts with optional filtering
- **POST**: Creates new script entries
- API for script management and manipulation

### `/api/writer/scripts/analyze`
- **POST**: Performs AI-powered analysis of writer scripts
- Provides feedback on script quality and adherence to requirements

## 6. Blockchain Integration

### `/api/blockchain`
- **GET**: Retrieves blockchain configuration and status
- **POST**: Executes blockchain operations
- Main blockchain interaction API

### `/api/blockchain/test`
- **GET**: Tests blockchain connectivity and contract functionality
- Used for verifying blockchain setup is working correctly

### `/api/blockchain/transactions`
- **GET**: Retrieves blockchain transaction history
- **POST**: Creates new blockchain transactions
- Tracks and manages all blockchain transactions

### `/api/blockchain/escrow/fund`
- **POST**: Funds escrow contracts for projects
- Handles the process of securing funds for a project

### `/api/blockchain/escrow/refund`
- **POST**: Processes refunds from escrow contracts
- Handles returning funds if projects are cancelled

### `/api/blockchain/project-status`
- **GET**: Checks a project's status on the blockchain
- Verifies on-chain status matches database records

### `/api/blockchain/status`
- **GET**: Checks blockchain connection status
- Verifies connectivity to the blockchain network

### `/api/blockchain/status/[txHash]`
- **GET**: Checks status of a specific transaction
- Polls for transaction confirmation and updates database accordingly

## 7. NFT Management

### `/api/nft/mint`
- **POST**: Mints a new NFT for a script
- Creates NFTs representing script ownership

## 8. AI Services

### `/api/ai/analyze`
- **POST**: Performs AI analysis of content
- Evaluates script quality and provides feedback

### `/api/ai/synopsis`
- **POST**: Generates AI-powered synopsis
- Creates summaries of scripts for easier review

## 9. System Health

### `/api/health`
- **GET**: Performs system health check
- Verifies:
  - API availability
  - Database connection status
  - Blockchain connection and network validity
  - AI service (Gemini) availability
- Returns detailed component status with appropriate HTTP codes

## 10. Testing & Development

### `/api/test`
- **GET**: Testing endpoint
- Used for development and debugging purposes

## Architecture Summary

The API structure follows RESTful principles with:
- Role-based authorization (writer vs producer)
- Comprehensive error handling
- Blockchain integration for projects, transactions, and NFTs
- AI capabilities for content analysis
- Nested routes for resource-specific actions
- Proper transaction management and escrow handling 