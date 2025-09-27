// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Organisation.sol";

contract OrganisationFactory {
    // Structure to store organisation details
    struct OrganisationInfo {
        address organisationAddress;
        address owner;
        uint256 orgID;
        uint256 deployedAt;
        bool isActive;
    }
    
    // State variables
    mapping(uint256 => OrganisationInfo) public organisations;
    mapping(address => uint256[]) public ownerToOrganisations;
    mapping(address => uint256) public addressToOrgID;
    
    uint256 public nextOrgID = 1;
    uint256 public totalOrganisations = 0;
    address public immutable verifierAddress;
    
    // Events
    event OrganisationDeployed(
        uint256 indexed orgID,
        address indexed organisationAddress,
        address indexed owner,
        uint256 timestamp
    );
    
    event OrganisationDeactivated(
        uint256 indexed orgID,
        address indexed organisationAddress
    );
    
    constructor(address _verifierAddress) {
        require(_verifierAddress != address(0), "Invalid verifier address");
        verifierAddress = _verifierAddress;
    }
    
    /**
     * @dev Deploy a new Organisation contract
     * @return orgID The unique organisation ID
     * @return organisationAddress The address of the deployed Organisation contract
     */
    function deployOrganisation() external returns (uint256 orgID, address organisationAddress) {
        // Generate unique organisation ID
        orgID = nextOrgID++;
        
        // Deploy new Organisation contract with caller as owner
        Organisation newOrganisation = new Organisation(verifierAddress, orgID);
        organisationAddress = address(newOrganisation);
        
        // Store organisation information
        organisations[orgID] = OrganisationInfo({
            organisationAddress: organisationAddress,
            owner: msg.sender,
            orgID: orgID,
            deployedAt: block.timestamp,
            isActive: true
        });
        
        // Track organisations by owner
        ownerToOrganisations[msg.sender].push(orgID);
        
        // Map address to orgID for quick lookup
        addressToOrgID[organisationAddress] = orgID;
        
        // Update total count
        totalOrganisations++;
        
        // Transfer ownership to the caller
        newOrganisation.transferOwnership(msg.sender);
        
        emit OrganisationDeployed(orgID, organisationAddress, msg.sender, block.timestamp);
        
        return (orgID, organisationAddress);
    }
    
    /**
     * @dev Deactivate an organisation (only callable by factory owner or organisation owner)
     * @param _orgID The organisation ID to deactivate
     */
    function deactivateOrganisation(uint256 _orgID) external {
        require(organisations[_orgID].organisationAddress != address(0), "Organisation does not exist");
        require(
            organisations[_orgID].owner == msg.sender, 
            "Only organisation owner can deactivate"
        );
        require(organisations[_orgID].isActive, "Organisation already deactivated");
        
        organisations[_orgID].isActive = false;
        
        emit OrganisationDeactivated(_orgID, organisations[_orgID].organisationAddress);
    }
    
    /**
     * @dev Get organisation details by ID
     * @param _orgID The organisation ID
     * @return OrganisationInfo struct with all details
     */
    function getOrganisation(uint256 _orgID) external view returns (OrganisationInfo memory) {
        require(organisations[_orgID].organisationAddress != address(0), "Organisation does not exist");
        return organisations[_orgID];
    }
    
    /**
     * @dev Get organisation ID by contract address
     * @param _organisationAddress The organisation contract address
     * @return uint256 The organisation ID (0 if not found)
     */
    function getOrgIDByAddress(address _organisationAddress) external view returns (uint256) {
        return addressToOrgID[_organisationAddress];
    }
    
    /**
     * @dev Get all organisation IDs owned by an address
     * @param _owner The owner address
     * @return uint256[] Array of organisation IDs
     */
    function getOrganisationsByOwner(address _owner) external view returns (uint256[] memory) {
        return ownerToOrganisations[_owner];
    }
    
    /**
     * @dev Get all active organisations owned by an address
     * @param _owner The owner address
     * @return activeOrgs Array of active organisation IDs
     */
    function getActiveOrganisationsByOwner(address _owner) external view returns (uint256[] memory activeOrgs) {
        uint256[] memory allOrgs = ownerToOrganisations[_owner];
        uint256 activeCount = 0;
        
        // Count active organisations
        for (uint256 i = 0; i < allOrgs.length; i++) {
            if (organisations[allOrgs[i]].isActive) {
                activeCount++;
            }
        }
        
        // Create array of active organisations
        activeOrgs = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allOrgs.length; i++) {
            if (organisations[allOrgs[i]].isActive) {
                activeOrgs[index] = allOrgs[i];
                index++;
            }
        }
        
        return activeOrgs;
    }
    
    /**
     * @dev Check if an organisation is active
     * @param _orgID The organisation ID
     * @return bool Whether the organisation is active
     */
    function isOrganisationActive(uint256 _orgID) external view returns (bool) {
        return organisations[_orgID].isActive;
    }
    
    /**
     * @dev Get total number of organisations deployed
     * @return uint256 Total count of organisations
     */
    function getTotalOrganisations() external view returns (uint256) {
        return totalOrganisations;
    }
    
    /**
     * @dev Get total number of active organisations
     * @return uint256 Count of active organisations
     */
    function getTotalActiveOrganisations() external view returns (uint256) {
        uint256 activeCount = 0;
        
        for (uint256 i = 1; i < nextOrgID; i++) {
            if (organisations[i].isActive) {
                activeCount++;
            }
        }
        
        return activeCount;
    }
    
    /**
     * @dev Get organisations deployed within a time range
     * @param _startTime Start timestamp
     * @param _endTime End timestamp
     * @return orgIDs Array of organisation IDs deployed in the time range
     */
    function getOrganisationsByTimeRange(
        uint256 _startTime, 
        uint256 _endTime
    ) external view returns (uint256[] memory orgIDs) {
        require(_startTime <= _endTime, "Invalid time range");
        
        uint256 count = 0;
        
        // Count organisations in time range
        for (uint256 i = 1; i < nextOrgID; i++) {
            if (organisations[i].deployedAt >= _startTime && 
                organisations[i].deployedAt <= _endTime) {
                count++;
            }
        }
        
        // Create array of organisation IDs in time range
        orgIDs = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i < nextOrgID; i++) {
            if (organisations[i].deployedAt >= _startTime && 
                organisations[i].deployedAt <= _endTime) {
                orgIDs[index] = i;
                index++;
            }
        }
        
        return orgIDs;
    }
    
    /**
     * @dev Get paginated list of organisations
     * @param _offset Starting index
     * @param _limit Number of organisations to return
     * @return orgIDs Array of organisation IDs
     * @return hasMore Whether there are more organisations beyond this page
     */
    function getOrganisationsPaginated(
        uint256 _offset, 
        uint256 _limit
    ) external view returns (uint256[] memory orgIDs, bool hasMore) {
        require(_limit > 0, "Limit must be greater than 0");
        
        uint256 totalCount = nextOrgID - 1;
        
        if (_offset >= totalCount) {
            return (new uint256[](0), false);
        }
        
        uint256 endIndex = _offset + _limit;
        if (endIndex > totalCount) {
            endIndex = totalCount;
        }
        
        uint256 resultLength = endIndex - _offset;
        orgIDs = new uint256[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            orgIDs[i] = _offset + i + 1; // +1 because orgIDs start from 1
        }
        
        hasMore = endIndex < totalCount;
        
        return (orgIDs, hasMore);
    }
}
