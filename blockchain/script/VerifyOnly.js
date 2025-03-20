#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const ENV_FILE = path.join(__dirname, '..', '.env');
dotenv.config({ path: ENV_FILE });

// Network configuration (default to Lisk Sepolia testnet)
const NETWORK = process.env.DEPLOY_NETWORK || 'lisk_sepolia';
const BLOCKSCOUT_API_URL = NETWORK === 'lisk_sepolia' 
  ? 'https://sepolia-blockscout.lisk.com' 
  : 'https://blockscout.lisk.com';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Check if required env variables are set
function checkEnvVariables() {
  console.log(`${colors.blue}Checking environment variables...${colors.reset}`);
  
  const requiredVars = [
    'SCRIPT_NFT_ADDRESS', 
    'PROJECT_REGISTRY_ADDRESS', 
    'PLATFORM_FEE_MANAGER_ADDRESS', 
    'ESCROW_MANAGER_ADDRESS'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`${colors.red}Error: Missing required contract addresses: ${missingVars.join(', ')}${colors.reset}`);
    console.error(`${colors.yellow}Please set these variables in your .env file${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.green}✓ All required environment variables are set${colors.reset}`);
}

// Verify contracts on Blockscout
function verifyContracts() {
  console.log(`${colors.magenta}=== Verifying Contracts on Blockscout (${NETWORK}) ====${colors.reset}`);
  console.log(`${colors.blue}Chain ID: ${NETWORK === 'lisk_sepolia' ? 4202 : 4201}${colors.reset}`);
  console.log(`${colors.blue}Blockscout URL: ${BLOCKSCOUT_API_URL}${colors.reset}`);
  console.log();
  
  const contracts = [
    { 
      name: 'ScriptNFT', 
      address: process.env.SCRIPT_NFT_ADDRESS, 
      constructorArgs: '' 
    },
    { 
      name: 'ProjectRegistry', 
      address: process.env.PROJECT_REGISTRY_ADDRESS, 
      constructorArgs: '' 
    },
    { 
      name: 'PlatformFeeManager', 
      address: process.env.PLATFORM_FEE_MANAGER_ADDRESS, 
      constructorArgs: '' 
    },
    { 
      name: 'EscrowManager', 
      address: process.env.ESCROW_MANAGER_ADDRESS, 
      hasConstructorArgs: true,
      argsFormatted: false
    }
  ];
  
  for (const contract of contracts) {
    if (!contract.address) continue;
    
    try {
      console.log(`${colors.yellow}Verifying ${contract.name} at ${contract.address}...${colors.reset}`);
      
      // Use Blockscout verifier instead of Sourcify
      let verifyCommand = `forge verify-contract ${contract.address} ${contract.name} --chain-id ${NETWORK === 'lisk_sepolia' ? 4202 : 4201} --verifier blockscout --verifier-url ${BLOCKSCOUT_API_URL}/api? --watch`;
      
      // Handle constructor arguments
      if (contract.hasConstructorArgs) {
        if (contract.name === 'EscrowManager') {
          // Create a temporary file with constructor args
          const argsFilePath = path.join(__dirname, 'constructor-args.txt');
          
          // For EscrowManager, we need properly formatted args
          // Just the addresses without quotes, one per line
          const argsContent = `${process.env.SCRIPT_NFT_ADDRESS}\n${process.env.PLATFORM_FEE_MANAGER_ADDRESS}`;
          fs.writeFileSync(argsFilePath, argsContent);
          
          verifyCommand += ` --constructor-args-path ${argsFilePath}`;
          
          console.log(`${colors.blue}Using constructor arguments:${colors.reset}`);
          console.log(`${colors.blue}- ScriptNFT: ${process.env.SCRIPT_NFT_ADDRESS}${colors.reset}`);
          console.log(`${colors.blue}- PlatformFeeManager: ${process.env.PLATFORM_FEE_MANAGER_ADDRESS}${colors.reset}`);
        }
      } else if (contract.constructorArgs) {
        verifyCommand += ` --constructor-args ${contract.constructorArgs}`;
      }
      
      // Add compiler version for consistency
      verifyCommand += ` --compiler-version 0.8.23`;
      
      console.log(`${colors.blue}Running command: ${verifyCommand}${colors.reset}`);
      
      // Execute verification command
      execSync(verifyCommand, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
      
      console.log(`${colors.green}✓ ${contract.name} verified successfully${colors.reset}`);
      console.log();
      
      // Clean up any temporary files
      const argsFilePath = path.join(__dirname, 'constructor-args.txt');
      if (fs.existsSync(argsFilePath)) {
        fs.unlinkSync(argsFilePath);
      }
    } catch (error) {
      console.error(`${colors.red}Error verifying ${contract.name}: ${error.message}${colors.reset}`);
      console.log(`${colors.yellow}You can manually verify this contract on Blockscout at:${colors.reset}`);
      console.log(`${colors.yellow}${BLOCKSCOUT_API_URL}/address/${contract.address}#code${colors.reset}`);
      console.log();
      
      // Clean up any temporary files even on error
      const argsFilePath = path.join(__dirname, 'constructor-args.txt');
      if (fs.existsSync(argsFilePath)) {
        fs.unlinkSync(argsFilePath);
      }
    }
  }
}

// Main function
async function main() {
  try {
    checkEnvVariables();
    verifyContracts();
    console.log(`${colors.green}=== Verification process completed! ===${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Verification failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Execute
main(); 