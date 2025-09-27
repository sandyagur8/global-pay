const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying contracts to local network...");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Deploy MockUSDC first
    console.log("\nDeploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.deployed();
    console.log("MockUSDC deployed to:", mockUSDC.address);

    // Deploy OrganizationFactory
    console.log("\nDeploying OrganizationFactory...");
    const OrganizationFactory = await ethers.getContractFactory("OrganizationFactory");
    const organizationFactory = await OrganizationFactory.deploy(mockUSDC.address);
    await organizationFactory.deployed();
    console.log("OrganizationFactory deployed to:", organizationFactory.address);

    // Verify deployment
    console.log("\nVerifying deployments...");
    const usdcName = await mockUSDC.name();
    const usdcSymbol = await mockUSDC.symbol();
    const usdcDecimals = await mockUSDC.decimals();
    console.log(`MockUSDC: ${usdcName} (${usdcSymbol}) with ${usdcDecimals} decimals`);

    const defaultToken = await organizationFactory.defaultPaymentToken();
    console.log(`OrganizationFactory initialized with default token: ${defaultToken}`);

    // Save deployment addresses
    console.log("\n=== DEPLOYMENT SUMMARY ===");
    console.log(`MockUSDC: ${mockUSDC.address}`);
    console.log(`OrganizationFactory: ${organizationFactory.address}`);
    console.log("===========================");

    // Mint some USDC to the deployer for testing
    console.log("\nMinting test USDC tokens...");
    const mintAmount = ethers.utils.parseUnits("10000", 6); // 10,000 USDC
    await mockUSDC.mint(deployer.address, mintAmount);
    const balance = await mockUSDC.balanceOf(deployer.address);
    console.log(`Minted ${ethers.utils.formatUnits(balance, 6)} USDC to deployer`);

    // Save addresses to a file for frontend use
    const fs = require('fs');
    const addresses = {
        MockUSDC: mockUSDC.address,
        OrganizationFactory: organizationFactory.address,
        chainId: 1337
    };

    fs.writeFileSync('./deployed-addresses.json', JSON.stringify(addresses, null, 2));
    console.log("\nAddresses saved to deployed-addresses.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });