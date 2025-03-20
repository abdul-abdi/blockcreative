// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/ScriptNFT.sol";
import "../contracts/ProjectRegistry.sol";
import "../contracts/PlatformFeeManager.sol";
import "../contracts/EscrowManager.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        // Get deployment private key from env (already prefixed with 0x)
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Get platform address or default to deployer
        address platformAddress;
        try vm.envAddress("PLATFORM_ADDRESS") returns (address addr) {
            platformAddress = addr;
            console.log("Using platform address from .env:", platformAddress);
        } catch {
            platformAddress = vm.addr(deployerPrivateKey);
            console.log("No platform address in .env, using deployer:", platformAddress);
        }

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy PlatformFeeManager first
        PlatformFeeManager platformFeeManager = new PlatformFeeManager();
        console.log("PlatformFeeManager deployed to:", address(platformFeeManager));

        // Deploy ScriptNFT
        ScriptNFT scriptNFT = new ScriptNFT();
        console.log("ScriptNFT deployed to:", address(scriptNFT));

        // Deploy ProjectRegistry
        ProjectRegistry projectRegistry = new ProjectRegistry();
        console.log("ProjectRegistry deployed to:", address(projectRegistry));

        // Deploy EscrowManager with dependencies
        EscrowManager escrowManager = new EscrowManager(
            address(scriptNFT),
            address(platformFeeManager)
        );
        console.log("EscrowManager deployed to:", address(escrowManager));
        
        // Transfer ownership to platform address if different from deployer
        if (platformAddress != vm.addr(deployerPrivateKey)) {
            scriptNFT.transferOwnership(platformAddress);
            projectRegistry.transferOwnership(platformAddress);
            platformFeeManager.transferOwnership(platformAddress);
            escrowManager.transferOwnership(platformAddress);
            console.log("Ownership transferred to platform address");
        }

        vm.stopBroadcast();
    }
} 