// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PlatformFeeManager
 * @dev Contract for managing platform fees
 */
contract PlatformFeeManager is Ownable, ReentrancyGuard {
    // Total fees collected
    uint256 private _totalFeesCollected;
    
    // Total fees withdrawn
    uint256 private _totalFeesWithdrawn;
    
    // Events
    event FeeCollected(uint256 amount);
    event FeeWithdrawn(address indexed recipient, uint256 amount);
    
    /**
     * @dev Constructor for PlatformFeeManager contract
     */
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Collects platform fee
     */
    function collectFee() external payable {
        require(msg.value > 0, "PlatformFeeManager: Fee must be greater than 0");
        
        // Update total fees collected
        _totalFeesCollected += msg.value;
        
        // Emit fee collection event
        emit FeeCollected(msg.value);
    }
    
    /**
     * @dev Withdraws collected fees
     * @param recipient Address to receive the fees
     * @param amount Amount to withdraw
     */
    function withdrawFees(address recipient, uint256 amount) external onlyOwner nonReentrant {
        require(recipient != address(0), "PlatformFeeManager: Invalid recipient");
        require(amount > 0, "PlatformFeeManager: Amount must be greater than 0");
        
        uint256 availableFees = _totalFeesCollected - _totalFeesWithdrawn;
        require(amount <= availableFees, "PlatformFeeManager: Insufficient available fees");
        
        // Update total fees withdrawn
        _totalFeesWithdrawn += amount;
        
        // Transfer fees to recipient
        (bool success, ) = payable(recipient).call{value: amount}("");
        require(success, "PlatformFeeManager: Failed to send fees");
        
        // Emit fee withdrawal event
        emit FeeWithdrawn(recipient, amount);
    }
    
    /**
     * @dev Returns total fees collected
     * @return amount Total fees collected
     */
    function getTotalFeesCollected() external view returns (uint256) {
        return _totalFeesCollected;
    }
    
    /**
     * @dev Returns total fees withdrawn
     * @return amount Total fees withdrawn
     */
    function getTotalFeesWithdrawn() external view returns (uint256) {
        return _totalFeesWithdrawn;
    }
    
    /**
     * @dev Returns available fees for withdrawal
     * @return amount Available fees
     */
    function getAvailableFees() external view returns (uint256) {
        return _totalFeesCollected - _totalFeesWithdrawn;
    }
} 