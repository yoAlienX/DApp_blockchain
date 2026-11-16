require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL?.trim() || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY?.trim() ? [process.env.DEPLOYER_PRIVATE_KEY.trim()] : [],
      chainId: 11155111
    }
  }
};
