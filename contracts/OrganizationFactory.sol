// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Organization.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title OrganizationFactory
 * @dev Factory contract for creating and managing Organization contracts
 */
contract OrganizationFactory is Ownable {
    
    struct OrganizationInfo {
        address organizationContract;
        string name;
        address owner;
        uint256 createdAt;
        bool isActive;
    }

    // Default payment token (USDC)
    address public defaultPaymentToken;
    
    // Mapping from owner address to their organization
    mapping(address => address) public ownerToOrganization;
    
    // Mapping from organization contract to info
    mapping(address => OrganizationInfo) public organizationInfo;
    
    // Array of all organizations
    address[] public allOrganizations;
    
    // Total number of organizations
    uint256 public totalOrganizations;

    // Events
    event OrganizationCreated(
        address indexed owner,
        address indexed organizationContract,
        string name
    );
    
    event OrganizationDeactivated(
        address indexed organizationContract,
        address indexed owner
    );
    
    event DefaultPaymentTokenUpdated(
        address indexed oldToken,
        address indexed newToken
    );

    constructor(address _defaultPaymentToken) Ownable(msg.sender) {
        require(_defaultPaymentToken != address(0), "Invalid payment token");
        defaultPaymentToken = _defaultPaymentToken;
    }

    /**
     * @dev Create a new organization
     * @param organizationName The name of the organization
     * @param paymentToken The payment token address (use address(0) for default)
     */
    function createOrganization(
        string memory organizationName,
        address paymentToken
    ) external returns (address) {
        require(bytes(organizationName).length > 0, "Organization name required");
        require(ownerToOrganization[msg.sender] == address(0), "Organization already exists");

        // Use default payment token if not specified
        address tokenToUse = paymentToken == address(0) ? defaultPaymentToken : paymentToken;
        require(tokenToUse != address(0), "Invalid payment token");

        // Deploy new Organization contract
        Organization newOrg = new Organization(
            organizationName,
            msg.sender,
            tokenToUse
        );

        address orgAddress = address(newOrg);

        // Store organization info
        organizationInfo[orgAddress] = OrganizationInfo({
            organizationContract: orgAddress,
            name: organizationName,
            owner: msg.sender,
            createdAt: block.timestamp,
            isActive: true
        });

        // Update mappings
        ownerToOrganization[msg.sender] = orgAddress;
        allOrganizations.push(orgAddress);
        totalOrganizations++;

        emit OrganizationCreated(msg.sender, orgAddress, organizationName);

        return orgAddress;
    }

    /**
     * @dev Deactivate an organization (only owner or factory owner)
     * @param organizationContract The organization contract address
     */
    function deactivateOrganization(address organizationContract) external {
        OrganizationInfo storage info = organizationInfo[organizationContract];
        require(info.isActive, "Organization not active");
        require(
            msg.sender == info.owner || msg.sender == owner(),
            "Not authorized"
        );

        info.isActive = false;
        delete ownerToOrganization[info.owner];

        emit OrganizationDeactivated(organizationContract, info.owner);
    }

    /**
     * @dev Get organization contract for an owner
     * @param owner The owner address
     */
    function getOrganizationByOwner(address owner) external view returns (address) {
        return ownerToOrganization[owner];
    }

    /**
     * @dev Get organization info
     * @param organizationContract The organization contract address
     */
    function getOrganizationInfo(address organizationContract) external view returns (
        address,
        string memory,
        address,
        uint256,
        bool
    ) {
        OrganizationInfo memory info = organizationInfo[organizationContract];
        return (
            info.organizationContract,
            info.name,
            info.owner,
            info.createdAt,
            info.isActive
        );
    }

    /**
     * @dev Get all organizations (paginated)
     * @param offset Starting index
     * @param limit Number of organizations to return
     */
    function getOrganizations(uint256 offset, uint256 limit) external view returns (
        address[] memory organizations,
        string[] memory names,
        address[] memory owners,
        uint256[] memory createdAts,
        bool[] memory activeStatuses
    ) {
        require(offset < allOrganizations.length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > allOrganizations.length) {
            end = allOrganizations.length;
        }
        
        uint256 length = end - offset;
        organizations = new address[](length);
        names = new string[](length);
        owners = new address[](length);
        createdAts = new uint256[](length);
        activeStatuses = new bool[](length);

        for (uint256 i = 0; i < length; i++) {
            address orgAddress = allOrganizations[offset + i];
            OrganizationInfo memory info = organizationInfo[orgAddress];
            
            organizations[i] = info.organizationContract;
            names[i] = info.name;
            owners[i] = info.owner;
            createdAts[i] = info.createdAt;
            activeStatuses[i] = info.isActive;
        }
    }

    /**
     * @dev Check if an address is a valid organization contract
     * @param organizationContract The contract address to check
     */
    function isValidOrganization(address organizationContract) external view returns (bool) {
        return organizationInfo[organizationContract].isActive;
    }

    /**
     * @dev Update default payment token (only factory owner)
     * @param newPaymentToken The new default payment token address
     */
    function updateDefaultPaymentToken(address newPaymentToken) external onlyOwner {
        require(newPaymentToken != address(0), "Invalid payment token");
        
        address oldToken = defaultPaymentToken;
        defaultPaymentToken = newPaymentToken;

        emit DefaultPaymentTokenUpdated(oldToken, newPaymentToken);
    }

    /**
     * @dev Get total number of active organizations
     */
    function getActiveOrganizationCount() external view returns (uint256) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < allOrganizations.length; i++) {
            if (organizationInfo[allOrganizations[i]].isActive) {
                activeCount++;
            }
        }
        return activeCount;
    }

    /**
     * @dev Get all organizations for a specific owner (in case of multiple)
     * @param owner The owner address
     */
    function getOrganizationsByOwner(address owner) external view returns (address[] memory) {
        address[] memory userOrgs = new address[](allOrganizations.length);
        uint256 count = 0;

        for (uint256 i = 0; i < allOrganizations.length; i++) {
            if (organizationInfo[allOrganizations[i]].owner == owner && 
                organizationInfo[allOrganizations[i]].isActive) {
                userOrgs[count] = allOrganizations[i];
                count++;
            }
        }

        // Resize array to actual count
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = userOrgs[i];
        }

        return result;
    }
}
