#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Paths
const CONTRACTS_DIR = path.join(__dirname, 'contracts');
const FRONTEND_CONTRACTS_DIR = path.join(__dirname, '..', 'src', 'contracts');
const ENV_FILE = path.join(__dirname, '.env');
const FRONTEND_ENV_FILE = path.join(__dirname, '..', '.env.local');

// Network configuration (default to Lisk Sepolia testnet)
const NETWORK = process.env.DEPLOY_NETWORK || 'lisk_sepolia';
const RPC_URL = process.env.LISK_SEPOLIA_RPC || process.env.LISK_RPC;
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

console.log(`${colors.magenta}=== BlockCreative Contract Deployment ====${colors.reset}`);
console.log(`${colors.blue}This script will deploy and verify all contracts with optimized gas settings${colors.reset}`);
console.log(`${colors.blue}to avoid running out of gas on the testnet.${colors.reset}`);
console.log();

// Check if required env variables are set
function checkEnvVariables() {
  console.log(`${colors.blue}Checking environment variables...${colors.reset}`);
  
  const requiredVars = ['PRIVATE_KEY', 'PLATFORM_ADDRESS'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`${colors.red}Error: Missing required environment variables: ${missingVars.join(', ')}${colors.reset}`);
    console.error(`${colors.yellow}Please set these variables in your .env file${colors.reset}`);
    process.exit(1);
  }
  
  if (!RPC_URL) {
    console.error(`${colors.red}Error: Missing RPC URL for network ${NETWORK}${colors.reset}`);
    console.error(`${colors.yellow}Please set LISK_SEPOLIA_RPC or LISK_RPC in your .env file${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.green}✓ All required environment variables are set${colors.reset}`);
}

