//@File ->  It contains verification function for verifying contract.

//@run -> run contains few inbuilt function, which is passed as a string with required values and hardhat does that job.
const { run } = require("hardhat");

const verifyContract = async (contractAddress, args) => {
  console.log("Verifying Contract");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (error) {
    //Sometime the file has already been verified , so etherscan sends the error, so we are handling that here.
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("Already verified");
    } else console.error(error);
  }
};

module.exports = { verifyContract };
