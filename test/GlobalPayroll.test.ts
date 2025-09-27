import { expect } from "chai";
import { ethers } from "hardhat";
import { GlobalPayroll, MockUSDC } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("GlobalPayroll", function () {
  let globalPayroll: GlobalPayroll;
  let mockUSDC: MockUSDC;
  let owner: HardhatEthersSigner;
  let employer: HardhatEthersSigner;
  let employee: HardhatEthersSigner;

  const AMOUNT_PER_SECOND = ethers.parseUnits("0.01", 6); // 0.01 USDC per second
  const DURATION = 30 * 24 * 60 * 60; // 30 days in seconds
  const FUNDING_AMOUNT = ethers.parseUnits("1000", 6); // 1000 USDC

  beforeEach(async function () {
    [owner, employer, employee] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();

    // Deploy GlobalPayroll
    const GlobalPayroll = await ethers.getContractFactory("GlobalPayroll");
    globalPayroll = await GlobalPayroll.deploy();
    await globalPayroll.waitForDeployment();

    // Mint USDC to employer
    await mockUSDC.mint(employer.address, FUNDING_AMOUNT);
  });

  describe("Stream Creation", function () {
    it("Should create a payment stream successfully", async function () {
      await expect(
        globalPayroll.connect(employer).createStream(
          employee.address,
          AMOUNT_PER_SECOND,
          DURATION,
          await mockUSDC.getAddress()
        )
      ).to.emit(globalPayroll, "StreamCreated");

      const streamId = 0;
      const stream = await globalPayroll.getStream(streamId);
      
      expect(stream.employer).to.equal(employer.address);
      expect(stream.employee).to.equal(employee.address);
      expect(stream.amountPerSecond).to.equal(AMOUNT_PER_SECOND);
      expect(stream.isActive).to.be.true;
    });

    it("Should fail to create stream with invalid parameters", async function () {
      await expect(
        globalPayroll.connect(employer).createStream(
          ethers.ZeroAddress,
          AMOUNT_PER_SECOND,
          DURATION,
          await mockUSDC.getAddress()
        )
      ).to.be.revertedWith("Invalid employee address");

      await expect(
        globalPayroll.connect(employer).createStream(
          employer.address,
          AMOUNT_PER_SECOND,
          DURATION,
          await mockUSDC.getAddress()
        )
      ).to.be.revertedWith("Cannot create stream to self");
    });
  });

  describe("Stream Funding", function () {
    let streamId: number;

    beforeEach(async function () {
      await globalPayroll.connect(employer).createStream(
        employee.address,
        AMOUNT_PER_SECOND,
        DURATION,
        await mockUSDC.getAddress()
      );
      streamId = 0;
    });

    it("Should fund a stream successfully", async function () {
      await mockUSDC.connect(employer).approve(await globalPayroll.getAddress(), FUNDING_AMOUNT);
      
      await expect(
        globalPayroll.connect(employer).fundStream(streamId, FUNDING_AMOUNT)
      ).to.emit(globalPayroll, "StreamFunded");

      const stream = await globalPayroll.getStream(streamId);
      expect(stream.totalFunded).to.equal(FUNDING_AMOUNT);
    });

    it("Should fail to fund with insufficient allowance", async function () {
      await expect(
        globalPayroll.connect(employer).fundStream(streamId, FUNDING_AMOUNT)
      ).to.be.reverted;
    });
  });

  describe("Withdrawals", function () {
    let streamId: number;

    beforeEach(async function () {
      await globalPayroll.connect(employer).createStream(
        employee.address,
        AMOUNT_PER_SECOND,
        DURATION,
        await mockUSDC.getAddress()
      );
      streamId = 0;

      // Fund the stream
      await mockUSDC.connect(employer).approve(await globalPayroll.getAddress(), FUNDING_AMOUNT);
      await globalPayroll.connect(employer).fundStream(streamId, FUNDING_AMOUNT);
    });

    it("Should calculate balance correctly", async function () {
      // Fast forward time by 100 seconds
      await ethers.provider.send("evm_increaseTime", [100]);
      await ethers.provider.send("evm_mine", []);

      const balance = await globalPayroll.balanceOf(streamId);
      const expectedBalance = AMOUNT_PER_SECOND * BigInt(100);
      expect(balance).to.be.closeTo(expectedBalance, ethers.parseUnits("0.1", 6));
    });

    it("Should allow employee to withdraw earned amount", async function () {
      // Fast forward time by 100 seconds
      await ethers.provider.send("evm_increaseTime", [100]);
      await ethers.provider.send("evm_mine", []);

      const balance = await globalPayroll.balanceOf(streamId);
      
      await expect(
        globalPayroll.connect(employee).withdrawFromStream(streamId, balance)
      ).to.emit(globalPayroll, "Withdrawal");

      const employeeBalance = await mockUSDC.balanceOf(employee.address);
      expect(employeeBalance).to.equal(balance);
    });

    it("Should fail withdrawal by non-employee", async function () {
      await ethers.provider.send("evm_increaseTime", [100]);
      await ethers.provider.send("evm_mine", []);

      const balance = await globalPayroll.balanceOf(streamId);
      
      await expect(
        globalPayroll.connect(employer).withdrawFromStream(streamId, balance)
      ).to.be.revertedWith("Only employee can withdraw");
    });
  });

  describe("Stream Management", function () {
    let streamId: number;

    beforeEach(async function () {
      await globalPayroll.connect(employer).createStream(
        employee.address,
        AMOUNT_PER_SECOND,
        DURATION,
        await mockUSDC.getAddress()
      );
      streamId = 0;

      await mockUSDC.connect(employer).approve(await globalPayroll.getAddress(), FUNDING_AMOUNT);
      await globalPayroll.connect(employer).fundStream(streamId, FUNDING_AMOUNT);
    });

    it("Should cancel stream and return funds", async function () {
      const initialEmployerBalance = await mockUSDC.balanceOf(employer.address);
      
      await expect(
        globalPayroll.connect(employer).cancelStream(streamId)
      ).to.emit(globalPayroll, "StreamCancelled");

      const stream = await globalPayroll.getStream(streamId);
      expect(stream.isActive).to.be.false;

      // Employer should get back the funded amount (minus any employee withdrawals)
      const finalEmployerBalance = await mockUSDC.balanceOf(employer.address);
      expect(finalEmployerBalance).to.be.gt(initialEmployerBalance);
    });

    it("Should get employer and employee streams", async function () {
      const employerStreams = await globalPayroll.getEmployerStreams(employer.address);
      const employeeStreams = await globalPayroll.getEmployeeStreams(employee.address);

      expect(employerStreams.length).to.equal(1);
      expect(employeeStreams.length).to.equal(1);
      expect(employerStreams[0]).to.equal(streamId);
      expect(employeeStreams[0]).to.equal(streamId);
    });
  });
});
