// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @dev A mock USDC token for testing purposes
 */
contract MockUSDC is ERC20, Ownable {
    uint8 private _decimals;

    constructor() ERC20("Mock USD Coin", "USDC") Ownable(msg.sender) {
        _decimals = 6; // USDC has 6 decimals
        _mint(msg.sender, 1000000 * 10**_decimals); // Mint 1M USDC to deployer
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Mints tokens to a specified address (for testing)
     * @param to The address to mint tokens to
     * @param amount The amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Allows anyone to mint tokens for testing purposes
     * @param amount The amount to mint to the caller
     */
    function faucet(uint256 amount) external {
        require(amount <= 10000 * 10**_decimals, "Faucet limit exceeded");
        _mint(msg.sender, amount);
    }
}
