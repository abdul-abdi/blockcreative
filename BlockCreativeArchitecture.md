# BlockCreative Architecture Documentation

## Overview

BlockCreative is a platform that connects scriptwriters with producers, leveraging blockchain technology for secure transactions and AI for script analysis. This document outlines the complete architecture of the platform, focusing on the backend implementation while acknowledging the existing frontend components.

## System Architecture

### Frontend (Existing)
- **Framework**: Next.js with React components
- **Authentication**: Reown for user authentication and wallet connection
- **User Roles**: Writer and Producer
- **UI Components**: Dashboards, project management, script submission, etc.

### Backend (Implementation Plan)
- **Authentication**: Reown integration with MongoDB for user data 
- **Database**: MongoDB for storing user data, projects, scripts, etc.
- **Blockchain**: Lisk Sepolia testnet for smart contracts
- **AI Integration**: Gemini API for script analysis
- **Server-side Logic**: Next.js API routes

## Authentication & Onboarding Flow

### Authentication Process
1. **Wallet Connection**:
   - Users connect via Reown using wallet providers or social/email login
   - Wallet address is captured and stored in the user record
   - Role selection during signup (writer or producer)

2. **User Onboarding**:
   - **Writer Onboarding**:
     - Collect profile information (name, bio, portfolio links)
     - Script submission preferences
     - Payment wallet verification
   
   - **Producer Onboarding**:
     - Company/studio details
     - Project creation preferences
     - Funding wallet verification for escrow deposits

3. **Session Management**:
   - JWT-based authentication
   - Role-based access control
   - Wallet address binding to user account

## Blockchain Integration

### NFT Management for Scripts
1. **Script Submission**:
   - When a writer submits a script for a project, an NFT is minted
   - NFT metadata includes script hash and submission details
   - NFT is transferred to the writer's wallet initially

2. **Script Acceptance**:
   - When a producer selects a script, the NFT ownership transfers to producer
   - Smart contract automatically releases payment from escrow
   - Platform fee (3%) is deducted during the transaction

### Project Funding Process
1. **Project Creation**:
   - Producer deposits funds into an escrow smart contract
   - Funds are locked until script selection or project cancellation
   - Project budget and deadline are stored on-chain

2. **Payment Release**:
   - Smart contract automatically releases funds to writer upon script acceptance
   - Platform receives 3% fee from each transaction
   - Transaction history stored both on-chain and in database

### Gas Fee Management
- All gas fees are handled by a central platform wallet
- Private key for the platform wallet stored securely in environment variables
- Gas optimization strategies implemented for cost reduction

## Database Schema (MongoDB)

### 1. users
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key, references Reown user |
| address | string | Wallet address |
| role | enum | 'writer' or 'producer' |
| created_at | timestamp | User creation timestamp |
| profile_data | jsonb | User profile information (name, bio, etc.) |
| onboarding_completed | boolean | Whether user completed onboarding |
| onboarding_step | integer | Current onboarding step |

### 2. projects
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| producer_id | UUID (FK) | Foreign key to users table |
| title | string | Project title |
| description | text | Project description |
| budget | decimal | Project budget |
| deadline | timestamp | Project deadline |
| requirements | jsonb | Project requirements as JSON array |
| status | enum | 'open', 'closed', 'completed' |
| created_at | timestamp | Project creation timestamp |
| contract_address | string | Reference to on-chain project contract |
| project_hash | string | Project data hash stored on-chain |
| escrow_funded | boolean | Whether escrow has been funded |
| escrow_transaction_hash | string | Transaction hash of escrow funding |

### 3. scripts
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| writer_id | UUID (FK) | Foreign key to users table |
| title | string | Script title |
| content | text | Script content or file reference |
| created_at | timestamp | Script creation timestamp |
| updated_at | timestamp | Script last update timestamp |
| script_hash | string | Script content hash stored on-chain |
| status | enum | 'draft', 'submitted', 'sold', 'rejected' |
| nft_token_id | string | Token ID of the minted NFT |
| nft_contract_address | string | Contract address of the NFT |

### 4. submissions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| script_id | UUID (FK) | Foreign key to scripts table |
| project_id | UUID (FK) | Foreign key to projects table |
| submitted_at | timestamp | Submission timestamp |
| price | decimal | Price proposed by writer |
| status | enum | 'pending', 'accepted', 'rejected' |
| ai_score | jsonb | AI analysis results |
| submission_hash | string | Submission data hash stored on-chain |
| nft_transfer_transaction | string | Transaction hash of NFT transfer |

