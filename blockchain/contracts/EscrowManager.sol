// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ScriptNFT.sol";
import "./PlatformFeeManager.sol";

/**
 * @title EscrowManager
 * @dev Contract for managing funds escrow for projects and payment processing
 */
contract EscrowManager is Ownable, ReentrancyGuard {
    // ScriptNFT contract reference
    ScriptNFT private _scriptNFT;
    
    // PlatformFeeManager contract reference
    PlatformFeeManager private _platformFeeManager;
    
    // Escrowed funds for projects
    mapping(uint256 => uint256) private _projectFunds;
    
    // Events
    event ProjectFunded(uint256 indexed projectId, uint256 amount);
    event PaymentReleased(uint256 indexed submissionId, address indexed writer, uint256 amount);
    event RefundIssued(uint256 indexed projectId, address indexed producer, uint256 amount);
    
    /**
     * @dev Constructor for EscrowManager contract
     * @param scriptNFTAddress Address of the ScriptNFT contract
     * @param platformFeeManagerAddress Address of the PlatformFeeManager contract
     */
    constructor(
        address scriptNFTAddress,
        address platformFeeManagerAddress
    ) Ownable(msg.sender) {
        _scriptNFT = ScriptNFT(scriptNFTAddress);
        _platformFeeManager = PlatformFeeManager(platformFeeManagerAddress);
    }
    
    /**
     * @dev Funds a project escrow
     * @param projectId ID of the project to fund
     */
    function fundProject(uint256 projectId) external payable {
        require(msg.value > 0, "EscrowManager: Amount must be greater than 0");
        
        // Add to project funds
        _projectFunds[projectId] += msg.value;
        
        // Emit project funding event
        emit ProjectFunded(projectId, msg.value);
    }
    
    /**
     * @dev Releases payment to writer and transfers NFT ownership
     * @param submissionId ID of the submission
     * @param writer Address of the writer to pay
     * @param producer Address of the producer who should receive the NFT
     * @param writerAmount Amount to pay the writer
     * @param platformFeeAmount Amount for platform fee
     */
    function releasePayment(
        uint256 submissionId,
        address writer,
        address producer,
        uint256 writerAmount,
        uint256 platformFeeAmount
    ) external onlyOwner nonReentrant {
        require(writerAmount > 0, "EscrowManager: Writer amount must be greater than 0");
        require(platformFeeAmount > 0, "EscrowManager: Platform fee amount must be greater than 0");
        
        // Transfer NFT from writer to producer
        (bytes32 scriptHash, uint256 submissionIdStored) = _scriptNFT.getScriptDetails(submissionId);
        require(submissionIdStored == submissionId, "EscrowManager: Invalid submission ID");
        
        // Transfer funds to writer
        (bool writerSuccess, ) = payable(writer).call{value: writerAmount}("");
        require(writerSuccess, "EscrowManager: Failed to send funds to writer");
        
        // Transfer platform fee
        _platformFeeManager.collectFee{value: platformFeeAmount}();
        
        // Emit payment release event
        emit PaymentReleased(submissionId, writer, writerAmount);
    }
    
    /**
     * @dev Refunds producer for a project
     * @param projectId ID of the project
     * @param producer Address of the producer to refund
     */
    function refundProducer(uint256 projectId, address producer) external onlyOwner nonReentrant {
        uint256 refundAmount = _projectFunds[projectId];
        require(refundAmount > 0, "EscrowManager: No funds to refund");
        
        // Reset project funds before transfer
        _projectFunds[projectId] = 0;
        
        // Transfer funds to producer
        (bool success, ) = payable(producer).call{value: refundAmount}("");
        require(success, "EscrowManager: Failed to send refund");
        
        // Emit refund event
        emit RefundIssued(projectId, producer, refundAmount);
    }
    
    /**
     * @dev Returns escrowed funds for a project
     * @param projectId ID of the project
     * @return amount Escrowed amount
     */
    function getProjectFunds(uint256 projectId) external view returns (uint256) {
        return _projectFunds[projectId];
    }
    
    /**
     * @dev Updates ScriptNFT contract address
     * @param scriptNFTAddress New ScriptNFT contract address
     */
    function setScriptNFTAddress(address scriptNFTAddress) external onlyOwner {
        require(scriptNFTAddress != address(0), "EscrowManager: Invalid address");
        _scriptNFT = ScriptNFT(scriptNFTAddress);
    }
    
    /**
     * @dev Updates PlatformFeeManager contract address
     * @param platformFeeManagerAddress New PlatformFeeManager contract address
     */
    function setPlatformFeeManagerAddress(address platformFeeManagerAddress) external onlyOwner {
        require(platformFeeManagerAddress != address(0), "EscrowManager: Invalid address");
        _platformFeeManager = PlatformFeeManager(platformFeeManagerAddress);
    }
} 