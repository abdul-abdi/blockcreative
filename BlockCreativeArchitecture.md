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
- **Authentication**: Reown integration with Supabase for user data
- **Database**: Supabase for storing user data, projects, scripts, etc.
- **Blockchain**: Lisk Sepolia testnet for smart contracts
- **AI Integration**: Gemini API for script analysis
- **Server-side Logic**: Next.js API routes

## Database Schema (Supabase)

### 1. users
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Primary key, references Reown user |
| address | string | Wallet address |
| role | enum | 'writer' or 'producer' |
| created_at | timestamp | User creation timestamp |
| profile_data | jsonb | User profile information (name, bio, etc.) |

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

## Smart Contract Architecture

### 1. ProjectRegistry
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

### 2. ScriptRegistry
**Purpose**: Manages script ownership and metadata
**Storage**:
- Script metadata hashes
- Script ownership information

**Functions**:
- `registerScript(bytes32 scriptHash)`: Registers a new script with metadata hash
- `updateScriptHash(uint256 scriptId, bytes32 newScriptHash)`: Updates script hash

**Events**:
- `ScriptRegistered(uint256 indexed scriptId, address indexed writer, bytes32 scriptHash)`
- `ScriptUpdated(uint256 indexed scriptId, bytes32 newScriptHash)`

### 3. SubmissionManager
**Purpose**: Handles submissions of scripts to projects
**Storage**:
- Mappings between scripts and projects
- Submission status and metadata

**Functions**:
- `submitScript(uint256 scriptId, uint256 projectId, uint256 price, bytes32 submissionHash)`: Submits a script to a project
- `withdrawSubmission(uint256 submissionId)`: Withdraws a pending submission

**Events**:
- `SubmissionCreated(uint256 indexed submissionId, uint256 indexed scriptId, uint256 indexed projectId)`
- `SubmissionWithdrawn(uint256 indexed submissionId)`

### 4. EscrowManager
**Purpose**: Handles funds for projects and payment processing
**Storage**:
- Escrowed funds for projects
- Payment status

**Functions**:
- `fundProject(uint256 projectId)`: Escrows funds for a project
- `releasePayment(uint256 submissionId)`: Releases payment to writer
- `refundProducer(uint256 projectId)`: Refunds producer for unused funds

**Events**:
- `ProjectFunded(uint256 indexed projectId, uint256 amount)`
- `PaymentReleased(uint256 indexed submissionId, address indexed writer, uint256 amount)`
- `RefundIssued(uint256 indexed projectId, address indexed producer, uint256 amount)`

### 5. PlatformFeeManager
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

## API Routes Structure

### 1. User Management
- `GET /api/users`: Get all users or filtered list
- `GET /api/users/[id]`: Get specific user details
- `POST /api/users`: Create new user
- `PUT /api/users/[id]`: Update user information

### 2. Project Management
- `GET /api/projects`: List all projects or filtered list
- `GET /api/projects/[id]`: Get specific project details
- `POST /api/projects`: Create new project
- `PUT /api/projects/[id]`: Update project details
- `GET /api/projects/[id]/submissions`: Get submissions for a project

### 3. Script Management
- `GET /api/scripts`: List all scripts or filtered list
- `GET /api/scripts/[id]`: Get specific script details
- `POST /api/scripts`: Create new script
- `PUT /api/scripts/[id]`: Update script details
- `POST /api/scripts/[id]/analyze`: Trigger AI analysis of a script

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

### 6. AI Integration
- `POST /api/ai/analyze`: Analyze script with Gemini API
- `GET /api/ai/results/[scriptId]`: Get AI analysis results for a script

## Integration Flow Diagrams

### 1. Project Creation Flow
```
Producer UI → API → Supabase → Blockchain
   |                  ↑
   ↓                  |
Notification ← Event Listener
```

1. Producer creates project in UI
2. Backend creates record in Supabase
3. Backend triggers contract creation on blockchain
4. Hash of project data stored on-chain
5. Event listener captures blockchain event
6. Notification sent to producer

### 2. Script Submission Flow
```
Writer UI → API → Supabase → Blockchain
   |          |        ↑
   |          ↓        |
   |      Gemini API   |
   ↓                   |
Notification ← Event Listener
```

1. Writer submits script through UI
2. Backend stores script in Supabase
3. Optional AI analysis with Gemini API
4. Script hash is stored on blockchain
5. Event listener captures blockchain event
6. Notification sent to writer

### 3. Script Purchase Flow
```
Producer UI → API → Blockchain → EscrowManager
                     ↓
                 SubmissionManager
                     |
                     ↓
Writer Notification ← Event Listener
```

1. Producer selects script to purchase
2. Smart contract handles escrow and payment
3. Ownership transfer recorded on blockchain
4. Platform fee collected
5. Event listener captures events
6. Notification sent to writer

## Implementation Roadmap

### Phase 1: Database & Core API
- Set up Supabase database with schema
- Implement user management API
- Implement project and script management API

### Phase 2: Blockchain Integration
- Deploy smart contracts to Lisk Sepolia testnet
- Implement blockchain service for contract interaction
- Create event listeners for blockchain events

### Phase 3: AI Integration
- Implement Gemini API integration
- Create script analysis service
- Store and display analysis results

### Phase 4: Transaction Processing
- Implement escrow system
- Set up payment processing
- Add platform fee collection

### Phase 5: Testing & Optimization
- End-to-end testing
- Performance optimization
- Security audit

## Security Considerations

1. **Authentication & Authorization**
   - Use Reown for secure authentication
   - Implement proper role-based access control
   - Secure API routes with authentication middleware

2. **Data Security**
   - Store sensitive data with encryption
   - Implement proper data validation
   - Regular database backups

3. **Smart Contract Security**
   - Use OpenZeppelin security patterns
   - Conduct thorough contract audits
   - Implement contract upgradability pattern

4. **Transaction Security**
   - Multi-signature requirements for certain operations
   - Rate limiting for API endpoints
   - Monitoring system for suspicious activities

## Monitoring & Maintenance

1. **System Monitoring**
   - Set up logging for API and blockchain operations
   - Implement error tracking system
   - Create dashboard for system health

2. **Analytics**
   - Track user engagement metrics
   - Monitor transaction volumes and success rates
   - Analyze platform usage patterns

3. **Updates & Upgrades**
   - Define process for database schema changes
   - Implement strategy for smart contract upgrades
   - Plan for API version management

## Conclusion

This architecture document provides a comprehensive plan for implementing the BlockCreative backend. The combination of Next.js, Supabase, Lisk blockchain, and Gemini AI creates a robust platform for connecting scriptwriters with producers in a secure and transparent way.

The implementation should follow the outlined phases, with careful attention to security and scalability at each step. Regular reviews and updates to this document will ensure the architecture remains aligned with evolving business requirements. 