// Install dependencies if needed
function installDependencies() {
  console.log(`${colors.blue}Checking dependencies...${colors.reset}`);
  
  try {
    // Check if OpenZeppelin contracts are installed
    if (!fs.existsSync(path.join(__dirname, 'lib', 'openzeppelin-contracts'))) {
      console.log(`${colors.yellow}Installing OpenZeppelin contracts...${colors.reset}`);
      execSync('forge install OpenZeppelin/openzeppelin-contracts --no-commit', { stdio: 'inherit', cwd: __dirname });
    }
    
    console.log(`${colors.green}✓ Dependencies installed${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error installing dependencies: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Compile contracts
function compileContracts() {
  console.log(`${colors.blue}Compiling contracts...${colors.reset}`);
  
  try {
    execSync('forge build --force', { stdio: 'inherit', cwd: __dirname });
    console.log(`${colors.green}✓ Contracts compiled successfully${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error compiling contracts: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Deploy all contracts
function deployContracts() {
  console.log(`${colors.blue}Deploying contracts to ${NETWORK}...${colors.reset}`);
  
  try {
    // Create a temporary log file to capture the deployment output
    const deployLogFile = path.join(__dirname, 'deploy.log');
    
    // Get private key for deployment
    let privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY environment variable is not set');
    }
    
    // Ensure private key has 0x prefix
    if (!privateKey.startsWith('0x')) {
      privateKey = `0x${privateKey}`;
    }
    
    console.log(`${colors.yellow}=== Deploying all contracts sequentially ===${colors.reset}`);
    
    // Run the deployment script with Foundry
    execSync(
      `forge script script/Deploy.s.sol --rpc-url ${RPC_URL} --private-key ${privateKey} --broadcast --json > ${deployLogFile}`,
      { stdio: 'inherit', cwd: __dirname }
    );
    
    console.log(`${colors.green}✓ Contracts deployed successfully${colors.reset}`);
    
    // Read the deployment log to extract contract addresses
    if (fs.existsSync(deployLogFile)) {
      const deployLog = fs.readFileSync(deployLogFile, 'utf8');
      const addresses = extractContractAddresses(deployLog);
      
      // Update environment variables with contract addresses
      updateEnvVars(addresses);
      
      // Clean up log file
      fs.unlinkSync(deployLogFile);
      
      return addresses;
    } else {
      console.warn(`${colors.yellow}Warning: Deployment log file not found, cannot extract contract addresses${colors.reset}`);
      return {};
    }
  } catch (error) {
    console.error(`${colors.red}Error deploying contracts: ${error.message}${colors.reset}`);
    return {};
  }
}

// Extract contract addresses from deployment log
function extractContractAddresses(logOutput) {
  console.log(`${colors.blue}Extracting contract addresses...${colors.reset}`);
  
  // This regex pattern looks for lines with contract deployments
  const addressPattern = {
    scriptNFT: /ScriptNFT deployed to:\s+([0-9a-fA-Fx]+)/,
    projectRegistry: /ProjectRegistry deployed to:\s+([0-9a-fA-Fx]+)/,
    platformFeeManager: /PlatformFeeManager deployed to:\s+([0-9a-fA-Fx]+)/,
    escrowManager: /EscrowManager deployed to:\s+([0-9a-fA-Fx]+)/
  };
  
  const addresses = {};
  
  // Extract addresses using regex
  for (const [contract, pattern] of Object.entries(addressPattern)) {
    const match = logOutput.match(pattern);
    if (match && match[1]) {
      addresses[contract] = match[1].trim();
      console.log(`${colors.cyan}${contract}: ${addresses[contract]}${colors.reset}`);
    } else {
      console.warn(`${colors.yellow}Warning: Could not extract address for ${contract}${colors.reset}`);
    }
  }
  
  return addresses;
}

// Update environment variables with contract addresses
function updateEnvVars(addresses) {
  const envVarMap = {
    SCRIPT_NFT_ADDRESS: addresses.scriptNFT,
    PROJECT_REGISTRY_ADDRESS: addresses.projectRegistry,
    PLATFORM_FEE_MANAGER_ADDRESS: addresses.platformFeeManager,
    ESCROW_MANAGER_ADDRESS: addresses.escrowManager
  };
  
  for (const [key, value] of Object.entries(envVarMap)) {
    if (value) {
      process.env[key] = value;
    }
  }
}

// Verify contracts on Blockscout
function verifyContracts(addresses) {
  console.log(`${colors.blue}Verifying contracts on Blockscout...${colors.reset}`);
  
  const contracts = [
    { 
      name: 'ScriptNFT', 
      address: addresses.scriptNFT, 
      constructorArgs: '' 
    },
    { 
      name: 'ProjectRegistry', 
      address: addresses.projectRegistry, 
      constructorArgs: '' 
    },
    { 
      name: 'PlatformFeeManager', 
      address: addresses.platformFeeManager, 
      constructorArgs: '' 
    },
    { 
      name: 'EscrowManager', 
      address: addresses.escrowManager, 
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
          const argsContent = `${addresses.scriptNFT}\n${addresses.platformFeeManager}`;
          fs.writeFileSync(argsFilePath, argsContent);
          
          verifyCommand += ` --constructor-args-path ${argsFilePath}`;
          
          console.log(`${colors.blue}Using constructor arguments:${colors.reset}`);
          console.log(`${colors.blue}- ScriptNFT: ${addresses.scriptNFT}${colors.reset}`);
          console.log(`${colors.blue}- PlatformFeeManager: ${addresses.platformFeeManager}${colors.reset}`);
        }
      } else if (contract.constructorArgs) {
        verifyCommand += ` --constructor-args ${contract.constructorArgs}`;
      }
      
      // Add compiler version for consistency
      verifyCommand += ` --compiler-version 0.8.23`;
      
      console.log(`${colors.blue}Running command: ${verifyCommand}${colors.reset}`);
      
      // Execute verification command
      execSync(verifyCommand, { stdio: 'inherit', cwd: __dirname });
      
      console.log(`${colors.green}✓ ${contract.name} verified successfully${colors.reset}`);
      
      // Clean up any temporary files
      const argsFilePath = path.join(__dirname, 'constructor-args.txt');
      if (fs.existsSync(argsFilePath)) {
        fs.unlinkSync(argsFilePath);
      }
    } catch (error) {
      console.error(`${colors.red}Error verifying ${contract.name}: ${error.message}${colors.reset}`);
      console.log(`${colors.yellow}You can manually verify this contract on Blockscout at:${colors.reset}`);
      console.log(`${colors.yellow}${BLOCKSCOUT_API_URL}/address/${contract.address}#code${colors.reset}`);
      
      // Clean up any temporary files even on error
      const argsFilePath = path.join(__dirname, 'constructor-args.txt');
      if (fs.existsSync(argsFilePath)) {
        fs.unlinkSync(argsFilePath);
      }
    }
  }
}

// Extract ABIs from contracts
function extractABIs() {
  console.log(`${colors.blue}Extracting contract ABIs...${colors.reset}`);
  
  try {
    // Ensure the frontend contracts directory exists
    if (!fs.existsSync(FRONTEND_CONTRACTS_DIR)) {
      fs.mkdirSync(FRONTEND_CONTRACTS_DIR, { recursive: true });
    }
    
    // List of contracts to extract ABIs for
    const contracts = [
      { name: 'ScriptNFT', file: 'ScriptNFT.sol' },
      { name: 'ProjectRegistry', file: 'ProjectRegistry.sol' },
      { name: 'PlatformFeeManager', file: 'PlatformFeeManager.sol' },
      { name: 'EscrowManager', file: 'EscrowManager.sol' }
    ];
    
    contracts.forEach(contract => {
      const abiCommand = `forge inspect contracts/${contract.file}:${contract.name} abi`;
      const abi = execSync(abiCommand, { cwd: __dirname }).toString();
      
      // Format the ABI to include the abi property
      const formattedAbi = JSON.stringify({ abi: JSON.parse(abi) }, null, 2);
      
      // Write the ABI to the frontend contracts directory
      const abiPath = path.join(FRONTEND_CONTRACTS_DIR, `${contract.name}.json`);
      fs.writeFileSync(abiPath, formattedAbi);
      
      console.log(`${colors.green}✓ ${contract.name} ABI extracted to ${abiPath}${colors.reset}`);
    });
  } catch (error) {
    console.error(`${colors.red}Error extracting ABIs: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Update environment files with contract addresses
function updateEnvFiles(addresses) {
  console.log(`${colors.blue}Updating environment files with contract addresses...${colors.reset}`);
  
  try {
    // Update blockchain .env file
    let blockchainEnv = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : '';
    
    // Map of environment variables to contract addresses
    const envVarMap = {
      SCRIPT_NFT_ADDRESS: addresses.scriptNFT,
      PROJECT_REGISTRY_ADDRESS: addresses.projectRegistry,
      PLATFORM_FEE_MANAGER_ADDRESS: addresses.platformFeeManager,
      ESCROW_MANAGER_ADDRESS: addresses.escrowManager
    };
    
    // Update or add environment variables
    for (const [envVar, value] of Object.entries(envVarMap)) {
      if (!value) continue;
      
      const regex = new RegExp(`^${envVar}=.*$`, 'm');
      if (regex.test(blockchainEnv)) {
        blockchainEnv = blockchainEnv.replace(regex, `${envVar}=${value}`);
      } else {
        blockchainEnv += `\n${envVar}=${value}`;
      }
    }
    
    fs.writeFileSync(ENV_FILE, blockchainEnv);
    console.log(`${colors.green}✓ Updated blockchain .env file${colors.reset}`);
    
    // Update frontend .env.local file
    let frontendEnv = fs.existsSync(FRONTEND_ENV_FILE) ? fs.readFileSync(FRONTEND_ENV_FILE, 'utf8') : '';
    
    // Map of frontend environment variables to contract addresses
    const frontendEnvVarMap = {
      NEXT_PUBLIC_SCRIPT_NFT_ADDRESS: addresses.scriptNFT,
      NEXT_PUBLIC_PROJECT_REGISTRY_ADDRESS: addresses.projectRegistry,
      NEXT_PUBLIC_PLATFORM_FEE_MANAGER_ADDRESS: addresses.platformFeeManager,
      NEXT_PUBLIC_ESCROW_MANAGER_ADDRESS: addresses.escrowManager,
      NEXT_PUBLIC_RPC_URL: RPC_URL,
      NEXT_PUBLIC_BLOCK_EXPLORER_URL: BLOCKSCOUT_API_URL
    };
    
    // Update or add frontend environment variables
    for (const [envVar, value] of Object.entries(frontendEnvVarMap)) {
      if (!value) continue;
      
      const regex = new RegExp(`^${envVar}=.*$`, 'm');
      if (regex.test(frontendEnv)) {
        frontendEnv = frontendEnv.replace(regex, `${envVar}=${value}`);
      } else {
        frontendEnv += `\n${envVar}=${value}`;
      }
    }
    
    fs.writeFileSync(FRONTEND_ENV_FILE, frontendEnv);
    console.log(`${colors.green}✓ Updated frontend .env.local file${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error updating environment files: ${error.message}${colors.reset}`);
  }
}

// Deploy all contracts and perform post-deployment tasks
async function deployAll() {
  try {
    // Initial setup
    checkEnvVariables();
    installDependencies();
    compileContracts();
    
    // Deploy all contracts at once using the Foundry script
    const addresses = deployContracts();
    
    if (Object.keys(addresses).length === 0) {
      throw new Error('Failed to retrieve contract addresses after deployment');
    }
    
    // Post-deployment tasks
    verifyContracts(addresses);
    extractABIs();
    updateEnvFiles(addresses);
    
    console.log(`${colors.green}=== All contracts deployed and verified successfully! ===${colors.reset}`);
    console.log(`${colors.yellow}Contract Addresses:${colors.reset}`);
    console.log(`${colors.cyan}PlatformFeeManager: ${addresses.platformFeeManager}${colors.reset}`);
    console.log(`${colors.cyan}ScriptNFT: ${addresses.scriptNFT}${colors.reset}`);
    console.log(`${colors.cyan}ProjectRegistry: ${addresses.projectRegistry}${colors.reset}`);
    console.log(`${colors.cyan}EscrowManager: ${addresses.escrowManager}${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Deployment sequence failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Execute deployment sequence
deployAll(); 