### 5. transactions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key |
| submission_id | UUID (FK) | Foreign key to submissions table |
| transaction_hash | string | Blockchain transaction hash |
| amount | decimal | Transaction amount |
| status | enum | 'pending', 'completed', 'failed' |
| created_at | timestamp | Transaction timestamp |
| platform_fee_amount | decimal | Platform fee amount (3%) |
| gas_fee_amount | decimal | Gas fee paid by platform |
| recipient_address | string | Recipient wallet address |
| sender_address | string | Sender wallet address |

## Smart Contract Architecture

### 1. ScriptNFT
**Purpose**: NFT contract to represent script ownership
**Storage**:
- NFT metadata and ownership information
- Script submission details

**Functions**:
- `mintScriptNFT(address recipient, bytes32 scriptHash, uint256 submissionId)`: Mints a new NFT for a script
- `transferOwnership(uint256 tokenId, address to)`: Transfers NFT ownership
- `getScriptDetails(uint256 tokenId)`: Returns script metadata

**Events**:
- `ScriptNFTMinted(uint256 indexed tokenId, address indexed recipient, bytes32 scriptHash)`
- `OwnershipTransferred(uint256 indexed tokenId, address indexed from, address indexed to)`

### 2. ProjectRegistry
**Purpose**: Manages the creation and lifecycle of projects
**Storage**:
- Project metadata hashes
- Project status

**Functions**:
- `createProject(bytes32 projectHash)`: Creates a new project with metadata hash
- `closeProject(uint256 projectId)`: Closes project to new submissions
- `completeProject(uint256 projectId)`: Marks project as completed

**Events**:
- `ProjectCreated(uint256 indexed projectId, address indexed producer, bytes32 projectHash)`
- `ProjectClosed(uint256 indexed projectId)`
- `ProjectCompleted(uint256 indexed projectId)`

### 3. EscrowManager
**Purpose**: Handles funds for projects and payment processing
**Storage**:
- Escrowed funds for projects
- Payment status

**Functions**:
- `fundProject(uint256 projectId)`: Escrows funds for a project
- `releasePayment(uint256 submissionId, address writer, address producer)`: Releases payment to writer and transfers NFT
- `refundProducer(uint256 projectId)`: Refunds producer for unused funds

**Events**:
- `ProjectFunded(uint256 indexed projectId, uint256 amount)`
- `PaymentReleased(uint256 indexed submissionId, address indexed writer, uint256 amount)`
- `RefundIssued(uint256 indexed projectId, address indexed producer, uint256 amount)`

### 4. PlatformFeeManager
**Purpose**: Manages platform fees
**Storage**:
- Accumulated platform fees
- Withdrawal history

**Functions**:
- `collectFee(uint256 amount)`: Collects platform fee from transaction
- `withdrawFees(address recipient, uint256 amount)`: Withdraws collected fees

**Events**:
- `FeeCollected(uint256 amount)`
- `FeeWithdrawn(address indexed recipient, uint256 amount)`

## Onboarding API Routes

### Writer Onboarding
- `POST /api/onboarding/writer/profile`: Update writer profile information
- `POST /api/onboarding/writer/portfolio`: Add portfolio and writing samples
- `POST /api/onboarding/writer/preferences`: Set writer preferences
- `POST /api/onboarding/writer/complete`: Mark onboarding as complete

### Producer Onboarding
- `POST /api/onboarding/producer/company`: Update producer company details
- `POST /api/onboarding/producer/funding`: Verify funding wallet
- `POST /api/onboarding/producer/preferences`: Set producer preferences
- `POST /api/onboarding/producer/complete`: Mark onboarding as complete

## API Routes Structure

### 1. User Management
- `GET /api/users`: Get all users or filtered list
- `GET /api/users/[id]`: Get specific user details
- `POST /api/users`: Create new user
- `PUT /api/users/[id]`: Update user information
- `GET /api/users/me`: Get current user details

### 2. Project Management
- `GET /api/projects`: List all projects or filtered list
- `GET /api/projects/[id]`: Get specific project details
- `POST /api/projects`: Create new project
- `PUT /api/projects/[id]`: Update project details
- `GET /api/projects/[id]/submissions`: Get submissions for a project
- `POST /api/projects/[id]/fund`: Fund project escrow

### 3. Script Management
- `GET /api/scripts`: List all scripts or filtered list
- `GET /api/scripts/[id]`: Get specific script details
- `POST /api/scripts`: Create new script
- `PUT /api/scripts/[id]`: Update script details
- `POST /api/scripts/[id]/analyze`: Trigger AI analysis of a script
- `POST /api/scripts/[id]/mint`: Mint NFT for script

