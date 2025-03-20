#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Paths
const CONTRACTS_DIR = path.join(__dirname, '..', 'contracts');
const FRONTEND_CONTRACTS_DIR = path.join(__dirname, '..', '..', 'src', 'contracts');

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

// Clean the output string by removing ANSI color codes and other formatting
function cleanOutput(output) {
  // Remove ANSI color codes
  output = output.replace(/\x1b\[\d+m/g, '');
  // Remove any leading/trailing whitespace
  output = output.trim();
  // Remove any box-drawing characters
  output = output.replace(/[╭╮╰╯│─]/g, '');
  // Remove any non-JSON characters
  output = output.replace(/[^\x20-\x7E]/g, '');
  return output;
}

// Extract ABIs from contracts
function extractABIs() {
  console.log(`${colors.magenta}=== Extracting Contract ABIs ====${colors.reset}`);
  
  try {
    // Ensure the frontend contracts directory exists
    if (!fs.existsSync(FRONTEND_CONTRACTS_DIR)) {
      fs.mkdirSync(FRONTEND_CONTRACTS_DIR, { recursive: true });
      console.log(`${colors.blue}Created frontend contracts directory: ${FRONTEND_CONTRACTS_DIR}${colors.reset}`);
    }
    
    // List of contracts to extract ABIs for
    const contracts = [
      { name: 'ScriptNFT', file: 'ScriptNFT.sol' },
      { name: 'ProjectRegistry', file: 'ProjectRegistry.sol' },
      { name: 'PlatformFeeManager', file: 'PlatformFeeManager.sol' },
      { name: 'EscrowManager', file: 'EscrowManager.sol' }
    ];
    
    contracts.forEach(contract => {
      try {
        // Run forge inspect with --json flag
        const abiCommand = `forge inspect --json contracts/${contract.file}:${contract.name} abi`;
        const output = execSync(abiCommand, { cwd: path.join(__dirname, '..') }).toString();
        
        // Parse the JSON output
        const parsedAbi = JSON.parse(output);
        
        // Format the ABI to include the abi property
        const formattedAbi = JSON.stringify({ abi: parsedAbi }, null, 2);
        
        // Write the ABI to the frontend contracts directory
        const abiPath = path.join(FRONTEND_CONTRACTS_DIR, `${contract.name}.json`);
        fs.writeFileSync(abiPath, formattedAbi);
        
        console.log(`${colors.green}✓ ${contract.name} ABI extracted to ${abiPath}${colors.reset}`);
      } catch (error) {
        console.error(`${colors.red}Error extracting ABI for ${contract.name}: ${error.message}${colors.reset}`);
        // Log the raw output for debugging
        if (typeof output !== 'undefined') {
          console.error(`${colors.yellow}Raw output:${colors.reset}`);
          console.error(output);
        }
      }
    });
    
    console.log(`${colors.green}=== ABI extraction completed! ===${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error extracting ABIs: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Execute
extractABIs(); 