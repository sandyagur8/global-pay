const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying contracts to Rootstock Testnet...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy MockUSDC first
  console.log("\nDeploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("MockUSDC deployed to:", mockUSDCAddress);

  // Deploy OrganizationFactory
  console.log("\nDeploying OrganizationFactory...");
  const OrganizationFactory = await ethers.getContractFactory("OrganizationFactory");
  const organizationFactory = await OrganizationFactory.deploy(mockUSDCAddress);
  await organizationFactory.waitForDeployment();
  const factoryAddress = await organizationFactory.getAddress();
  console.log("OrganizationFactory deployed to:", factoryAddress);

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
  console.log(`MockUSDC: ${mockUSDCAddress}`);
  console.log(`OrganizationFactory: ${factoryAddress}`);
  console.log("===========================");

  // Mint some USDC to the deployer for testing
  console.log("\nMinting test USDC tokens...");
  const mintAmount = ethers.parseUnits("10000", 6); // 10,000 USDC
  await mockUSDC.mint(deployer.address, mintAmount);
  const balance = await mockUSDC.balanceOf(deployer.address);
  console.log(`Minted ${ethers.formatUnits(balance, 6)} USDC to deployer`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
