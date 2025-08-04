#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Function to validate environment variables
function validateEnvironment() {
  console.log('Validating environment variables...\n');
  
  // Required environment variables
  const requiredVariables = [
    { name: 'MONGODB_URI', description: 'MongoDB connection string' },
    { name: 'RPC_URL', description: 'Blockchain RPC endpoint' },
    { name: 'PRIVATE_KEY', description: 'Wallet private key for blockchain transactions' },
    { name: 'CONTRACT_ADDRESS', description: 'Smart contract address' },
    { name: 'GEMINI_API_KEY', description: 'API key for Gemini AI services' },
    { name: 'IPFS_API_KEY', description: 'API key for IPFS storage' },
    { name: 'JWT_SECRET', description: 'Secret key for JWT token generation' }
  ];
  
  // Optional environment variables (nice to have)
  const optionalVariables = [
    { name: 'PORT', description: 'Server port (default: 3000)' },
    { name: 'NODE_ENV', description: 'Environment type (development/production)' },
    { name: 'WALLET_ENCRYPTION_KEY', description: 'Key for encrypting wallet data' }
  ];
  
  let missingRequired = [];
  let missingOptional = [];
  let presentVariables = [];
  
  // Check required variables
  requiredVariables.forEach(variable => {
    if (process.env[variable.name]) {
      presentVariables.push(variable);
    } else {
      missingRequired.push(variable);
    }
  });
  
  // Check optional variables
  optionalVariables.forEach(variable => {
    if (!process.env[variable.name]) {
      missingOptional.push(variable);
    }
  });
  
  // Display results
  console.log('=== REQUIRED VARIABLES ===');
  if (presentVariables.length > 0) {
    console.log('✓ Present:');
    presentVariables.forEach(variable => {
      console.log(`  ${variable.name}: ${maskValue(process.env[variable.name])}`);
    });
  }
  
  if (missingRequired.length > 0) {
    console.log('\n✗ Missing (Required):');
    missingRequired.forEach(variable => {
      console.log(`  ${variable.name}: ${variable.description}`);
    });
  }
  
  console.log('\n=== OPTIONAL VARIABLES ===');
  if (missingOptional.length > 0) {
    console.log('○ Not set (Optional):');
    missingOptional.forEach(variable => {
      console.log(`  ${variable.name}: ${variable.description}`);
    });
  }
  
  // Overall status
  console.log('\n=== VALIDATION RESULT ===');
  if (missingRequired.length === 0) {
    console.log('✓ All required environment variables are properly configured!');
    console.log('✓ Application should run without issues.');
  } else {
    console.log('✗ Some required environment variables are missing.');
    console.log('✗ Please update your .env file with the missing values.');
    process.exit(1);
  }
}

// Function to mask sensitive values for display
function maskValue(value) {
  if (!value) return 'Not set';
  
  // Don't mask short values or localhost
  if (value.length < 10 || value.includes('localhost')) {
    return value;
  }
  
  // Mask sensitive values (keep first 4 and last 4 characters)
  if (value.length > 8) {
    const start = value.substring(0, 4);
    const end = value.substring(value.length - 4);
    return `${start}...${end}`;
  }
  
  return 'Value set (hidden)';
}

// Main execution
function main() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('Error: .env file not found!');
    console.log('Please run "npm run setup-env" to create it from the template.');
    process.exit(1);
  }
  
  validateEnvironment();
}

main();
