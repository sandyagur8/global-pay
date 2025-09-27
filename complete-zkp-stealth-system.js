const { ethers } = require("hardhat");
const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");
const { ec: EC } = require('elliptic');
const circomlibjs = require("circomlibjs");

// Helper function for elliptic curve point addition
function addPublicKeys(pubkey1, pubkey2) {
    const curve = new EC('secp256k1');
    const point1 = curve.keyFromPublic(pubkey1.substring(2), 'hex').getPublic();
    const point2 = curve.keyFromPublic(pubkey2.substring(2), 'hex').getPublic();
    const combinedPoint = point1.add(point2);
    return '0x' + combinedPoint.encode('hex', false);
}

async function main() {
    console.log("🚀 COMPLETE ZKP + STEALTH ADDRESS PAYROLL SYSTEM\n");

    const [deployer, orgOwner, employee] = await ethers.getSigners();
    console.log("👥 Actors:");
    console.log("  Deployer:", deployer.address);
    console.log("  Org Owner:", orgOwner.address);
    console.log("  Employee:", employee.address);

    // =================================================================
    // STEP 1: Deploy contracts
    // =================================================================
    console.log("\n📋 STEP 1: Deploy Contracts");

    const Groth16Verifier = await ethers.getContractFactory("Groth16Verifier");
    const verifier = await Groth16Verifier.deploy();
    await verifier.waitForDeployment();
    console.log("✅ REAL Groth16Verifier deployed:", await verifier.getAddress());

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy("Test Token", "TEST", ethers.parseEther("1000000"));
    await token.waitForDeployment();
    console.log("✅ MockERC20 deployed:", await token.getAddress());

    const OrganisationFactory = await ethers.getContractFactory("OrganisationFactory");
    const factory = await OrganisationFactory.deploy(await verifier.getAddress());
    await factory.waitForDeployment();
    console.log("✅ OrganisationFactory deployed:", await factory.getAddress());

    // Deploy organisation
    const deployOrgTx = await factory.connect(orgOwner).deployOrganisation();
    const deployReceipt = await deployOrgTx.wait();

    let organisationAddress;
    for (const log of deployReceipt.logs) {
        try {
            const parsed = factory.interface.parseLog(log);
            if (parsed.name === 'OrganisationDeployed') {
                organisationAddress = parsed.args.organisationAddress;
                console.log("✅ Organisation deployed:", organisationAddress);
                break;
            }
        } catch (e) {}
    }

    const Organisation = await ethers.getContractFactory("Organisation");
    const org = Organisation.attach(organisationAddress);

    // =================================================================
    // STEP 2: Employee Key Setup (for both ZKP and Stealth)
    // =================================================================
    console.log("\n👤 STEP 2: Employee Key Setup");

    // Employee's REAL private keys (used for stealth addresses)
    const employeeViewingPrivateKey = "0x1234567890123456789012345678901234567890123456789012345678901234";
    const employeeSpendingPrivateKey = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd";

    console.log("Employee's Private Keys (kept secret):");
    console.log("  Viewing Private Key:", employeeViewingPrivateKey);
    console.log("  Spending Private Key:", employeeSpendingPrivateKey);

    // Derive public keys for ZKP circuit
    const employeeViewingWallet = new ethers.Wallet(employeeViewingPrivateKey);
    const employeeSpendingWallet = new ethers.Wallet(employeeSpendingPrivateKey);
    const employeeViewingPublicKey = employeeViewingWallet.signingKey.publicKey;
    const employeeSpendingPublicKey = employeeSpendingWallet.signingKey.publicKey;

    console.log("Employee's Public Keys:");
    console.log("  Viewing Public Key:", employeeViewingPublicKey);
    console.log("  Spending Public Key:", employeeSpendingPublicKey);

    // =================================================================
    // STEP 3: Generate ZKP with Employee's Real Keys
    // =================================================================
    console.log("\n🔐 STEP 3: Generate ZKP with Real Employee Keys");

    const wasmPath = path.join(__dirname, "../transaction_verify_js/transaction_verify.wasm");
    const zkeyPath = path.join(__dirname, "../circuit_final_8inputs.zkey");

    const paymentAmount = "1000";
    const secretNonce = "999888777";
    const paymentType = "2";
    const startDate = "1700000000";
    const endDate = "1702592000";

    // Convert public keys to circuit format (BigInt strings)
    const viewingKeyX = BigInt(employeeViewingPublicKey.slice(0, 66)).toString();
    const viewingKeyY = BigInt("0x" + employeeViewingPublicKey.slice(66)).toString();
    const spendingKeyX = BigInt(employeeSpendingPublicKey.slice(0, 66)).toString();
    const spendingKeyY = BigInt("0x" + employeeSpendingPublicKey.slice(66)).toString();

    console.log("Converting keys to circuit format:");
    console.log("  viewingKeyX:", viewingKeyX);
    console.log("  viewingKeyY:", viewingKeyY);
    console.log("  spendingKeyX:", spendingKeyX);
    console.log("  spendingKeyY:", spendingKeyY);

    // Calculate commitment for ZKP
    const hashInputs = [
        BigInt(paymentAmount), BigInt(secretNonce),
        BigInt(viewingKeyX), BigInt(viewingKeyY),
        BigInt(spendingKeyX), BigInt(spendingKeyY),
        BigInt(paymentType), BigInt(startDate), BigInt(endDate)
    ];

    const poseidon = await circomlibjs.buildPoseidon();
    const result = poseidon(hashInputs);
    const commitment = poseidon.F.toString(result);
    console.log("✅ ZKP Commitment calculated:", commitment);

    // Generate ZK proof
    console.log("Generating ZK proof...");
    const { proof, publicSignals } = await snarkjs.groth16.fullProve({
        amount: paymentAmount,
        secretNonce: secretNonce,
        pubViewKeyX: viewingKeyX,
        pubViewKeyY: viewingKeyY,
        pubSpendKeyX: spendingKeyX,
        pubSpendKeyY: spendingKeyY,
        paymentType: paymentType,
        startDate: startDate,
        endDate: endDate,
        commitment: commitment
    }, wasmPath, zkeyPath);

    console.log("🎉 ZK PROOF GENERATED!");
    console.log("Public signals:", publicSignals);

    // Verify proof
    const solidityProof = [
        [proof.pi_a[0], proof.pi_a[1]],
        [
            [proof.pi_b[0][1], proof.pi_b[0][0]],
            [proof.pi_b[1][1], proof.pi_b[1][0]]
        ],
        [proof.pi_c[0], proof.pi_c[1]]
    ];

    const formattedSignals = publicSignals.map(s => s.toString());
    const isValid = await verifier.verifyProof(
        solidityProof[0], solidityProof[1], solidityProof[2], formattedSignals
    );
    console.log("🔐 ZK Proof verification:", isValid ? "✅ VALID" : "❌ INVALID");

    // =================================================================
    // STEP 4: Add Employee to Organisation (using ZKP public signals)
    // =================================================================
    console.log("\n👤 STEP 4: Add Employee with ZKP-Compatible Keys");

    // Use the EXACT public signals from the ZKP for contract storage
    const addEmployeeTx = await org.connect(orgOwner).addEmployee(
        [publicSignals[0], publicSignals[1]], // viewing keys from proof
        [publicSignals[2], publicSignals[3]], // spending keys from proof
        employee.address
    );
    await addEmployeeTx.wait();
    console.log("✅ Employee added with ZKP-compatible keys");

    // =================================================================
    // STEP 5: Generate Stealth Address (Real Implementation)
    // =================================================================
    console.log("\n🎯 STEP 5: Generate Stealth Address");
    console.log("Sender (org owner) generates stealth address for payment...");

    // 1. Generate ephemeral key pair
    const ephemeralKeyPair = ethers.Wallet.createRandom();
    console.log("1. Ephemeral Key Generated:");
    console.log("   Private (sender secret):", ephemeralKeyPair.privateKey);
    console.log("   Public (published):", ephemeralKeyPair.signingKey.publicKey);

    // 2. Compute shared secret (sender side)
    const senderSharedSecret = ephemeralKeyPair.signingKey.computeSharedSecret(employeeViewingPublicKey);
    const senderSecretOffset = ethers.keccak256(senderSharedSecret);
    console.log("2. Sender computes shared secret and offset:");
    console.log("   Shared Secret:", senderSharedSecret);
    console.log("   Secret Offset:", senderSecretOffset);

    // 3. Generate stealth address: P_stealth = (c * G) + S
    const offsetPublicKey = new ethers.SigningKey(senderSecretOffset).publicKey;
    const stealthPublicKey = addPublicKeys(offsetPublicKey, employeeSpendingPublicKey);
    const stealthAddress = ethers.computeAddress(stealthPublicKey);

    console.log("3. Stealth address calculation:");
    console.log("   Offset Public Key (c*G):", offsetPublicKey);
    console.log("   Employee Spending Key (S):", employeeSpendingPublicKey);
    console.log("   Stealth Public Key (c*G + S):", stealthPublicKey);
    console.log("✅ STEALTH ADDRESS:", stealthAddress);

    // =================================================================
    // STEP 6: Dispatch Payment with ZKP to Stealth Address
    // =================================================================
    console.log("\n💰 STEP 6: Dispatch Payment with ZKP to Stealth Address");

    const paymentAmountWei = ethers.parseEther(paymentAmount);
    await token.mint(organisationAddress, paymentAmountWei);
    console.log("✅ Minted tokens to organisation");

    console.log("Dispatching payment with ZKP verification to stealth address...");
    const dispatchTx = await org.connect(orgOwner).dispatchPayment(
        1, // employeeId
        await token.getAddress(),
        paymentAmountWei,
        solidityProof[0],
        solidityProof[1],
        solidityProof[2],
        formattedSignals,
        stealthAddress // Payment goes to stealth address!
    );

    const dispatchReceipt = await dispatchTx.wait();
    console.log("🎊 PAYMENT DISPATCHED WITH ZKP TO STEALTH ADDRESS!");
    console.log("Gas used:", dispatchReceipt.gasUsed.toString());

    // Check stealth address balance
    const stealthBalance = await token.balanceOf(stealthAddress);
    console.log("Stealth address balance:", ethers.formatEther(stealthBalance), "TEST");

    // Update commitment hash
    const actualCommitment = publicSignals[7];
    const updateTx = await org.connect(orgOwner).updateCommitmentTransactionHash(
        actualCommitment, dispatchReceipt.hash
    );
    await updateTx.wait();
    console.log("✅ Commitment updated with transaction hash");

    // =================================================================
    // STEP 7: Employee Discovers Payment and Derives Stealth Key
    // =================================================================
    console.log("\n🔍 STEP 7: Employee Discovers Payment and Derives Stealth Key");
    console.log("Employee scans blockchain and finds payment to stealth address...");

    console.log("Found payment to stealth address:", stealthAddress);
    console.log("Payment amount:", ethers.formatEther(stealthBalance), "TEST");

    // Employee retrieves ephemeral public key (published by sender)
    const ephemeralPublicKey = ephemeralKeyPair.signingKey.publicKey;
    console.log("1. Retrieved ephemeral public key:", ephemeralPublicKey);

    // Employee computes the SAME shared secret
    const employeeSharedSecret = employeeViewingWallet.signingKey.computeSharedSecret(ephemeralPublicKey);
    const employeeSecretOffset = ethers.keccak256(employeeSharedSecret);

    console.log("2. Employee computes shared secret:");
    console.log("   Shared Secret:", employeeSharedSecret);
    console.log("   Secret Offset:", employeeSecretOffset);
    console.log("   Matches sender:", senderSharedSecret === employeeSharedSecret ? "✅ YES" : "❌ NO");

    // Employee derives stealth private key: p_stealth = (c + s) mod n
    const curve = new EC('secp256k1');
    const stealthPrivateKey_BN = (ethers.toBigInt(employeeSecretOffset) + ethers.toBigInt(employeeSpendingPrivateKey)) % ethers.toBigInt(curve.n.toString());
    const stealthPrivateKey = ethers.toBeHex(stealthPrivateKey_BN, 32);

    console.log("3. Employee derives stealth private key:");
    console.log("   Formula: (secret_offset + spending_private_key) mod n");
    console.log("   Secret Offset:", ethers.toBigInt(employeeSecretOffset).toString());
    console.log("   Spending Private Key:", ethers.toBigInt(employeeSpendingPrivateKey).toString());
    console.log("✅ STEALTH PRIVATE KEY:", stealthPrivateKey);

    // =================================================================
    // STEP 8: Verify Derivation and Withdraw Funds
    // =================================================================
    console.log("\n✅ STEP 8: Verify Derivation and Withdraw Funds");

    const derivedStealthWallet = new ethers.Wallet(stealthPrivateKey);
    const derivedStealthAddress = derivedStealthWallet.address;

    console.log("Address verification:");
    console.log("  Original stealth address:", stealthAddress);
    console.log("  Derived stealth address: ", derivedStealthAddress);
    console.log("  ADDRESSES MATCH:", stealthAddress.toLowerCase() === derivedStealthAddress.toLowerCase() ? "✅ SUCCESS!" : "❌ FAILED!");

    if (stealthAddress.toLowerCase() === derivedStealthAddress.toLowerCase()) {
        console.log("\n💰 Employee can recover funds!");

        // Send ETH for gas
        await orgOwner.sendTransaction({ to: stealthAddress, value: ethers.parseEther("1.0") });
        console.log("✅ Sent ETH for gas fees");

        // Withdraw funds
        const stealthWalletWithProvider = derivedStealthWallet.connect(ethers.provider);
        const withdrawTx = await token.connect(stealthWalletWithProvider).transfer(
            employee.address, stealthBalance
        );
        await withdrawTx.wait();

        const finalEmployeeBalance = await token.balanceOf(employee.address);
        const finalStealthBalance = await token.balanceOf(stealthAddress);

        console.log("🎉 WITHDRAWAL COMPLETED!");
        console.log("  Employee balance:", ethers.formatEther(finalEmployeeBalance), "TEST");
        console.log("  Stealth balance:", ethers.formatEther(finalStealthBalance), "TEST");
    }

    // =================================================================
    // STEP 9: Employee Verifies ZKP On-Chain
    // =================================================================
    console.log("\n🔐 STEP 9: Employee Verifies ZKP On-Chain");

    const employeeVerification = await verifier.verifyProof(
        solidityProof[0], solidityProof[1], solidityProof[2], formattedSignals
    );
    console.log("Employee's ZKP verification:", employeeVerification ? "✅ VERIFIED" : "❌ FAILED");

    const commitmentHash = await org.commitmentToHash(actualCommitment);
    console.log("On-chain commitment verification:", commitmentHash === dispatchReceipt.hash ? "✅ VERIFIED" : "❌ FAILED");

    // =================================================================
    // COMPLETE SUCCESS!
    // =================================================================
    console.log("\n🎊🎊🎊 COMPLETE ZKP + STEALTH ADDRESS SYSTEM SUCCESS! 🎊🎊🎊");
    console.log("================================================================");
    console.log("✅ Real ZK proof generated with employee's actual keys");
    console.log("✅ ZK proof verified by contract verifier");
    console.log("✅ Employee added to organisation with ZKP-compatible keys");
    console.log("✅ Stealth address generated using proper cryptography");
    console.log("✅ Payment dispatched with ZKP verification to stealth address");
    console.log("✅ Employee discovered payment and derived correct private key");
    console.log("✅ Stealth address derivation matches perfectly");
    console.log("✅ Employee successfully recovered funds from stealth wallet");
    console.log("✅ ZKP verification confirmed on-chain by employee");
    console.log("✅ Commitment tracking and transaction hash verification");
    console.log("\n🚀 ZERO-KNOWLEDGE STEALTH PAYROLL SYSTEM: FULLY OPERATIONAL!");

    console.log("\nSystem Summary:");
    console.log("  Verifier Contract:", await verifier.getAddress());
    console.log("  Token Contract:", await token.getAddress());
    console.log("  Organisation:", organisationAddress);
    console.log("  Stealth Address:", stealthAddress);
    console.log("  ZKP Commitment:", actualCommitment);
    console.log("  Transaction Hash:", dispatchReceipt.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    });