// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProjectRegistry
 * @dev Contract for managing project registrations and lifecycle
 */
contract ProjectRegistry is Ownable {
    // Project ID counter - replaces Counters utility
    uint256 private _projectIdCounter;
    
    // Enum for project status
    enum ProjectStatus { Open, Closed, Completed }
    
    // Project data structure
    struct Project {
        uint256 id;
        address producer;
        bytes32 projectHash;
        ProjectStatus status;
        uint256 createdAt;
        uint256 closedAt;
        uint256 completedAt;
    }
    
    // Mapping from project ID to project data
    mapping(uint256 => Project) private _projects;
    
    // Mapping from producer address to their projects
    mapping(address => uint256[]) private _producerProjects;
    
    // Events
    event ProjectCreated(uint256 indexed projectId, address indexed producer, bytes32 projectHash);
    event ProjectClosed(uint256 indexed projectId);
    event ProjectCompleted(uint256 indexed projectId);
    
    /**
     * @dev Constructor for ProjectRegistry contract
     */
    constructor() Ownable(msg.sender) {
        // Initialize the counter at 0
        _projectIdCounter = 0;
    }
    
    /**
     * @dev Creates a new project
     * @param projectHash Hash of the project metadata
     * @return projectId ID of the created project
     */
    function createProject(bytes32 projectHash) external returns (uint256) {
        // Increment counter for new project ID
        _projectIdCounter++;
        uint256 projectId = _projectIdCounter;
        
        // Store project data
        _projects[projectId] = Project({
            id: projectId,
            producer: msg.sender,
            projectHash: projectHash,
            status: ProjectStatus.Open,
            createdAt: block.timestamp,
            closedAt: 0,
            completedAt: 0
        });
        
        // Add project to producer's projects
        _producerProjects[msg.sender].push(projectId);
        
        // Emit project creation event
        emit ProjectCreated(projectId, msg.sender, projectHash);
        
        return projectId;
    }
    
    /**
     * @dev Closes a project to new submissions
     * @param projectId ID of the project to close
     */
    function closeProject(uint256 projectId) external {
        require(_projectExists(projectId), "ProjectRegistry: Project does not exist");
        require(_projects[projectId].producer == msg.sender, "ProjectRegistry: Not project producer");
        require(_projects[projectId].status == ProjectStatus.Open, "ProjectRegistry: Project not open");
        
        // Update project status
        _projects[projectId].status = ProjectStatus.Closed;
        _projects[projectId].closedAt = block.timestamp;
        
        // Emit project closure event
        emit ProjectClosed(projectId);
    }
    
    /**
     * @dev Marks a project as completed
     * @param projectId ID of the project to complete
     */
    function completeProject(uint256 projectId) external {
        require(_projectExists(projectId), "ProjectRegistry: Project does not exist");
        require(_projects[projectId].producer == msg.sender, "ProjectRegistry: Not project producer");
        require(_projects[projectId].status == ProjectStatus.Closed, "ProjectRegistry: Project not closed");
        
        // Update project status
        _projects[projectId].status = ProjectStatus.Completed;
        _projects[projectId].completedAt = block.timestamp;
        
        // Emit project completion event
        emit ProjectCompleted(projectId);
    }
    
    /**
     * @dev Returns project details
     * @param projectId ID of the project
     * @return project Project data
     */
    function getProject(uint256 projectId) external view returns (Project memory) {
        require(_projectExists(projectId), "ProjectRegistry: Project does not exist");
        
        return _projects[projectId];
    }
    
    /**
     * @dev Returns a producer's projects
     * @param producer Address of the producer
     * @return projectIds Array of project IDs
     */
    function getProducerProjects(address producer) external view returns (uint256[] memory) {
        return _producerProjects[producer];
    }
    
    /**
     * @dev Checks if a project exists
     * @param projectId ID of the project
     * @return bool Whether the project exists
     */
    function _projectExists(uint256 projectId) internal view returns (bool) {
        return _projects[projectId].id == projectId;
    }
} 