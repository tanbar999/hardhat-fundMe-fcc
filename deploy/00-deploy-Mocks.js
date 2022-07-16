//@File -> This is MOCKING, we deploy a mock version for our local network such that chainlink contracts can be used.

//@network ->  package provided by hardhat for network.config
const { network } = require("hardhat");

//@developmentChains -> its an array where our localNetwork names are stored.
//DECIMALS, INITIAL_ANSWER -> These are values required by MockV3Aggregator contract's constructor
const { developmentChains, DECIMALS, INITIAL_ANSWER } = require("../helper-hardhat-config");

// @getNamedAccounts -> it gets the namedAccounts details stored in hardhat.config.js file, it is a way to store different private key     for different chains
// @deployments -> This is a package also in hre(hardhat runtime environment). It contains important functions like deploy,get etc.
module.exports = async ({ getNamedAccounts, deployments }) => {
  // just getting deployer, deploy and get from deployments and getNamedAccounts.
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  //just checking whether network in use is local. If yes -> then only we need mocking
  if (developmentChains.includes(network.name)) {
    console.log("Development Chain detected. Deploying Mocks....");

    //@Deploy -> it deploys the contracts FundeMe here.
    //@from -> it require the private key, which we are passing using hardhat.config.js
    //@args ->  It required the constructor arguments in the form of array[].
    await deploy("MockV3Aggregator", {
      contract: "MockV3Aggregator",
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_ANSWER],
    });
    console.log("Mocks Deployed...");
    console.log("---------------------------------------------------");
  }
};

//@tags ->  we provide tags so that when we need to run only on file we can use those tags by using --tags mocks
module.exports.tags = ["all", "mocks"];
