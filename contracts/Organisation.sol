// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Verifier.sol";

contract Organisation is Ownable {
    // Employee structure
    struct Employee {
        uint256[2] publicViewerKey;  // [x, y] coordinates of public viewer key
        uint256[2] publicSpenderKey; // [x, y] coordinates of public spender key  
        bool isActive;
        uint256 employeeId;
    }

    struct Payment {
        bytes32 hash;
        uint32  chain_id;
        address reciever;
    }
    
    // State variables
    mapping(uint256 => Employee) public employees;
    mapping(address => uint256) public addressToEmployeeId;
    uint256 public nextEmployeeId = 1;
    uint256 public immutable  orgID;
    uint256 public immutable  ROOT_STOCK_CHAIN_ID = 31;
    mapping(uint256 => Payment) public commitmentToPayment;
    
    // Verifier contract instance
    Groth16Verifier public immutable verifier;
    
    // Events
    event EmployeeAdded(uint256 indexed employeeId, uint256[2] publicViewerKey, uint256[2] publicSpenderKey);
    event EmployeeDeactivated(uint256 indexed employeeId);
    event EmployeeKeysUpdated(uint256 indexed employeeId, uint256[2] newPublicViewerKey, uint256[2] newPublicSpenderKey);
    event PaymentDispatched(uint256 indexed employeeId, address token, uint256 amount, uint256 indexed commitment, bytes32 paymentId);
    
    constructor(address _verifierAddress, uint256 _orgID) {
        verifier = Groth16Verifier(_verifierAddress);
        orgID = _orgID;
    }
    
    /**
     * @dev Add a new employee with their stealth address keys
     * @param _publicViewerKey The public viewer key coordinates [x, y]
     * @param _publicSpenderKey The public spender key coordinates [x, y]
     * @param _employeeAddress The employee's wallet address for mapping
     */
    function addEmployee(
        uint256[2] memory _publicViewerKey,
        uint256[2] memory _publicSpenderKey,
        address _employeeAddress
    ) external onlyOwner {
        require(_employeeAddress != address(0), "Invalid employee address");
        require(addressToEmployeeId[_employeeAddress] == 0, "Employee already exists");
        
        uint256 employeeId = nextEmployeeId++;
        
        employees[employeeId] = Employee({
            publicViewerKey: _publicViewerKey,
            publicSpenderKey: _publicSpenderKey,
            isActive: true,
            employeeId: employeeId
        });
        
        addressToEmployeeId[_employeeAddress] = employeeId;
        
        emit EmployeeAdded(employeeId, _publicViewerKey, _publicSpenderKey);
    }
    
    /**
     * @dev Update employee's public keys
     * @param _employeeId The employee ID to update
     * @param _newPublicViewerKey New public viewer key coordinates [x, y]
     * @param _newPublicSpenderKey New public spender key coordinates [x, y]
     */
    function updateEmployeeKeys(
        uint256 _employeeId,
        uint256[2] memory _newPublicViewerKey,
        uint256[2] memory _newPublicSpenderKey
    ) external onlyOwner {
        require(employees[_employeeId].employeeId != 0, "Employee does not exist");
        
        employees[_employeeId].publicViewerKey = _newPublicViewerKey;
        employees[_employeeId].publicSpenderKey = _newPublicSpenderKey;
        
        emit EmployeeKeysUpdated(_employeeId, _newPublicViewerKey, _newPublicSpenderKey);
    }
    
    /**
     * @dev Deactivate an employee (mark as inactive)
     * @param _employeeId The employee ID to deactivate
     */
    function removeEmployee(uint256 _employeeId) external onlyOwner {
        require(employees[_employeeId].employeeId != 0, "Employee does not exist");
        require(employees[_employeeId].isActive, "Employee already inactive");
        
        employees[_employeeId].isActive = false;
        
        emit EmployeeDeactivated(_employeeId);
    }
    
    /**
     * @dev Verify a zero-knowledge proof using the Verifier contract
     * @param _pA The proof component A
     * @param _pB The proof component B
     * @param _pC The proof component C
     * @param _pubSignals The public signals for verification
     * @return bool Whether the proof is valid
     */
    function verifyProof(
        uint[2] memory _pA,
        uint[2][2] memory _pB, 
        uint[2] memory _pC,
        uint[8] memory _pubSignals
    ) public view returns (bool) {
        return verifier.verifyProof(_pA, _pB, _pC, _pubSignals);
    }
    
    /**
     * @dev Dispatch payment to employee after verifying ZK proof
     * @param _employeeId The employee ID to pay
     * @param _token The ERC20 token contract address
     * @param _amount The amount to transfer
     * @param _pA The ZK proof component A
     * @param _pB The ZK proof component B
     * @param _pC The ZK proof component C
     * @param _pubSignals The public signals [pubViewKeyX, pubViewKeyY, pubSpendKeyX, pubSpendKeyY, paymentType, startDate, endDate, commitment]
     */
    function dispatchPayment(
        uint256 _employeeId,
        address _token,
        uint256 _amount,
        uint[2] memory _pA,
        uint[2][2] memory _pB,
        uint[2] memory _pC,
        uint[8] memory _pubSignals,
        address stealth_address,
        uint32  chain_id
    ) external onlyOwner {
        // Validate employee exists and is active
        require(employees[_employeeId].employeeId != 0, "Employee does not exist");
        require(employees[_employeeId].isActive, "Employee is not active");
        
        // Validate that the public keys in the proof match the employee's keys
        require(
            _pubSignals[0] == employees[_employeeId].publicViewerKey[0] &&
            _pubSignals[1] == employees[_employeeId].publicViewerKey[1],
            "Public viewer key mismatch"
        );
        require(
            _pubSignals[2] == employees[_employeeId].publicSpenderKey[0] &&
            _pubSignals[3] == employees[_employeeId].publicSpenderKey[1], 
            "Public spender key mismatch"
        );
        
        // Extract commitment from public signals (index 7)
        uint256 commitment = _pubSignals[7];
        
        // Check if commitment has already been used (prevent double-spending)
        require(commitmentToPayment[commitment].hash == bytes32(0), "Commitment already used");
        
        // Verify the ZK proof
        require(verifyProof(_pA, _pB, _pC, _pubSignals), "Invalid proof");
        
        // Transfer tokens
        if(chain_id == ROOT_STOCK_CHAIN_ID){
        require(IERC20(_token).transfer(stealth_address, _amount), "Token transfer failed");
        }
        
        // Generate a unique payment identifier
        bytes32 paymentId = keccak256(abi.encodePacked(
            block.timestamp,
            block.number,
            _employeeId,
            _token,
            _amount,
            commitment
        ));
        
        // Store commitment with payment identifier
        commitmentToPayment[commitment] = Payment({
            hash:paymentId,
            chain_id:chain_id,
            reciever:stealth_address
        });
        
        emit PaymentDispatched(_employeeId, _token, _amount, commitment, paymentId);
    }
    
    /**
     * @dev Update commitment mapping with actual transaction hash (called after transaction is mined)
     * @param _commitment The commitment value
     * @param _transactionHash The actual transaction hash from the blockchain
     */
    function updateCommitmentTransactionHash(
        uint256 _commitment, 
        bytes32 _transactionHash
    ) external onlyOwner {
        require(commitmentToPayment[_commitment].hash != 0, "Commitment not found");
        commitmentToPayment[_commitment].hash = _transactionHash;
    }
    
    /**
     * @dev Get employee details
     * @param _employeeId The employee ID to query
     * @return Employee struct with all details
     */
    function getEmployee(uint256 _employeeId) external view returns (Employee memory) {
        require(employees[_employeeId].employeeId != 0, "Employee does not exist");
        return employees[_employeeId];
    }
    
    /**
     * @dev Get employee ID by address
     * @param _employeeAddress The employee's wallet address
     * @return uint256 The employee ID (0 if not found)
     */
    function getEmployeeIdByAddress(address _employeeAddress) external view returns (uint256) {
        return addressToEmployeeId[_employeeAddress];
    }
    
    /**
     * @dev Check if employee is active
     * @param _employeeId The employee ID to check
     * @return bool Whether the employee is active
     */
    function isEmployeeActive(uint256 _employeeId) external view returns (bool) {
        return employees[_employeeId].isActive;
    }
    
    /**
     * @dev Emergency function to withdraw tokens from contract
     * @param _token The token contract address
     * @param _amount The amount to withdraw
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        require(IERC20(_token).transfer(owner(), _amount), "Token transfer failed");
    }
}