### 4. Submission Management
- `GET /api/submissions`: List all submissions or filtered list
- `GET /api/submissions/[id]`: Get specific submission details
- `POST /api/submissions`: Create new submission
- `PUT /api/submissions/[id]`: Update submission status
- `POST /api/submissions/[id]/accept`: Accept a submission (triggers blockchain transaction)

### 5. Blockchain Integration
- `POST /api/blockchain/projects`: Create project on blockchain
- `POST /api/blockchain/scripts`: Register script on blockchain
- `POST /api/blockchain/transactions`: Handle blockchain transactions
- `GET /api/blockchain/status/[txHash]`: Check transaction status
- `POST /api/blockchain/escrow/fund`: Fund escrow for a project
- `POST /api/blockchain/nft/mint`: Mint NFT for a script
- `POST /api/blockchain/nft/transfer`: Transfer NFT ownership

### 6. AI Integration
- `POST /api/ai/analyze`: Analyze script with Gemini API
- `GET /api/ai/results/[scriptId]`: Get AI analysis results for a script

## Integration Flow Diagrams

### 1. Project Creation Flow
```
Producer UI → API → MongoDB → Blockchain
   |                  ↑
   ↓                  |
Notification ← Event Listener
```

1. Producer creates project in UI
2. Backend creates record in MongoDB
3. Backend triggers contract creation on blockchain
4. Hash of project data stored on-chain
5. Project escrow is funded by producer
6. Event listener captures blockchain event
7. Notification sent to producer

### 2. Script Submission Flow
```
Writer UI → API → MongoDB → Blockchain
   |          |        ↑
   |          ↓        |
   |      Gemini API   |
   ↓                   |
Notification ← Event Listener
```

1. Writer submits script through UI
2. Backend stores script in MongoDB
3. AI analysis with Gemini API
4. NFT is minted for the script
5. Script hash is stored on blockchain
6. Event listener captures blockchain event
7. Notification sent to writer and producer

### 3. Script Purchase Flow
```
Producer UI → API → Blockchain → EscrowManager → ScriptNFT
                     |               |              |
                     ↓               ↓              ↓
          Producer Notification   Payment    Ownership Transfer
                                    ↓
                                 Writer
```

1. Producer selects script to purchase
2. Smart contract handles escrow and payment
3. Script NFT transferred from writer to producer
4. 3% platform fee collected
5. Transaction recorded in database
6. Notifications sent to writer and producer

## Implementation Roadmap

### Phase 1: Database & Core API
- Set up MongoDB database with schema
- Implement user management API
- Implement Reown integration for auth
- Create onboarding flows for writers and producers

### Phase 2: Blockchain Integration
- Deploy smart contracts to Lisk Sepolia testnet
- Implement ScriptNFT contract for NFT minting
- Create EscrowManager for fund management
- Implement platform fee collection

### Phase 3: AI Integration
- Implement Gemini API integration
- Create script analysis service
- Store and display analysis results

### Phase 4: Transaction Processing
- Implement escrow funding system
- Set up payment processing
- Add NFT transfer mechanism

### Phase 5: Testing & Optimization
- End-to-end testing
- Performance optimization
- Security audit

## Security Considerations

1. **Authentication & Authorization**
   - Use Reown for secure authentication
   - Implement proper role-based access control
   - Secure API routes with authentication middleware

2. **Smart Contract Security**
   - Use OpenZeppelin security patterns
   - Conduct thorough contract audits
   - Implement contract upgradability pattern

3. **Gas Fee Management**
   - Central wallet for gas fee handling
   - Monitoring system for gas usage
   - Fallback mechanisms for failed transactions

4. **Private Key Security**
   - Secure storage of platform wallet private key
   - Key rotation policies
   - Multi-signature requirements for high-value operations

## Monitoring & Maintenance

1. **System Monitoring**
   - Set up logging for API and blockchain operations
   - Implement error tracking system
   - Create dashboard for system health

2. **Smart Contract Monitoring**
   - Event listeners for contract events
   - Transaction monitoring
   - Gas price monitoring

## Conclusion

This architecture document provides a comprehensive plan for implementing the BlockCreative platform. The integration of Next.js, MongoDB, Lisk blockchain, and Gemini AI creates a robust platform that connects scriptwriters with producers securely and transparently.

The NFT-based ownership system ensures that scripts are properly tracked and transferred, while the escrow system guarantees secure payments. The platform fee mechanism ensures sustainability while providing value to both writers and producers.

The implementation should follow the outlined phases, with careful attention to security and scalability at each step. 
