#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up BlockCreative Blockchain Development Environment${NC}"

# Check if Foundry is installed
if ! command -v forge &> /dev/null; then
    echo -e "${YELLOW}Installing Foundry...${NC}"
    curl -L https://foundry.paradigm.xyz | bash
    source "$HOME/.foundry/bin/foundryup"
else
    echo -e "${GREEN}Foundry is already installed${NC}"
fi

# Initialize Foundry project if not already initialized
if [ ! -f "foundry.toml" ]; then
    echo -e "${YELLOW}Initializing Foundry project...${NC}"
    forge init --no-commit
else
    echo -e "${GREEN}Foundry project is already initialized${NC}"
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
forge install OpenZeppelin/openzeppelin-contracts --no-commit

# Install npm dependencies
echo -e "${YELLOW}Installing npm dependencies...${NC}"
npm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}Please update the .env file with your configuration${NC}"
else
    echo -e "${GREEN}.env file already exists${NC}"
fi

# Build contracts
echo -e "${YELLOW}Building contracts...${NC}"
forge build

# Extract ABIs
echo -e "${YELLOW}Extracting contract ABIs...${NC}"
./script/ExtractABI.sh

echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update your .env file with your configuration"
echo "2. Run 'npm run deploy:testnet' to deploy to Lisk Sepolia testnet"
echo "3. Run 'npm run deploy:mainnet' to deploy to Lisk mainnet" 