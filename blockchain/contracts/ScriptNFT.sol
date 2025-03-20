// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ScriptNFT
 * @dev Contract for minting and managing script NFTs
 */
contract ScriptNFT is ERC721URIStorage, Ownable {
    // Token ID counter - replaces Counters utility
    uint256 private _tokenIdCounter;
    
    // Mapping from tokenId to script hash
    mapping(uint256 => bytes32) private _scriptHashes;
    
    // Mapping from tokenId to submission ID
    mapping(uint256 => uint256) private _submissionIds;
    
    // Event emitted when a new script NFT is minted
    event ScriptNFTMinted(uint256 indexed tokenId, address indexed recipient, bytes32 scriptHash);
    
    // Event emitted when ownership of a script NFT is transferred
    event TokenOwnershipTransferred(uint256 indexed tokenId, address indexed from, address indexed to);
    
    /**
     * @dev Constructor for ScriptNFT contract
     */
    constructor() ERC721("BlockCreative Script", "SCRIPT") Ownable(msg.sender) {
        // Initialize counter at 0
        _tokenIdCounter = 0;
    }
    
    /**
     * @dev Mints a new script NFT
     * @param recipient Address that will receive the NFT
     * @param scriptHash Hash of the script content
     * @param submissionId ID of the submission in the database
     * @return tokenId ID of the minted NFT
     */
    function mintScriptNFT(
        address recipient,
        bytes32 scriptHash,
        uint256 submissionId
    ) external onlyOwner returns (uint256) {
        // Increment counter for new token ID
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        
        _safeMint(recipient, tokenId);
        
        // Store script hash and submission ID
        _scriptHashes[tokenId] = scriptHash;
        _submissionIds[tokenId] = submissionId;
        
        // Emit minting event
        emit ScriptNFTMinted(tokenId, recipient, scriptHash);
        
        return tokenId;
    }
    
    /**
     * @dev Transfers ownership of an NFT
     * @param tokenId ID of the NFT to transfer
     * @param to Address that will receive the NFT
     */
    function transferTokenOwnership(uint256 tokenId, address to) external {
        require(_exists(tokenId), "ScriptNFT: Token does not exist");
        require(ownerOf(tokenId) == msg.sender || getApproved(tokenId) == msg.sender || isApprovedForAll(ownerOf(tokenId), msg.sender), 
                "ScriptNFT: Not authorized to transfer");
        
        address from = ownerOf(tokenId);
        transferFrom(from, to, tokenId);
        
        // Emit ownership transfer event
        emit TokenOwnershipTransferred(tokenId, from, to);
    }
    
    /**
     * @dev Returns script details
     * @param tokenId ID of the NFT
     * @return scriptHash Hash of the script content
     * @return submissionId ID of the submission in the database
     */
    function getScriptDetails(uint256 tokenId) external view returns (bytes32 scriptHash, uint256 submissionId) {
        require(_exists(tokenId), "ScriptNFT: Token does not exist");
        
        return (_scriptHashes[tokenId], _submissionIds[tokenId]);
    }
    
    /**
     * @dev Checks if a token exists
     * @param tokenId ID of the NFT
     * @return bool Whether the token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
} 