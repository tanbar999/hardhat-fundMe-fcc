const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", async () => {
      let fundMe;
      let deployer;
      let mockV3Aggregator;

      const sendValue = ethers.utils.parseEther("1");

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        fundMe = await ethers.getContract("FundMe", deployer);
        mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
      });

      describe("Constructor", async () => {
        it("sets the Aggregator address correctly", async () => {
          const response = await fundMe.getPriceFeed();
          assert.equal(response, mockV3Aggregator.address);
        });
      });

      describe("fund", async () => {
        it("Fails if you don't send enough ethers", async () => {
          await expect(fundMe.fund()).to.be.revertedWith("ETH amount is too low");
        });
        it("Adds s_funders address to s_addressToAmountFunded", async () => {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmountFunded(deployer);
          assert.equal(response.toString(), sendValue.toString());
        });
        it("s_funders are being added to s_funders array", async () => {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getFunders(0);
          assert.equal(response, deployer);
        });
      });

      describe("Withdraw", async () => {
        beforeEach(async () => {
          await fundMe.fund({ value: sendValue });
        });
        it("Withdraw ETH from a funder", async () => {
          const startingfundMeBalance = await fundMe.provider.getBalance(fundMe.address);
          const startingDeployerBalance = await fundMe.provider.getBalance(deployer);

          const txnResponse = await fundMe.withdraw();
          const txnReceipt = await txnResponse.wait(1);

          const { gasUsed, effectiveGasPrice } = txnReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
          const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

          assert.equal(endingFundMeBalance.toString(), 0);
          assert.equal(
            startingDeployerBalance.add(startingfundMeBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
        });

        it("Cheaper Withdraw ETH from a funder", async () => {
          const startingfundMeBalance = await fundMe.provider.getBalance(fundMe.address);
          const startingDeployerBalance = await fundMe.provider.getBalance(deployer);

          const txnResponse = await fundMe.cheaperWithdraw();
          const txnReceipt = await txnResponse.wait(1);

          const { gasUsed, effectiveGasPrice } = txnReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
          const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

          assert.equal(endingFundMeBalance.toString(), 0);
          assert.equal(
            startingDeployerBalance.add(startingfundMeBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
        });

        it("Withdraws from multiple s_funders correctly", async () => {
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedAccount = await fundMe.connect(accounts[i]);
            await fundMeConnectedAccount.fund({ value: sendValue });
          }
          const startingfundMeBalance = await fundMe.provider.getBalance(fundMe.address);
          const startingDeployerBalance = await fundMe.provider.getBalance(deployer);

          const txnResponse = await fundMe.withdraw();
          const txnReceipt = await txnResponse.wait(1);

          const { gasUsed, effectiveGasPrice } = txnReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
          const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

          assert.equal(endingFundMeBalance.toString(), 0);
          assert.equal(
            startingDeployerBalance.add(startingfundMeBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );

          await expect(fundMe.getFunders(0)).to.be.reverted;
          for (let i = 0; i < 6; i++) {
            assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0);
          }
        });

        it("only owner should be allowed to withdraw", async () => {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];
          const fundMeConnectedAttacker = await fundMe.connect(attacker);
          await expect(fundMeConnectedAttacker.withdraw()).to.be.revertedWith("FundMe__NotOwner");
        });

        it("Cheaper Withdraw from multiple s_funders correctly", async () => {
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedAccount = await fundMe.connect(accounts[i]);
            await fundMeConnectedAccount.fund({ value: sendValue });
          }
          const startingfundMeBalance = await fundMe.provider.getBalance(fundMe.address);
          const startingDeployerBalance = await fundMe.provider.getBalance(deployer);

          const txnResponse = await fundMe.cheaperWithdraw();
          const txnReceipt = await txnResponse.wait(1);

          const { gasUsed, effectiveGasPrice } = txnReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
          const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

          assert.equal(endingFundMeBalance.toString(), 0);
          assert.equal(
            startingDeployerBalance.add(startingfundMeBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );

          await expect(fundMe.getFunders(0)).to.be.reverted;
          for (let i = 0; i < 6; i++) {
            assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0);
          }
        });
      });
    });
