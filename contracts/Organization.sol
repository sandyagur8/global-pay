// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Organization
 * @dev Individual organization contract for managing employees and payments
 */
contract Organization is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Employee {
        address employeeAddress;
        uint256 salaryPerSecond;
        uint256 startDate;
        uint256 lastPaymentDate;
        bool isActive;
        string name; // Optional employee name/identifier
    }

    struct PaymentSchedule {
        uint256 amount;
        uint256 nextPaymentDate;
        uint256 frequency; // in seconds (e.g., 2592000 for monthly)
        bool isActive;
    }

    // Organization details
    string public organizationName;
    IERC20 public paymentToken;
    
    // Employee management
    mapping(address => Employee) public employees;
    mapping(address => PaymentSchedule) public paymentSchedules;
    address[] public employeeList;
    
    // Payment tracking
    mapping(address => uint256) public totalPaid;
    mapping(address => uint256) public availableBalance;
    
    uint256 public totalFunds;
    uint256 public totalEmployees;

    // Events
    event EmployeeAdded(
        address indexed employee,
        uint256 salaryPerSecond,
        string name
    );
    
    event EmployeeRemoved(
        address indexed employee
    );
    
    event SalaryUpdated(
        address indexed employee,
        uint256 oldSalary,
        uint256 newSalary
    );
    
    event PaymentScheduleSet(
        address indexed employee,
        uint256 amount,
        uint256 frequency,
        uint256 nextPaymentDate
    );
    
    event FundsDeposited(
        address indexed depositor,
        uint256 amount
    );
    
    event PaymentProcessed(
        address indexed employee,
        uint256 amount
    );
    
    event PaymentWithdrawn(
        address indexed employee,
        uint256 amount
    );

    modifier onlyActiveEmployee(address employee) {
        require(employees[employee].isActive, "Employee not active");
        _;
    }

    constructor(
        string memory _organizationName,
        address _owner,
        address _paymentToken
    ) Ownable(_owner) {
        organizationName = _organizationName;
        paymentToken = IERC20(_paymentToken);
    }

    /**
     * @dev Add a new employee to the organization
     * @param employeeAddress The employee's wallet address
     * @param salaryPerSecond The salary amount per second
     * @param name Optional name/identifier for the employee
     */
    function addEmployee(
        address employeeAddress,
        uint256 salaryPerSecond,
        string memory name
    ) external onlyOwner {
        require(employeeAddress != address(0), "Invalid employee address");
        require(employeeAddress != owner(), "Cannot add owner as employee");
        require(!employees[employeeAddress].isActive, "Employee already exists");
        require(salaryPerSecond > 0, "Salary must be greater than 0");

        employees[employeeAddress] = Employee({
            employeeAddress: employeeAddress,
            salaryPerSecond: salaryPerSecond,
            startDate: block.timestamp,
            lastPaymentDate: block.timestamp,
            isActive: true,
            name: name
        });

        employeeList.push(employeeAddress);
        totalEmployees++;

        emit EmployeeAdded(employeeAddress, salaryPerSecond, name);
    }

    /**
     * @dev Remove an employee from the organization
     * @param employeeAddress The employee's wallet address
     */
    function removeEmployee(address employeeAddress) external onlyOwner onlyActiveEmployee(employeeAddress) {
        // Process any pending payments before removal
        _processPayment(employeeAddress);
        
        employees[employeeAddress].isActive = false;
        paymentSchedules[employeeAddress].isActive = false;
        totalEmployees--;

        // Remove from employee list
        for (uint i = 0; i < employeeList.length; i++) {
            if (employeeList[i] == employeeAddress) {
                employeeList[i] = employeeList[employeeList.length - 1];
                employeeList.pop();
                break;
            }
        }

        emit EmployeeRemoved(employeeAddress);
    }

    /**
     * @dev Update an employee's salary
     * @param employeeAddress The employee's wallet address
     * @param newSalaryPerSecond The new salary amount per second
     */
    function updateSalary(
        address employeeAddress,
        uint256 newSalaryPerSecond
    ) external onlyOwner onlyActiveEmployee(employeeAddress) {
        require(newSalaryPerSecond > 0, "Salary must be greater than 0");
        
        // Process payment with old salary first
        _processPayment(employeeAddress);
        
        uint256 oldSalary = employees[employeeAddress].salaryPerSecond;
        employees[employeeAddress].salaryPerSecond = newSalaryPerSecond;

        emit SalaryUpdated(employeeAddress, oldSalary, newSalaryPerSecond);
    }

    /**
     * @dev Set payment schedule for an employee
     * @param employeeAddress The employee's wallet address
     * @param amount The payment amount
     * @param frequency Payment frequency in seconds
     */
    function setPaymentSchedule(
        address employeeAddress,
        uint256 amount,
        uint256 frequency
    ) external onlyOwner onlyActiveEmployee(employeeAddress) {
        require(amount > 0, "Amount must be greater than 0");
        require(frequency > 0, "Frequency must be greater than 0");

        paymentSchedules[employeeAddress] = PaymentSchedule({
            amount: amount,
            nextPaymentDate: block.timestamp + frequency,
            frequency: frequency,
            isActive: true
        });

        emit PaymentScheduleSet(employeeAddress, amount, frequency, block.timestamp + frequency);
    }

    /**
     * @dev Deposit funds to the organization
     * @param amount The amount to deposit
     */
    function depositFunds(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        
        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
        totalFunds += amount;

        emit FundsDeposited(msg.sender, amount);
    }

    /**
     * @dev Process payment for an employee (streaming)
     * @param employeeAddress The employee's wallet address
     */
    function processPayment(address employeeAddress) external onlyActiveEmployee(employeeAddress) {
        _processPayment(employeeAddress);
    }

    /**
     * @dev Process payments for all employees
     */
    function processAllPayments() external onlyOwner {
        for (uint i = 0; i < employeeList.length; i++) {
            if (employees[employeeList[i]].isActive) {
                _processPayment(employeeList[i]);
            }
        }
    }

    /**
     * @dev Internal function to process payment for an employee
     * @param employeeAddress The employee's wallet address
     */
    function _processPayment(address employeeAddress) internal {
        Employee storage employee = employees[employeeAddress];
        if (!employee.isActive) return;

        uint256 timeElapsed = block.timestamp - employee.lastPaymentDate;
        uint256 payment = timeElapsed * employee.salaryPerSecond;

        if (payment > 0 && payment <= totalFunds) {
            availableBalance[employeeAddress] += payment;
            totalPaid[employeeAddress] += payment;
            totalFunds -= payment;
            employee.lastPaymentDate = block.timestamp;

            emit PaymentProcessed(employeeAddress, payment);
        }
    }

    /**
     * @dev Allow employee to withdraw their available balance
     */
    function withdrawPayment() external nonReentrant {
        require(employees[msg.sender].isActive, "Not an active employee");
        
        // Process any pending payments first
        _processPayment(msg.sender);
        
        uint256 amount = availableBalance[msg.sender];
        require(amount > 0, "No funds available");

        availableBalance[msg.sender] = 0;
        paymentToken.safeTransfer(msg.sender, amount);

        emit PaymentWithdrawn(msg.sender, amount);
    }

    /**
     * @dev Get employee details
     * @param employeeAddress The employee's wallet address
     */
    function getEmployee(address employeeAddress) external view returns (
        address,
        uint256,
        uint256,
        uint256,
        bool,
        string memory
    ) {
        Employee memory employee = employees[employeeAddress];
        return (
            employee.employeeAddress,
            employee.salaryPerSecond,
            employee.startDate,
            employee.lastPaymentDate,
            employee.isActive,
            employee.name
        );
    }

    /**
     * @dev Get payment schedule for an employee
     * @param employeeAddress The employee's wallet address
     */
    function getPaymentSchedule(address employeeAddress) external view returns (
        uint256,
        uint256,
        uint256,
        bool
    ) {
        PaymentSchedule memory schedule = paymentSchedules[employeeAddress];
        return (
            schedule.amount,
            schedule.nextPaymentDate,
            schedule.frequency,
            schedule.isActive
        );
    }

    /**
     * @dev Get all employees
     */
    function getAllEmployees() external view returns (address[] memory) {
        return employeeList;
    }

    /**
     * @dev Calculate pending payment for an employee
     * @param employeeAddress The employee's wallet address
     */
    function getPendingPayment(address employeeAddress) external view returns (uint256) {
        Employee memory employee = employees[employeeAddress];
        if (!employee.isActive) return 0;

        uint256 timeElapsed = block.timestamp - employee.lastPaymentDate;
        return timeElapsed * employee.salaryPerSecond;
    }

    /**
     * @dev Get organization stats
     */
    function getOrganizationStats() external view returns (
        uint256 _totalEmployees,
        uint256 _totalFunds,
        uint256 _totalPaidOut
    ) {
        uint256 totalPaidOut = 0;
        for (uint i = 0; i < employeeList.length; i++) {
            totalPaidOut += totalPaid[employeeList[i]];
        }
        
        return (totalEmployees, totalFunds, totalPaidOut);
    }

    /**
     * @dev Emergency withdraw (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = paymentToken.balanceOf(address(this));
        paymentToken.safeTransfer(owner(), balance);
        totalFunds = 0;
    }
}
