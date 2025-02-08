# BlockCreative Application Routes & User Journey

## Public Routes
- `/` - Landing page (existing)
- `/signin` - Sign in page
- `/signup` - Sign up page
- `/pricing` - Detailed pricing page
- `/about` - About us page
- `/contact` - Contact page
- `/blog` - Blog listing
- `/blog/[slug]` - Individual blog posts
- `/terms` - Terms of service
- `/privacy` - Privacy policy

## Authentication Flow
- `/auth/verify-email` - Email verification
- `/auth/reset-password` - Password reset
- `/auth/forgot-password` - Password recovery

## Writer Routes (`/writer/`)
1. Dashboard
   - `/writer/dashboard` - Overview with stats
   - `/writer/scripts` - Script management
   - `/writer/scripts/[id]` - Individual script view/edit
   - `/writer/submissions` - Submission history
   - `/writer/earnings` - Earnings & payments
   - `/writer/profile` - Profile management
   - `/writer/settings` - Account settings

2. Script Creation
   - `/writer/scripts/new` - New script creation
   - `/writer/scripts/[id]/edit` - Script editor
   - `/writer/scripts/[id]/preview` - Preview mode
   - `/writer/scripts/[id]/submit` - Submission flow

3. Opportunities
   - `/writer/opportunities` - Available projects
   - `/writer/opportunities/[id]` - Project details
   - `/writer/applications` - Project applications

## Producer Routes (`/producer/`)
1. Dashboard
   - `/producer/dashboard` - Overview with stats
   - `/producer/projects` - Project management
   - `/producer/projects/[id]` - Individual project view
   - `/producer/submissions` - Received submissions
   - `/producer/contracts` - Contract management
   - `/producer/profile` - Company profile
   - `/producer/settings` - Account settings

2. Project Management
   - `/producer/projects/new` - Create new project
   - `/producer/projects/[id]/edit` - Edit project
   - `/producer/projects/[id]/submissions` - View submissions
   - `/producer/projects/[id]/analytics` - Project analytics

3. Talent Management
   - `/producer/writers` - Writer directory
   - `/producer/writers/[id]` - Writer profile
   - `/producer/favorites` - Favorite writers

## Admin Routes (`/admin/`)
1. Dashboard
   - `/admin/dashboard` - Admin overview
   - `/admin/users` - User management
   - `/admin/projects` - Project oversight
   - `/admin/scripts` - Script management
   - `/admin/reports` - Analytics & reporting
   - `/admin/settings` - Platform settings

2. Content Management
   - `/admin/blog` - Blog management
   - `/admin/announcements` - Platform announcements
   - `/admin/categories` - Category management

3. System Management
   - `/admin/ai-models` - AI model management
   - `/admin/blockchain` - Blockchain operations
   - `/admin/logs` - System logs

## API Routes (`/api/`)
1. Authentication
   - `/api/auth/*` - Auth endpoints

2. Writers
   - `/api/writer/*` - Writer-specific endpoints
   - `/api/scripts/*` - Script management
   - `/api/submissions/*` - Submission handling

3. Producers
   - `/api/producer/*` - Producer-specific endpoints
   - `/api/projects/*` - Project management
   - `/api/contracts/*` - Contract operations

4. Admin
   - `/api/admin/*` - Admin operations
   - `/api/analytics/*` - Analytics data
   - `/api/system/*` - System operations

## Shared Features
1. Messaging System
   - `/messages` - Message center
   - `/messages/[id]` - Conversation view

2. Notifications
   - `/notifications` - Notification center
   - `/notifications/settings` - Notification preferences

3. Blockchain Integration
   - `/wallet` - Wallet connection
   - `/transactions` - Transaction history
   - `/contracts` - Smart contract interaction

## User Journey Flows

### Writer Journey
1. Onboarding
   - Sign up
   - Email verification
   - Profile completion
   - Portfolio setup

2. Script Creation
   - Create new script
   - Use AI assistance
   - Save drafts
   - Preview & format

3. Submission Process
   - Find opportunities
   - Submit scripts
   - Track status
   - Receive feedback

4. Collaboration
   - Communicate with producers
   - Review contracts
   - Make revisions
   - Receive payments

### Producer Journey
1. Onboarding
   - Company registration
   - Verification
   - Team setup
   - Project preferences

2. Project Creation
   - Create project brief
   - Set requirements
   - Define budget
   - Launch project

3. Script Review
   - Receive submissions
   - AI-powered ranking
   - Review scripts
   - Provide feedback

4. Collaboration
   - Contact writers
   - Negotiate terms
   - Manage contracts
   - Process payments

### Admin Journey
1. Platform Management
   - Monitor activity
   - Manage users
   - Handle disputes
   - System maintenance

2. Content Oversight
   - Review submissions
   - Moderate content
   - Manage categories
   - Update blog

3. Analytics & Reporting
   - Track metrics
   - Generate reports
   - Monitor performance
   - Optimize system 