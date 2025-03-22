# BlockCreative System Documentation

This document provides a comprehensive explanation of the system architecture for BlockCreative, focusing on the core components in the `/src/lib`, `/src/models`, `/src/contracts` directories, and the middleware implementation.

## Table of Contents

1. [System Overview](#system-overview)
2. [Middleware](#middleware)
3. [Library Modules](#library-modules)
4. [Data Models](#data-models)
5. [Smart Contracts](#smart-contracts)
6. [Authentication Flow](#authentication-flow)
7. [Blockchain Integration](#blockchain-integration)
8. [AI Integration](#ai-integration)

## System Overview

BlockCreative is a web3 platform that connects writers and producers for script/content creation, leveraging blockchain technology for transparency, ownership verification, and payments. The application uses:

- **Next.js** for the frontend and API routes
- **MongoDB** for data storage
- **Lisk blockchain** for smart contract integration
- **NFTs** for representing script ownership
- **Role-based access control** for writers and producers
- **AI-powered analytics** for script evaluation and enhancement

## Middleware

### `src/middleware.ts`

The middleware acts as a global request processor that runs before routes are handled.

**Functionality:**
- Extracts wallet address and user role from cookies/headers
- Passes authentication details via headers to API routes
- Adds CORS headers for cross-origin requests in production
- Provides detailed debugging information in development mode

**Implementation details:**
- Uses Next.js middleware pattern with `NextResponse.next()`
- Configured to run on specific routes via the `matcher` configuration:
  - Authentication routes (/signin, /signup)
  - Dashboard paths (/writer/*, /producer/*)
  - User API routes (/api/users/*, /api/onboarding/*)
- Gracefully handles errors to prevent breaking the request flow

## Library Modules

### `src/lib/api-middleware.ts`

A higher-order function that wraps API route handlers to provide common functionality.

**Key features:**
- Authentication verification using wallet addresses
- Role-based access control (writer, producer, admin)
- Database connection management
- Rate limiting with configurable thresholds
- Standardized error handling

**Usage pattern:**
```typescript
export const GET = withApiMiddleware(handler, {
  requireAuth: true,
  connectDb: true,
  rateLimitType: 'default'
});
```

### `src/lib/rateLimit.ts`

Implements API rate limiting to prevent abuse.

**Features:**
- In-memory storage for tracking request rates
- Different limit configurations based on endpoint type:
  - `default`: 60 requests per minute
  - `strict`: 20 requests per minute 
  - `userMe`: 120 requests per minute
  - `auth`: 20 requests per minute
- Automatic cleanup of expired entries
- Configurable response messages

### `src/lib/mongodb.ts`

Manages database connections optimized for serverless environments.

**Key features:**
- Connection pooling to avoid exhausting connections
- Global cache to reuse existing connections
- Automatic reconnection handling
- Connection status monitoring
- Configuration optimized for serverless execution (connection limits, timeouts)

### `src/lib/api-error.ts`

Provides standardized error handling throughout the API.

**Features:**
- Enumerated error types for consistency (validation, authentication, blockchain, etc.)
- Automatic mapping of error types to appropriate HTTP status codes
- Structured error response format with metadata support
- Environment-sensitive error logging

### `src/lib/blockchain.ts`

Core module for blockchain integration, handling all interactions with smart contracts.

**Key functionality:**
- Provider and wallet initialization
- Contract instantiation and caching
- Connection status management and recovery
- Network validation
- Implementation of contract-specific operations:
  - `mintScriptNFT`: Creates NFT for script ownership
  - `transferNFTOwnership`: Transfers script ownership
  - `createProject`: Registers new project on-chain
  - `fundProjectEscrow`: Secures funds for project
  - `releasePayment`: Pays writers when scripts are purchased
  - `refundProducer`: Returns funds if project is cancelled
  - `getTransactionStatus`: Checks transaction confirmation

## Data Models

### `src/models/User.ts`

Represents users in the system with role-based permissions.

**Schema fields:**
- `id`: Unique identifier (UUID)
- `address`: Ethereum wallet address (lowercase, indexed)
- `role`: User role (writer, producer, admin)
- `profile_data`: User profile information (name, bio, social links)
- `wallet_data`: Wallet connection information
- `auth_method`: Authentication method (wallet, email, social)
- `onboarding_completed`: Flag indicating onboarding status
- `onboarding_step`: Current step in onboarding flow
- `app_kit_user_id`: External authentication ID

**Features:**
- Pre-save hook to normalize wallet addresses to lowercase
- Indexed fields for performance
- Support for different authentication methods
- Separation between authentication and profile data

### `src/models/Project.ts`

Represents content creation projects posted by producers.

**Schema fields:**
- `projectId`: Unique identifier (UUID)
- `producer`: Reference to producer user
- `title`, `description`: Project details
- `requirements`: Project requirements
- `budget`: Project budget
- `deadline`: Project deadline
- `status`: Current project status (draft, published, funded, completed, cancelled)
- `is_funded`: Flag indicating funding status
- `contract_address`: Associated blockchain contract
- `blockchain_data`: Data related to blockchain transactions
- `onChain`: Flag indicating on-chain registration

### `src/models/Script.ts`

Represents scripts created by writers.

**Schema fields:**
- `id`: Unique identifier
- `writer_id`: Reference to writer user
- `title`: Script title
- `content`: Actual script content
- `script_hash`: Hash of script content for blockchain verification
- `status`: Script status (draft, submitted, sold, rejected)
- `ai_synopsis`: AI-generated analysis of the script
- `last_synopsis_at`: Timestamp of last AI analysis

### `src/models/Submission.ts`

Represents a script submitted to a project.

**Schema fields:**
- `id`: Unique identifier
- `project_id`: Reference to project
- `writer_id`: Reference to writer
- `title`: Submission title
- `content`: Submission content
- `status`: Submission status (pending, approved, rejected)
- `feedback`: Producer feedback
- `analysis`: AI analysis results
- `is_purchased`: Purchase status
- `nft_minted`: NFT minting status
- `nft_token_id`: Associated NFT token ID
- `nft_metadata`: NFT metadata

### `src/models/Transaction.ts`

Records blockchain transactions.

**Schema fields:**
- `id`: Unique identifier
- `transaction_hash`: Blockchain transaction hash
- `transaction_type`: Type of transaction (project_funding, script_purchase, nft_minting)
- `user_id`: User who initiated transaction
- `project_id`: Associated project
- `submission_id`: Associated submission
- `recipient_id`: Transaction recipient
- `amount`: Transaction amount
- `status`: Transaction status (pending, verified, failed)

## Smart Contracts

### `src/contracts/EscrowManager.json`

Manages escrow funds for projects.

**Key functions:**
- `fundProject`: Locks funds for a project
- `getProjectFunds`: Retrieves current funding for a project
- `refundProducer`: Returns funds to producer if needed
- `releasePayment`: Transfers payment to writer when script is purchased

**Events:**
- `ProjectFunded`: Emitted when project receives funding
- `PaymentReleased`: Emitted when payment is sent to writer
- `RefundIssued`: Emitted when funds are returned to producer

### `src/contracts/ProjectRegistry.json`

Manages project registration and lifecycle.

**Key functions:**
- `createProject`: Registers new project with a hash
- `getProject`: Retrieves project details
- `closeProject`: Marks project as closed
- `completeProject`: Marks project as completed
- `getProducerProjects`: Gets all projects for a producer

**Events:**
- `ProjectCreated`: Emitted when new project is registered
- `ProjectClosed`: Emitted when project is closed
- `ProjectCompleted`: Emitted when project is completed

### `src/contracts/ScriptNFT.json`

ERC-721 NFT contract representing script ownership.

**Key functions:**
- `mintScriptNFT`: Creates a new NFT for a script
- `getScriptDetails`: Retrieves script hash and submission ID for a token
- Standard ERC-721 functions: `balanceOf`, `ownerOf`, `safeTransferFrom`, etc.

**Features:**
- Represents verified script ownership
- Enables ownership transfer when scripts are purchased
- Links on-chain tokens to off-chain script content via hashes

## Authentication Flow

The system uses wallet-based authentication with the following flow:

1. User connects wallet through frontend integration
2. Wallet address is sent to API and verified
3. Address is stored in cookies for session persistence
4. Middleware extracts address from cookies/headers
5. API middleware verifies user exists in database with given address
6. Role-based access control is applied based on user role

## Blockchain Integration

The blockchain integration follows these principles:

1. **Separation of concerns**:
   - On-chain data: Ownership, proofs, payments
   - Off-chain data: Content, metadata, user information

2. **Transaction lifecycle**:
   - Transaction initiated in API
   - Sent to blockchain through provider
   - Monitored for confirmation
   - Status updated in database

3. **Error handling and recovery**:
   - Connection monitoring and automatic reconnection
   - Transaction status verification
   - Gas fee management
   - Structured error responses

4. **Security considerations**:
   - Private keys managed securely on server
   - Transaction authorization checks
   - Network validation to prevent wrong chain connections

## AI Integration

BlockCreative incorporates AI capabilities to enhance script creation, analysis, and marketability evaluation. These features provide valuable insights to both writers and producers.

### `src/lib/ai.ts`

Provides script analysis functionality using AI.

**Key components:**
- `AIScriptAnalysis` interface defining AI analysis result structure
- `analyzeScript` function that processes script content and returns detailed analysis
- Evaluates scripts based on multiple criteria:
  - Overall quality (0-100)
  - Creativity (0-100)
  - Structure (0-100)
  - Character development (0-100)
  - Marketability (0-100)
- Generates comprehensive feedback including:
  - Detailed analysis text (300-500 words)
  - Script strengths (3-5 points)
  - Areas for improvement (3-5 points)
  - Relevant keywords/tags (5-8 tags)
- Considers project requirements in the analysis when provided
- Uses helper functions to extract structured data from AI responses

### `src/lib/gemini.ts`

Manages interactions with Google's Gemini AI model.

**Key features:**
- Configurable AI client setup using Google Generative AI SDK
- In-memory caching system for AI analysis results
- Exponential backoff retry mechanism for failed API calls
- Content generation with safety settings
- Specialized script analysis functionality:
  - `ScriptAnalysisResult` interface defining comprehensive analysis structure
  - Caching mechanisms with configurable TTL (Time To Live)
  - Synopsis generation for script marketing

**Script analysis components:**
- Summary generation
- Structure evaluation (score + feedback)
- Character analysis (score, feedback, character identification)
- Dialogue assessment (score + feedback)
- Pacing evaluation (score + feedback)
- Market potential analysis:
  - Score and feedback
  - Target audience identification
  - Genre classification

**Synopsis generation:**
- Title suggestions
- Logline creation (one-sentence summary)
- Full synopsis development
- Target audience identification
- Tone analysis
- Theme extraction

**Error handling and optimization:**
- Rate limiting management
- Retry logic with exponential backoff
- Caching to reduce API costs and improve response time
- Parsing logic to extract structured data from AI responses

### API Endpoints for AI

The application includes dedicated API endpoints that utilize these AI capabilities:

- `/api/ai/analyze` - Analyzes script content using AI models
- `/api/ai/synopsis` - Generates marketing synopsis for scripts
- `/api/writer/scripts/analyze` - Writer-specific script analysis

### AI Integration in Submission Flow

The AI analysis is integrated into the submission workflow:
1. Writer creates a script
2. Upon submission, `analyzeScript` is called automatically
3. Analysis results are stored with the submission
4. Producers can view AI insights when evaluating submissions
5. Writers receive feedback to potentially improve their scripts

This AI integration adds significant value to the platform by providing:
- Objective evaluation metrics for script quality
- Insights for writers to improve their work
- Decision support for producers selecting scripts
- Marketability assessment for commercial potential 