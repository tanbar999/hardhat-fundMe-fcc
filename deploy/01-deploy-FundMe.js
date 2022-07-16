/*
 * @networkConfig -> stores network's name and chainId as a hashtable.
 * @developmentChains -> its an array where our localNetwork names are stored.
 */
const { networkConfig, developmentChains } = require("../helper-hardhat-config");

//@network ->  package provided by hardhat for network.config
const { network } = require("hardhat");

// @verifyContract -> for the verification, it contains verifyContract function.
const { verifyContract } = require("../utils/verifyContract");

// @getNamedAccounts -> it gets the namedAccounts details stored in hardhat.config.js file, it is a way to store different private key     for different chains
// @deployments -> This is a package also in hre(hardhat runtime environment). It contains important functions like deploy,get etc.
module.exports = async ({ getNamedAccounts, deployments }) => {
  // just getting deployer, deploy and get from deployments and getNamedAccounts.
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  //ethUsdPriceFeedAddress -> This will have an address, we need to pass it on and address will change as per the network so we have used let here
  let ethUsdPriceFeedAddress;

  //assigning ethUsdPriceFeedAddress here.
  if (developmentChains.includes(network.name)) {
    //@get -> It gets the latest deployed version of the contract.
    const ethUsdAggregator = await get("MockV3Aggregator");

    //storing its address.
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    //@networkConfig -> It stores the address of chainLink contract as per the chainId
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  }
  console.log("------------------------------------------------");

  const args = [ethUsdPriceFeedAddress];

  //@Deploy -> it deploys the contracts FundeMe here.
  //@from -> it require the private key, which we are passing using hardhat.config.js
  //@args ->  It required the constructor arguments in the form of array[].
  //@waitConfirmations -> It will wait for that number of blocks to confirm the deployment and then will store in fundMe
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  //We are just making sure that if network is local then we dont need to verify the contract
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    await verifyContract(fundMe.address, args);
  }
  console.log("------------------------------------------------");
};

//@tags ->  we provide tags so that when we need to run only on file we can use those tags by using --tags
module.exports.tags = ["all"];
