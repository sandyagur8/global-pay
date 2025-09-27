const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying contracts to local network...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy Groth16Verifier first
  console.log("\nDeploying Groth16Verifier...");
  const Verifier = await ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.deployed();
  console.log("Groth16Verifier deployed to:", verifier.address);

  // Deploy MockERC20 with proper parameters
  console.log("\nDeploying MockERC20...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockERC20 = await MockERC20.deploy("Mock USDC", "mUSDC", 1000000); // 1M initial supply
  await mockERC20.deployed();
  console.log("MockERC20 deployed to:", mockERC20.address);

  // Deploy OrganisationFactory
  console.log("\nDeploying OrganisationFactory...");
  const OrganisationFactory = await ethers.getContractFactory("OrganisationFactory");
  const organisationFactory = await OrganisationFactory.deploy(verifier.address);
  await organisationFactory.deployed();
  console.log("OrganisationFactory deployed to:", organisationFactory.address);

  // Verify deployment
  console.log("\nVerifying deployments...");
  const tokenName = await mockERC20.name();
  const tokenSymbol = await mockERC20.symbol();
  const tokenDecimals = await mockERC20.decimals();
  console.log(`MockERC20: ${tokenName} (${tokenSymbol}) with ${tokenDecimals} decimals`);

  const verifierAddress = await organisationFactory.verifierAddress();
  console.log(`OrganisationFactory initialized with verifier: ${verifierAddress}`);

  // Save deployment addresses
  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log(`Groth16Verifier: ${verifier.address}`);
  console.log(`MockERC20: ${mockERC20.address}`);
  console.log(`OrganisationFactory: ${organisationFactory.address}`);
  console.log("===========================");

  // Mint some tokens to the deployer for testing
  console.log("\nMinting test ERC20 tokens...");
  const mintAmount = ethers.utils.parseUnits("10000", 18); // 10,000 tokens (18 decimals)
  await mockERC20.mint(deployer.address, mintAmount);
  const balance = await mockERC20.balanceOf(deployer.address);
  console.log(`Minted ${ethers.utils.formatUnits(balance, 18)} tokens to deployer`);

  // Save addresses to a file for frontend use
  const addresses = {
      Groth16Verifier: verifier.address,
      MockERC20: mockERC20.address,
      OrganisationFactory: organisationFactory.address,
      chainId: 31337
  };

  fs.writeFileSync(path.join(__dirname, '../deployed-addresses.json'), JSON.stringify(addresses, null, 2));
  console.log("\nAddresses saved to deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
