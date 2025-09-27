// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title GlobalPayroll
 * @dev A smart contract for managing streaming payments to employees
 * @notice This contract allows employers to create payment streams for employees
 */
contract GlobalPayroll is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct PaymentStream {
        address employer;
        address employee;
        uint256 amountPerSecond;
        uint256 startTime;
        uint256 stopTime;
        uint256 totalFunded;
        uint256 totalWithdrawn;
        bool isActive;
        IERC20 token;
    }

    // Mapping from stream ID to PaymentStream
    mapping(uint256 => PaymentStream) public streams;
    
    // Mapping from employer to their stream IDs
    mapping(address => uint256[]) public employerStreams;
    
    // Mapping from employee to their stream IDs
    mapping(address => uint256[]) public employeeStreams;
    
    // Counter for stream IDs
    uint256 public nextStreamId;
    
    // Events
    event StreamCreated(
        uint256 indexed streamId,
        address indexed employer,
        address indexed employee,
        uint256 amountPerSecond,
        uint256 startTime,
        uint256 stopTime,
        address token
    );
    
    event StreamFunded(
        uint256 indexed streamId,
        address indexed funder,
        uint256 amount
    );
    
    event Withdrawal(
        uint256 indexed streamId,
        address indexed employee,
        uint256 amount
    );
    
    event StreamCancelled(
        uint256 indexed streamId,
        address indexed employer
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Creates a new payment stream
     * @param employee The address of the employee
     * @param amountPerSecond The amount to be paid per second
     * @param duration The duration of the stream in seconds
     * @param token The ERC20 token to be used for payments
     * @return streamId The ID of the created stream
     */
    function createStream(
        address employee,
        uint256 amountPerSecond,
        uint256 duration,
        address token
    ) external returns (uint256 streamId) {
        require(employee != address(0), "Invalid employee address");
        require(employee != msg.sender, "Cannot create stream to self");
        require(amountPerSecond > 0, "Amount per second must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        require(token != address(0), "Invalid token address");

        streamId = nextStreamId++;
        uint256 startTime = block.timestamp;
        uint256 stopTime = startTime + duration;

        streams[streamId] = PaymentStream({
            employer: msg.sender,
            employee: employee,
            amountPerSecond: amountPerSecond,
            startTime: startTime,
            stopTime: stopTime,
            totalFunded: 0,
            totalWithdrawn: 0,
            isActive: true,
            token: IERC20(token)
        });

        employerStreams[msg.sender].push(streamId);
        employeeStreams[employee].push(streamId);

        emit StreamCreated(
            streamId,
            msg.sender,
            employee,
            amountPerSecond,
            startTime,
            stopTime,
            token
        );
    }

    /**
     * @dev Funds a payment stream
     * @param streamId The ID of the stream to fund
     * @param amount The amount to fund
     */
    function fundStream(uint256 streamId, uint256 amount) external nonReentrant {
        PaymentStream storage stream = streams[streamId];
        require(stream.employer != address(0), "Stream does not exist");
        require(stream.isActive, "Stream is not active");
        require(amount > 0, "Amount must be greater than 0");

        stream.token.safeTransferFrom(msg.sender, address(this), amount);
        stream.totalFunded += amount;

        emit StreamFunded(streamId, msg.sender, amount);
    }

    /**
     * @dev Calculates the withdrawable balance for an employee
     * @param streamId The ID of the stream
     * @return The amount that can be withdrawn
     */
    function balanceOf(uint256 streamId) public view returns (uint256) {
        PaymentStream storage stream = streams[streamId];
        
        if (!stream.isActive || block.timestamp < stream.startTime) {
            return 0;
        }

        uint256 currentTime = block.timestamp > stream.stopTime ? stream.stopTime : block.timestamp;
        uint256 elapsedTime = currentTime - stream.startTime;
        uint256 totalEarned = elapsedTime * stream.amountPerSecond;
        
        // Ensure we don't exceed the funded amount
        if (totalEarned > stream.totalFunded) {
            totalEarned = stream.totalFunded;
        }
        
        return totalEarned > stream.totalWithdrawn ? totalEarned - stream.totalWithdrawn : 0;
    }

    /**
     * @dev Allows an employee to withdraw their earned amount
     * @param streamId The ID of the stream
     * @param amount The amount to withdraw
     */
    function withdrawFromStream(uint256 streamId, uint256 amount) external nonReentrant {
        PaymentStream storage stream = streams[streamId];
        require(stream.employee == msg.sender, "Only employee can withdraw");
        require(stream.isActive, "Stream is not active");
        
        uint256 withdrawableBalance = balanceOf(streamId);
        require(amount <= withdrawableBalance, "Insufficient balance");
        require(amount > 0, "Amount must be greater than 0");

        stream.totalWithdrawn += amount;
        stream.token.safeTransfer(msg.sender, amount);

        emit Withdrawal(streamId, msg.sender, amount);
    }

    /**
     * @dev Allows an employee to withdraw all available funds
     * @param streamId The ID of the stream
     */
    function withdrawAll(uint256 streamId) external {
        uint256 balance = balanceOf(streamId);
        if (balance > 0) {
            withdrawFromStream(streamId, balance);
        }
    }

    /**
     * @dev Cancels a stream and returns remaining funds to employer
     * @param streamId The ID of the stream to cancel
     */
    function cancelStream(uint256 streamId) external nonReentrant {
        PaymentStream storage stream = streams[streamId];
        require(stream.employer == msg.sender, "Only employer can cancel");
        require(stream.isActive, "Stream is not active");

        // Calculate any remaining balance for the employee
        uint256 employeeBalance = balanceOf(streamId);
        
        // Transfer employee balance if any
        if (employeeBalance > 0) {
            stream.totalWithdrawn += employeeBalance;
            stream.token.safeTransfer(stream.employee, employeeBalance);
        }

        // Return remaining funds to employer
        uint256 remainingFunds = stream.totalFunded - stream.totalWithdrawn;
        if (remainingFunds > 0) {
            stream.token.safeTransfer(stream.employer, remainingFunds);
        }

        stream.isActive = false;
        stream.stopTime = block.timestamp;

        emit StreamCancelled(streamId, msg.sender);
    }

    /**
     * @dev Gets stream information
     * @param streamId The ID of the stream
     * @return Stream details
     */
    function getStream(uint256 streamId) external view returns (
        address employer,
        address employee,
        uint256 amountPerSecond,
        uint256 startTime,
        uint256 stopTime,
        uint256 totalFunded,
        uint256 totalWithdrawn,
        bool isActive,
        address token
    ) {
        PaymentStream storage stream = streams[streamId];
        return (
            stream.employer,
            stream.employee,
            stream.amountPerSecond,
            stream.startTime,
            stream.stopTime,
            stream.totalFunded,
            stream.totalWithdrawn,
            stream.isActive,
            address(stream.token)
        );
    }

    /**
     * @dev Gets all stream IDs for an employer
     * @param employer The employer address
     * @return Array of stream IDs
     */
    function getEmployerStreams(address employer) external view returns (uint256[] memory) {
        return employerStreams[employer];
    }

    /**
     * @dev Gets all stream IDs for an employee
     * @param employee The employee address
     * @return Array of stream IDs
     */
    function getEmployeeStreams(address employee) external view returns (uint256[] memory) {
        return employeeStreams[employee];
    }
}
