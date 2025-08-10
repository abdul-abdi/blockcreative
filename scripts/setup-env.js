#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

// Function to copy .env.example to .env if .env doesn't exist
function setupEnv() {
  if (!fs.existsSync(envPath)) {
    console.log('Creating .env file from .env.example template...');
    
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('.env file created successfully!');
      console.log('Please edit the .env file with your actual configuration values.');
    } else {
      console.log('Error: .env.example file not found!');
      process.exit(1);
    }
  } else {
    console.log('.env file already exists. Skipping creation.');
  }
}

// Function to validate required environment variables
function validateEnv() {
  const requiredVars = [
    'MONGODB_URI',
    'RPC_URL',
    'PRIVATE_KEY',
    'CONTRACT_ADDRESS',
    'GEMINI_API_KEY',
    'IPFS_API_KEY',
    'JWT_SECRET'
  ];
  
  const missingVars = [];
  
  // Load .env file
  require('dotenv').config();
  
  requiredVars.forEach((variable) => {
    if (!process.env[variable]) {
      missingVars.push(variable);
    }
  });
  
  if (missingVars.length > 0) {
    console.log('Warning: The following required environment variables are missing:');
    missingVars.forEach((variable) => {
      console.log(`- ${variable}`);
    });
    console.log('Please update your .env file with these values.');
  } else {
    console.log('All required environment variables are present.');
  }
}

// Main execution
function main() {
  console.log('Setting up environment variables...');
  
  setupEnv();
  validateEnv();
  
  console.log('\nSetup complete!');
  console.log('To verify your environment configuration, run: npm run validate-env');
}

main();
